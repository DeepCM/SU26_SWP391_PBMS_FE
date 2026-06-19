import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/CheckIn.css'
import '../styles/CheckOut.css'
import Navbar from '../components/common/Navbar'
import QRSessionModal from '../components/common/QRSessionModal'
import { useCheckoutCameraSession, SESSION_PHASES } from '../hooks/useCheckoutCameraSession'
import { verifyGuestCheckOut, verifyBookingCheckOut, confirmGuestCheckOut, confirmBookingCheckOut } from '../services/checkOutService'
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

const CHECKOUT_SCAN_URL = 'https://parking-car-frontend.vercel.app/staff/checkout/scan'
const CHECKOUT_SCAN_QR_IMAGE = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(CHECKOUT_SCAN_URL)}`

function ScanTicketModal({ onClose }) {
  return (
    <div className="sci-qr-modal-overlay" onClick={onClose}>
      <div className="sci-qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sci-qr-modal-header">
          <h3 className="sci-panel-heading">Quét mã QR</h3>
          <button className="sci-qr-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="sci-qr-modal-body">
          <img className="sci-qr-image" src={CHECKOUT_SCAN_QR_IMAGE} alt="QR mở trang quét trên điện thoại" />
          <p className="sci-qr-link">{CHECKOUT_SCAN_URL}</p>
          <p className="sci-form-hint">
            Mở link này trên điện thoại để quét mã vé/booking của khách, sau đó chụp ảnh checkout.
            Khi xong, nhập lại mã vé/booking ở ô bên dưới để tiếp tục.
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

  // Ghi chú & xác nhận
  const [note, setNote] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState(null)
  const [confirmSuccess, setConfirmSuccess] = useState(null)
  const [result, setResult] = useState(null)

  // Camera session chụp ảnh check-out
  const [showQrModal, setShowQrModal] = useState(false)
  const {
    phase,
    sessionData: checkoutSessionData,
    mobileUrl,
    error: checkoutError,
    startSession,
    reset: resetCheckoutSession,
  } = useCheckoutCameraSession()

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

  function openScanModal() {
    setShowScanModal(true)
  }

  async function handleLookup() {
    const parsed = parseCheckoutQrContent(ticketInput)
    if (!parsed) return

    setVerifyError(null)
    setVerifyLoading(true)
    try {
      let info
      if (parsed.flowType === 'booking') {
        const { data } = await verifyBookingCheckOut(
          parsed.bookingId ? { bookingId: parsed.bookingId } : { bookingQrCode: ticketInput.trim() }
        )
        info = { flowType: 'booking', ...data }
      } else {
        const { data } = await verifyGuestCheckOut(
          parsed.sessionCode ? { sessionCode: parsed.sessionCode } : { ticketQrCode: ticketInput.trim() }
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
  }

  async function handleConfirm() {
    if (!sessionInfo) return
    setConfirmError(null)
    setConfirmSuccess(null)
    setIsConfirming(true)
    try {
      const { data } =
        sessionInfo.flowType === 'booking'
          ? await confirmBookingCheckOut({
              bookingId: sessionInfo.bookingId,
              parkingSessionId: sessionInfo.parkingSessionId,
              paymentMethod: 'Cash',
              paidAmount: sessionInfo.estimatedCheckoutAmountDue,
              note: note.trim() || undefined,
              checkoutCameraSessionId: checkoutSessionData?.sessionId,
              staffConfirmedImageMatch: true,
            })
          : await confirmGuestCheckOut({
              parkingSessionId: sessionInfo.parkingSessionId,
              sessionCode: sessionInfo.sessionCode,
              paymentMethod: 'Cash',
              paidAmount: sessionInfo.estimatedFee,
              note: note.trim() || undefined,
              checkoutCameraSessionId: checkoutSessionData?.sessionId,
              staffConfirmedImageMatch: true,
            })
      setResult(data)
      setConfirmSuccess('Check-out thành công! Barrier đã mở.')
    } catch (err) {
      if (redirectToLoginIfUnauthorized(err, navigate)) return
      setConfirmError(err.message || 'Lỗi kết nối server. Vui lòng thử lại.')
    } finally {
      setIsConfirming(false)
    }
  }

  function handleReset() {
    setSessionInfo(null)
    setResult(null)
    setNote('')
    setTicketInput('')
    setVerifyError(null)
    setConfirmError(null)
    setConfirmSuccess(null)
    resetCheckoutSession()
  }

  const vehicleImg = checkoutSessionData?.checkinVehicleImg
  const faceImg = checkoutSessionData?.checkinFaceImg
  const detectedPlate = checkoutSessionData?.detectedLicensePlate

  const entryTime = sessionInfo?.entryTime
  const exitTime = result?.exitTime ?? now
  const durationMinutes = result
    ? result.durationMinutes
    : entryTime
      ? Math.max(0, Math.floor((now - new Date(entryTime)) / 60000))
      : null
  const totalFee = result
    ? result.checkoutAmountDue
    : sessionInfo?.flowType === 'booking'
      ? sessionInfo?.estimatedCheckoutAmountDue ?? null
      : sessionInfo?.estimatedFee ?? null

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
                <div className="co-time-rows">
                  <div className="co-time-row">
                    <span className="co-time-label">Phí gửi xe</span>
                    <span className="co-time-value">{formatCurrency(sessionInfo.grossParkingFee)}</span>
                  </div>
                  <div className="co-time-row">
                    <span className="co-time-label">Đã đặt cọc</span>
                    <span className="co-time-value">{formatCurrency(sessionInfo.depositPaid)}</span>
                  </div>
                </div>
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

              {result ? (
                <button className="co-confirm-btn" onClick={handleReset}>
                  Xử lý xe khác
                </button>
              ) : (
                <button
                  className="co-confirm-btn"
                  onClick={handleConfirm}
                  disabled={!sessionInfo || isConfirming}
                >
                  {isConfirming ? 'Đang xử lý...' : '✓ Xác nhận & mở cổng'}
                </button>
              )}

              <p className="sci-form-hint">
                Nhập mã vé/booking hoặc quét mã QR để tự động điền thông tin
              </p>
            </div>
          </div>
        </main>
      </div>

      {showScanModal && (
        <ScanTicketModal onClose={() => setShowScanModal(false)} />
      )}

      {showQrModal && (
        <QRSessionModal
          phase={phase}
          mobileUrl={mobileUrl}
          sessionData={checkoutSessionData}
          error={checkoutError}
          onClose={handleCloseQrModal}
        />
      )}
    </div>
  )
}

export default CheckOut
