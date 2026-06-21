import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/CheckIn.css'
import '../styles/CheckOut.css'
import Navbar from '../components/common/Navbar'
import QRSessionModal from '../components/common/QRSessionModal'
import { useCheckoutCameraSession, SESSION_PHASES } from '../hooks/useCheckoutCameraSession'
import { useCheckoutScanSession, SCAN_SESSION_PHASES } from '../hooks/useCheckoutScanSession'
import { verifyGuestCheckOut, verifyBookingCheckOut, confirmGuestCheckOut, confirmBookingCheckOut } from '../services/checkOutService'
import { syncCheckoutPaymentStatus } from '../services/paymentService'
import { parseCheckoutQrContent } from '../utils/checkoutQr'
import { redirectToLoginIfUnauthorized } from '../utils/authRedirect'

function formatCurrency(value) {
  if (value === null || value === undefined) return '—'
  return `${Math.round(value).toLocaleString('vi-VN')}đ`
}

function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return '—'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${h}h${String(m).padStart(2, '0')}m`
}

function ScanTicketModal({ phase, scanData, mobileUrl, error, onClose }) {
  const [secondsLeft, setSecondsLeft] = useState(null)

  useEffect(() => {
    if (!scanData?.expiresAt) return

    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(scanData.expiresAt) - Date.now()) / 1000))
      setSecondsLeft(diff)
    }

    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [scanData?.expiresAt])

  const isCreating = phase === SCAN_SESSION_PHASES.CREATING
  const status = scanData?.status
  const qrImage = mobileUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(mobileUrl)}`
    : null

  return (
    <div className="sci-qr-modal-overlay" onClick={onClose}>
      <div className="sci-qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sci-qr-modal-header">
          <h3 className="sci-panel-heading">Quét mã QR</h3>
          <button className="sci-qr-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="sci-qr-modal-body">
          {isCreating && (
            <div className="sci-qr-loading">
              <span className="sci-qr-spinner" />
              <p>Đang tạo phiên quét...</p>
            </div>
          )}
          {!isCreating && qrImage && (
            <>
              <img className="sci-qr-image" src={qrImage} alt="QR mở trang quét trên điện thoại" />
              <p className="sci-qr-link">{mobileUrl}</p>
              <p className="sci-form-hint">
                Mở link này trên điện thoại để quét mã vé/booking của khách. Thông tin sẽ tự
                động điền vào ô bên dưới khi quét xong.
              </p>
            </>
          )}
          {!isCreating && status === 'Pending' && secondsLeft !== null && (
            <p className={`sci-qr-timer ${secondsLeft < 60 ? 'sci-qr-timer--warning' : ''}`}>
              Hết hạn sau: {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
            </p>
          )}
          {status === 'Expired' && <p className="sci-confirm-error">Phiên quét đã hết hạn.</p>}
          {status === 'Cancelled' && <p className="sci-confirm-error">Phiên quét đã bị huỷ.</p>}
          {error && <p className="sci-confirm-error">{error}</p>}
        </div>
        <div className="sci-qr-modal-footer co-scan-modal-footer">
          <button className="sci-confirm-btn" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  )
}

function PaymentQrModal({ payment, onClose }) {
  const qrImage = payment?.qrCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(payment.qrCode)}`
    : null

  return (
    <div className="sci-qr-modal-overlay" onClick={onClose}>
      <div className="sci-qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sci-qr-modal-header">
          <h3 className="sci-panel-heading">Quét mã thanh toán</h3>
          <button className="sci-qr-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="sci-qr-modal-body">
          {qrImage ? (
            <img className="sci-qr-image" src={qrImage} alt="Mã QR thanh toán PayOS" />
          ) : (
            <p className="sci-form-hint">Chưa có mã QR thanh toán.</p>
          )}
          <div className="co-fee-box">
            <span className="co-fee-label">Số tiền cần thanh toán</span>
            <span className="co-fee-value">{formatCurrency(payment?.additionalAmountDue)}</span>
          </div>
          <p className="sci-form-hint">
            Khách quét mã hoặc mở link thanh toán qua PayOS. Hệ thống sẽ tự kiểm tra và bật
            nút &quot;Mở cổng&quot; khi thanh toán hoàn tất.
          </p>
        </div>
        <div className="sci-qr-modal-footer co-scan-modal-footer">
          <button className="sci-confirm-btn" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  )
}

function CheckOut() {
  const navigate = useNavigate()
  const [isLoggedIn] = useState(!!localStorage.getItem('token'))
  const [now, setNow] = useState(new Date())

  // Quét/nhập mã vé hoặc booking
  const [showScanModal, setShowScanModal] = useState(false)
  const [ticketInput, setTicketInput] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState(null)
  const [sessionInfo, setSessionInfo] = useState(null) // { flowType: 'guest' | 'booking', ...verifyResponse }

  // Ghi chú & thanh toán
  const [note, setNote] = useState('')
  const [isPaying, setIsPaying] = useState(false)
  const [confirmError, setConfirmError] = useState(null)
  const [confirmSuccess, setConfirmSuccess] = useState(null)
  const [result, setResult] = useState(null)
  const [exitTimeAt, setExitTimeAt] = useState(null)
  const [showPaymentQrModal, setShowPaymentQrModal] = useState(false)
  const statusPollRef = useRef(null)

  // Camera session chụp ảnh check-out
  const [showQrModal, setShowQrModal] = useState(false)
  const {
    phase,
    sessionData: checkoutSessionData,
    mobileUrl,
    error: checkoutError,
    startSession,
    cancelSession: cancelCheckoutCameraSession,
  } = useCheckoutCameraSession()

  // Phiên quét QR vé/booking từ điện thoại khách (api/check-out/scan-sessions)
  const {
    phase: scanPhase,
    scanData,
    mobileUrl: scanMobileUrl,
    error: scanError,
    startSession: startScanSession,
    cancelSession: cancelScanSession,
    reset: resetScanSession,
  } = useCheckoutScanSession()

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (phase === SESSION_PHASES.CREATING || phase === SESSION_PHASES.ACTIVE) {
      setShowQrModal(true)
    } else if (phase === SESSION_PHASES.DONE) {
      setShowQrModal(false)
    }
  }, [phase])

  const isCheckoutSessionActive = phase === SESSION_PHASES.ACTIVE

  function handleCloseQrModal() {
    setShowQrModal(false)
  }

  // Huỷ phiên camera check-out hiện tại — gọi API cancel rồi đóng modal
  // (cancelSession chỉ dọn state về IDLE, không tự đóng modal như khi DONE).
  async function handleCancelQrModal() {
    await cancelCheckoutCameraSession()
    setShowQrModal(false)
  }

  const runVerify = useCallback(
    async (parsed) => {
      setVerifyError(null)
      setVerifyLoading(true)
      try {
        let info
        if (parsed.flowType === 'booking') {
          const { data } = await verifyBookingCheckOut(
            parsed.bookingId ? { bookingId: parsed.bookingId } : { bookingQrCode: parsed.raw }
          )
          info = { flowType: 'booking', ...data }
        } else {
          const { data } = await verifyGuestCheckOut(
            parsed.sessionCode ? { sessionCode: parsed.sessionCode } : { ticketQrCode: parsed.raw }
          )
          info = { flowType: 'guest', ...data }
        }
        setSessionInfo(info)
        setResult(null)
        setConfirmError(null)
        setConfirmSuccess(null)
        startSession(info.parkingSessionId, parsed.flowType === 'booking' ? 'BOOKING' : 'GUEST')
      } catch (err) {
        if (redirectToLoginIfUnauthorized(err, navigate)) return
        setVerifyError(err.message || 'Không tìm thấy thông tin. Vui lòng kiểm tra lại mã.')
      } finally {
        setVerifyLoading(false)
      }
    },
    [navigate, startSession]
  )

  function openScanModal() {
    setTicketInput('')
    startScanSession()
  }

  function handleCloseScanModal() {
    cancelScanSession()
    resetScanSession()
    setShowScanModal(false)
  }

  // Hiện modal QR trong suốt thời gian phiên quét đang được tạo/chờ khách quét
  useEffect(() => {
    if (scanPhase === SCAN_SESSION_PHASES.IDLE) {
      setShowScanModal(false)
    } else {
      setShowScanModal(true)
    }
  }, [scanPhase])

  // Khi khách quét xong (status Completed), lấy sessionCode/bookingId để tra cứu tự động
  useEffect(() => {
    if (scanPhase !== SCAN_SESSION_PHASES.DONE || scanData?.status !== 'Completed') return

    const parsed =
      scanData.qrType === 'booking'
        ? { flowType: 'booking', bookingId: scanData.bookingId }
        : { flowType: 'guest', sessionCode: scanData.sessionCode }

    setShowScanModal(false)
    resetScanSession()
    runVerify(parsed)
  }, [scanPhase, scanData, resetScanSession, runVerify])

  async function handleLookup() {
    const parsed = parseCheckoutQrContent(ticketInput)
    if (!parsed) return
    await runVerify({ ...parsed, raw: ticketInput.trim() })
  }

  const stopStatusPolling = useCallback(() => {
    if (statusPollRef.current !== null) {
      clearInterval(statusPollRef.current)
      statusPollRef.current = null
    }
  }, [])

  useEffect(() => stopStatusPolling, [stopStatusPolling])

  const pollParkingSessionStatus = useCallback(async () => {
    if (!sessionInfo) return
    // Đồng bộ trạng thái thanh toán trực tiếp từ PayOS (fallback khi webhook
    // không tới) — không đụng tới số tiền/qrCode đã chốt lúc /confirm, nếu
    // không "Tổng phí" hiển thị sẽ trôi khỏi số tiền QR.
    const data = await syncCheckoutPaymentStatus(sessionInfo.parkingSessionId)
    if (!data) return // lỗi tạm thời — vòng poll tiếp theo sẽ tự thử lại
    setResult((prev) => ({ ...prev, parkingSessionStatus: data.parkingSessionStatus }))
    if (data.parkingSessionStatus === 'completed') {
      stopStatusPolling()
      setShowPaymentQrModal(false)
      setConfirmSuccess('Thanh toán thành công! Có thể mở cổng.')
    }
  }, [sessionInfo, stopStatusPolling])

  const startStatusPolling = useCallback(() => {
    stopStatusPolling()
    statusPollRef.current = setInterval(pollParkingSessionStatus, 3000)
  }, [stopStatusPolling, pollParkingSessionStatus])

  async function handlePayment() {
    if (!sessionInfo) return
    setConfirmError(null)
    setConfirmSuccess(null)
    setIsPaying(true)
    try {
      // Checkout chỉ dùng PayOS — Backend tự tính số tiền, Frontend không gửi paidAmount.
      const { data } =
        sessionInfo.flowType === 'booking'
          ? await confirmBookingCheckOut({
              bookingId: sessionInfo.bookingId,
              parkingSessionId: sessionInfo.parkingSessionId,
              paymentMethod: 'payos',
              note: note.trim() || undefined,
              checkoutCameraSessionId: checkoutSessionData?.sessionId,
              staffConfirmedImageMatch: true,
            })
          : await confirmGuestCheckOut({
              parkingSessionId: sessionInfo.parkingSessionId,
              sessionCode: sessionInfo.sessionCode,
              paymentMethod: 'payos',
              note: note.trim() || undefined,
              checkoutCameraSessionId: checkoutSessionData?.sessionId,
              staffConfirmedImageMatch: true,
            })
      setResult(data)
      setExitTimeAt(new Date())

      if (data.parkingSessionStatus === 'completed') {
        setConfirmSuccess('Thanh toán thành công! Có thể mở cổng.')
      } else if (data.qrCode) {
        setShowPaymentQrModal(true)
        startStatusPolling()
      } else {
        setConfirmError('Không nhận được mã QR thanh toán. Vui lòng thử lại.')
      }
    } catch (err) {
      if (redirectToLoginIfUnauthorized(err, navigate)) return
      setConfirmError(err.message || 'Lỗi kết nối server. Vui lòng thử lại.')
    } finally {
      setIsPaying(false)
    }
  }

  function handleOpenBarrier() {
    window.location.reload()
  }

  const vehicleImg = checkoutSessionData?.checkinVehicleImg
  const faceImg = checkoutSessionData?.checkinFaceImg
  const detectedPlate = checkoutSessionData?.detectedLicensePlate

  const entryTime = sessionInfo?.entryTime
  const exitTime = exitTimeAt ?? now
  const durationMinutes = entryTime
    ? Math.max(0, Math.floor((exitTime - new Date(entryTime)) / 60000))
    : null

  // Backend tự tính tiền — đọc từ verify response, và sau khi confirm thì
  // CheckoutPaymentResponseDto trả về các field tương đương để cập nhật lại.
  const feeSource = result ?? sessionInfo
  const actualUsageFee = feeSource?.actualUsageFee ?? null
  const prepaidAmount = feeSource?.prepaidAmount ?? sessionInfo?.depositPaid ?? null
  const additionalAmountDue = feeSource?.additionalAmountDue ?? null
  const isPrepaidNonRefundable = feeSource?.isPrepaidNonRefundable ?? false
  const totalFee =
    feeSource?.finalParkingFee ??
    (sessionInfo?.flowType === 'booking'
      ? sessionInfo?.estimatedCheckoutAmountDue ?? null
      : sessionInfo?.estimatedFee ?? null)

  const barrierReady = result?.parkingSessionStatus === 'completed'
  const hasPendingPaymentQr = !!result?.qrCode && !barrierReady

  return (
    <div className="sci-page co-page">
      <Navbar isLoggedIn={isLoggedIn} />

      <div className="sci-body">
        {/* Sidebar */}
        <aside className="sci-sidebar">
          <p className="sci-section-label">CHỨC NĂNG</p>
          <ul className="sci-sidebar-list">
            <li className="sci-sidebar-item sci-sidebar-item--active">
              Check-in / Check-out
            </li>
            <li className="sci-sidebar-item">
              Xử lý sự cố
              <span className="sci-incident-badge">2</span>
            </li>
            <li className="sci-sidebar-item">Lịch sử ca</li>
          </ul>
          <p className="sci-section-label sci-section-label--support">HỖ TRỢ</p>
          <ul className="sci-sidebar-list">
            <li className="sci-sidebar-item">Hướng dẫn</li>
            <li className="sci-sidebar-item">Liên hệ quản lý</li>
          </ul>
        </aside>

        {/* Main */}
        <main className="sci-main">
          <div className="co-top-bar">
            <h1 className="sci-page-title">Check-out</h1>
            <button className="co-incident-btn" type="button">
              Ghi nhận sự cố
            </button>
          </div>

          <div className="co-content">
            {/* Ảnh check-in (đã chụp khi xe vào) */}
            <div className="sci-detection-panel">
              <h3 className="sci-panel-heading">
                Ảnh check-in nhận diện phương tiện và tài xế
              </h3>
              <div className="sci-camera-row co-camera-col">
                <div className="sci-camera-box">
                  <p className="sci-camera-label">Biển số xe</p>
                  {sessionInfo?.checkInVehicleImageUrl ? (
                    <div className="sci-camera-img-wrap">
                      <img
                        className="sci-camera-photo"
                        src={sessionInfo.checkInVehicleImageUrl}
                        alt="Ảnh biển số lúc vào"
                      />
                    </div>
                  ) : (
                    <span className="sci-camera-status">
                      {sessionInfo ? 'Không có ảnh' : 'Đang nhận diện...'}
                    </span>
                  )}
                </div>
                <div className="sci-camera-box">
                  <p className="sci-camera-label">Khuôn mặt tài xế</p>
                  {sessionInfo?.checkInFaceImageUrl ? (
                    <div className="sci-camera-img-wrap">
                      <img
                        className="sci-camera-photo"
                        src={sessionInfo.checkInFaceImageUrl}
                        alt="Ảnh khuôn mặt lúc vào"
                      />
                    </div>
                  ) : (
                    <span className="sci-camera-status">
                      {sessionInfo ? 'Không có ảnh' : 'Đang nhận diện...'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Ảnh check-out (chụp lúc xe ra) */}
            <div className="sci-detection-panel">
              <h3 className="sci-panel-heading">
                Ảnh check-out nhận diện phương tiện và tài xế
                {isCheckoutSessionActive && (
                  <span className="sci-session-badge">● Đang chờ...</span>
                )}
              </h3>
              <div className="sci-camera-row co-camera-col">
                <div className="sci-camera-box">
                  <p className="sci-camera-label">Biển số xe</p>
                  {vehicleImg ? (
                    <>
                      <div className="sci-camera-img-wrap">
                        <img className="sci-camera-photo" src={vehicleImg} alt="Ảnh biển số lúc ra" />
                      </div>
                      {detectedPlate && (
                        <span className="sci-camera-ocr">OCR: {detectedPlate}</span>
                      )}
                    </>
                  ) : (
                    <span className="sci-camera-status">
                      {isCheckoutSessionActive ? 'Đang nhận diện...' : 'Chưa có ảnh'}
                    </span>
                  )}
                </div>
                <div className="sci-camera-box">
                  <p className="sci-camera-label">Khuôn mặt tài xế</p>
                  {faceImg ? (
                    <div className="sci-camera-img-wrap">
                      <img className="sci-camera-photo" src={faceImg} alt="Ảnh khuôn mặt lúc ra" />
                    </div>
                  ) : (
                    <span className="sci-camera-status">
                      {isCheckoutSessionActive ? 'Đang nhận diện...' : 'Chưa có ảnh'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Thông tin xe ra */}
            <div className="sci-form-panel co-info-panel">
              <h3 className="sci-panel-heading">Thông tin xe ra</h3>

              <button className="sci-qr-btn" onClick={openScanModal} type="button">
                Quét mã QR
              </button>

              <div className="co-info-grid">
                <div className="co-info-cell" style={{ gridColumn: '1 / -1' }}>
                  <label className="co-info-label" htmlFor="co-ticket-input">MÃ VÉ / BOOKING</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      id="co-ticket-input"
                      className="co-note-input"
                      placeholder="VD: PS-000001 hoặc 9"
                      value={ticketInput}
                      onChange={(e) => setTicketInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                      disabled={!!sessionInfo}
                    />
                    {!sessionInfo && (
                      <button
                        type="button"
                        className="co-confirm-btn"
                        style={{ width: 'auto', padding: '6px 14px', marginTop: 0 }}
                        onClick={handleLookup}
                        disabled={!ticketInput.trim() || verifyLoading}
                      >
                        {verifyLoading ? '...' : 'Tra cứu'}
                      </button>
                    )}
                  </div>
                  {verifyError && <p className="sci-confirm-error">{verifyError}</p>}
                </div>
                <div className="co-info-cell">
                  <p className="co-info-label">BIỂN SỐ</p>
                  <p className="co-info-value">{sessionInfo?.licensePlate ?? '—'}</p>
                </div>
                <div className="co-info-cell">
                  <p className="co-info-label">LOẠI XE</p>
                  <p className="co-info-value">{sessionInfo?.vehicleType ?? '—'}</p>
                </div>
                <div className="co-info-cell">
                  <p className="co-info-label">GIỜ VÀO</p>
                  <p className="co-info-value">{formatDateTime(entryTime)}</p>
                </div>
                <div className="co-info-cell">
                  <label className="co-info-label" htmlFor="co-note">GHI CHÚ</label>
                  <input
                    id="co-note"
                    className="co-note-input"
                    placeholder="—"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>

              {sessionInfo?.flowType === 'booking' && (
                <>
                  <div className="co-time-rows">
                    <div className="co-time-row">
                      <span className="co-time-label">Phí sử dụng thực tế</span>
                      <span className="co-time-value">{formatCurrency(actualUsageFee)}</span>
                    </div>
                    <div className="co-time-row">
                      <span className="co-time-label">Đã đặt cọc</span>
                      <span className="co-time-value">{formatCurrency(prepaidAmount)}</span>
                    </div>
                    <div className="co-time-row">
                      <span className="co-time-label">Phải trả thêm</span>
                      <span className="co-time-value">{formatCurrency(additionalAmountDue)}</span>
                    </div>
                  </div>
                  {isPrepaidNonRefundable && (
                    <p className="sci-form-hint">
                      Khoản trả trước theo thời lượng đặt chỗ không được hoàn lại nếu khách rời sớm.
                    </p>
                  )}
                </>
              )}

              <div className="co-fee-box">
                <span className="co-fee-label">Tổng phí</span>
                <span className="co-fee-value">{formatCurrency(totalFee)}</span>
              </div>

              <div className="co-time-rows">
                <div className="co-time-row">
                  <span className="co-time-label">Giờ vào</span>
                  <span className="co-time-value">
                    {entryTime
                      ? new Date(entryTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </span>
                </div>
                <div className="co-time-row">
                  <span className="co-time-label">Giờ ra</span>
                  <span className="co-time-value">
                    {sessionInfo
                      ? new Date(exitTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </span>
                </div>
                <div className="co-time-row">
                  <span className="co-time-label">Thời gian đỗ</span>
                  <span className="co-time-value">{formatDuration(durationMinutes)}</span>
                </div>
              </div>

              {confirmError && <p className="sci-confirm-error">{confirmError}</p>}
              {confirmSuccess && <p className="sci-confirm-success">{confirmSuccess}</p>}

              <button
                className="co-confirm-btn"
                onClick={handlePayment}
                disabled={!sessionInfo || isPaying || barrierReady}
              >
                {isPaying ? 'Đang xử lý...' : 'Thanh toán'}
              </button>

              {hasPendingPaymentQr && !showPaymentQrModal && (
                <button
                  type="button"
                  className="co-confirm-btn"
                  style={{ marginTop: 8, background: 'transparent', border: '1px solid #d1d5db', color: '#374151' }}
                  onClick={() => setShowPaymentQrModal(true)}
                >
                  Xem lại mã QR thanh toán
                </button>
              )}

              <button
                className="co-confirm-btn"
                style={{ marginTop: 8 }}
                onClick={handleOpenBarrier}
                disabled={!barrierReady}
              >
                ✓ Mở cổng
              </button>

              <p className="sci-form-hint">
                Nhập mã vé/booking hoặc quét mã QR để tự động điền thông tin
              </p>
            </div>
          </div>
        </main>
      </div>

      {showScanModal && (
        <ScanTicketModal
          phase={scanPhase}
          scanData={scanData}
          mobileUrl={scanMobileUrl}
          error={scanError}
          onClose={handleCloseScanModal}
        />
      )}

      {showPaymentQrModal && (
        <PaymentQrModal payment={result} onClose={() => setShowPaymentQrModal(false)} />
      )}

      {showQrModal && (
        <QRSessionModal
          phase={phase}
          mobileUrl={mobileUrl}
          sessionData={checkoutSessionData}
          error={checkoutError}
          onClose={handleCloseQrModal}
          onCancel={handleCancelQrModal}
        />
      )}
    </div>
  )
}

export default CheckOut
