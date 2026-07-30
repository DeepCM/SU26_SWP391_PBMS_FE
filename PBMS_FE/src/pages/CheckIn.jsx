import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/CheckIn.css'
import '../styles/CheckOut.css'
import { useCameraSession, SESSION_PHASES } from '../hooks/useCameraSession'
import QRSessionModal from '../components/common/QRSessionModal'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'
import CreateIncidentPopup from '../components/common/CreateIncidentPopup'
import IncidentBlockedNotice from '../components/common/IncidentBlockedNotice'
import { getVehicleTypes, getAvailableSlots } from '../services/vehicleTypeService'
import { confirmGuestCheckIn, confirmBookingCheckIn } from '../services/checkInService'
import { completeCameraSession } from '../services/cameraSessionService'
import { redirectToLoginIfUnauthorized } from '../utils/authRedirect'
import { isIncidentBlockedError, incidentBlockMessage } from '../utils/incidentBlock'

// Backend trả message là chính error code (xem CheckInController.cs) — map sang
// tiếng Việt dễ hiểu cho staff thay vì hiện thẳng code thô.
const CHECKIN_ERROR_MESSAGES = {
  CHECKIN_FACE_PHOTO_REQUIRED: 'Chưa có ảnh khuôn mặt tài xế. Vui lòng chụp ảnh trước khi xác nhận.',
  CHECKIN_VEHICLE_PHOTO_REQUIRED: 'Chưa có ảnh biển số xe. Vui lòng chụp ảnh trước khi xác nhận.',
  VEHICLE_NOT_MATCH: 'Biển số xe không khớp với thông tin đặt chỗ.',
  BOOKING_QR_INVALID: 'Mã QR không khớp với đặt chỗ này. Vui lòng quét lại.',
  BOOKING_ALREADY_CHECKED_IN: 'Đặt chỗ này đã được check-in trước đó.',
  BOOKING_EXPIRED: 'Đặt chỗ đã hết hạn hoặc chưa được xác nhận.',
  ACTIVE_SESSION_ALREADY_EXISTS: 'Xe này đang có một phiên đỗ xe khác chưa kết thúc.',
  FLOOR_UNAVAILABLE: 'Tầng đã chọn không còn chỗ trống cho loại xe này.',
}

function resolveCheckInErrorMessage(err) {
  return CHECKIN_ERROR_MESSAGES[err?.message] || err?.message || 'Lỗi kết nối server. Vui lòng thử lại.'
}

function GuestTicketQrModal({ ticket, onClose }) {
  const qrImage = ticket?.qrCodeImage
    ? `data:image/png;base64,${ticket.qrCodeImage}`
    : null

  return (
    <div className="sci-qr-modal-overlay" onClick={onClose}>
      <div className="sci-qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sci-qr-modal-header">
          <h3 className="sci-panel-heading">Vé xe khách vãng lai</h3>
          <button className="sci-qr-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="sci-qr-modal-body">
          {qrImage ? (
            <img className="sci-qr-image" src={qrImage} alt="Mã QR vé xe" />
          ) : (
            <p className="sci-form-hint">Không có mã QR.</p>
          )}
          {ticket?.sessionCode && <p className="sci-qr-link">{ticket.sessionCode}</p>}
          <p className="sci-form-hint">
            Đưa mã này cho khách — dùng để check-out xe khi ra. Biển số:{' '}
            {ticket?.licensePlate ?? '—'}, tầng {ticket?.floorName ?? '—'}.
          </p>
        </div>
        <div className="sci-qr-modal-footer co-scan-modal-footer">
          <button className="sci-confirm-btn" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  )
}

function CheckIn() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('guest')
  const [plateNumber, setPlateNumber] = useState('')
  const [plateSource, setPlateSource] = useState('manual')
  const [vehicleTypeId, setVehicleTypeId] = useState('')
  const [vehicleTypeSource, setVehicleTypeSource] = useState('staff')
  // Đánh dấu staff đã tự tay sửa trường này — khác với plateSource/vehicleTypeSource
  // (giá trị gửi lên backend), vì giá trị mặc định của 2 source đó cũng là
  // 'manual'/'staff' nên không dùng được để phân biệt "chưa đụng tới" và
  // "staff vừa sửa tay, đừng để OCR ghi đè".
  const plateTouchedRef = useRef(false)
  const vehicleTypeTouchedRef = useRef(false)
  const [floorId, setFloorId] = useState('')
  const [note, setNote] = useState('')
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [floors, setFloors] = useState([])
  const [floorsLoading, setFloorsLoading] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState(null)
  const [confirmSuccess, setConfirmSuccess] = useState(null)
  const [checkinBlocked, setCheckinBlocked] = useState(false)

  const [now, setNow] = useState(new Date())
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))
  const [showQrModal, setShowQrModal] = useState(false)
  // URL hiển thị trong popup QR — mặc định bám theo mobileUrl của session,
  // nhưng có thể bị ghi đè thủ công (xem handleCapturePhoto, tab Booking).
  const [qrPopupUrl, setQrPopupUrl] = useState(null)
  const [guestTicket, setGuestTicket] = useState(null)
  const [showGuestTicketModal, setShowGuestTicketModal] = useState(false)

  // Ghi nhận sự cố — popup dùng chung với TableIncident.jsx / CheckOut.jsx
  const [showIncidentPopup, setShowIncidentPopup] = useState(false)

  const {
    phase,
    sessionData,
    mobileUrl,
    error,
    unauthorized,
    startSession,
    reset,
    cancelSession,
  } = useCameraSession()

  const purpose =
    activeTab === 'guest' ? 'CHECK_IN_GUEST' : 'CHECK_IN_BOOKING'

  // Token hết hạn/không hợp lệ phát hiện trong lúc polling — chuyển về login
  // (cùng helper dùng cho lỗi 401 khi bấm xác nhận check-in).
  useEffect(() => {
    if (unauthorized) {
      redirectToLoginIfUnauthorized({ status: 401 }, navigate)
    }
  }, [unauthorized, navigate])

  // Tự mở modal khi session bắt đầu, tự đóng khi session kết thúc (terminal)
  useEffect(() => {
    if (phase === SESSION_PHASES.CREATING || phase === SESSION_PHASES.ACTIVE) {
      setShowQrModal(true)
    } else if (phase === SESSION_PHASES.DONE) {
      setShowQrModal(false)
    }
  }, [phase])

  // Mỗi khi có session mới (mobileUrl đổi), reset URL popup về đúng URL gốc
  // của session đó (mobile-booking-scanner hoặc mobile-camera tuỳ purpose).
  useEffect(() => {
    setQrPopupUrl(mobileUrl)
  }, [mobileUrl])

  // Ngay khi đã có đủ 2 ảnh (mặt + biển số), tự gọi complete camera session
  // để chuyển status sang Completed — polling sẽ nhận status này ở lượt kế
  // tiếp và tự đóng QR modal, không cần đợi session hết hạn.
  const completeAttemptedForRef = useRef(null)
  useEffect(() => {
    if (!sessionData?.sessionId || sessionData.status === 'Completed') return
    if (!sessionData.checkinFaceImg || !sessionData.checkinVehicleImg) return
    if (completeAttemptedForRef.current === sessionData.sessionId) return
    completeAttemptedForRef.current = sessionData.sessionId

    completeCameraSession(sessionData.sessionId)
      .then(({ status, data }) => {
        if (status === 200) return
        const blockErr = { status, message: data?.message }
        if (isIncidentBlockedError(blockErr)) {
          setCheckinBlocked(true)
          setConfirmError(incidentBlockMessage(blockErr))
          return
        }
        // Lỗi khác (vd tạm thời) — cho phép thử lại ở lượt poll kế tiếp.
        completeAttemptedForRef.current = null
      })
      .catch(() => {
        completeAttemptedForRef.current = null
      })
  }, [sessionData])

  // Load danh sách loại xe
  useEffect(() => {
    async function loadVehicleTypes() {
      try {
        const types = await getVehicleTypes()
        setVehicleTypes(types)
      } catch {
        // không block UI nếu load thất bại
      }
    }
    loadVehicleTypes()
  }, [])

  // Tầng cần điền lại theo booking sau khi danh sách tầng load lại do
  // vehicleTypeId đổi (xem effect auto-fill từ booking bên dưới).
  const pendingBookingFloorIdRef = useRef(null)

  // Tải danh sách tầng theo loại phương tiện đã chọn — mỗi loại xe chỉ đỗ
  // được ở một số tầng nhất định, nên tầng phải phụ thuộc vehicleTypeId.
  useEffect(() => {
    if (!pendingBookingFloorIdRef.current) {
      setFloorId('')
    }

    if (!vehicleTypeId) {
      setFloors([])
      return
    }

    let cancelled = false
    async function loadFloors() {
      setFloorsLoading(true)
      try {
        const data = await getAvailableSlots(vehicleTypeId)
        if (cancelled) return
        setFloors(data.floors ?? [])
        if (pendingBookingFloorIdRef.current) {
          setFloorId(pendingBookingFloorIdRef.current)
          pendingBookingFloorIdRef.current = null
        }
      } catch {
        if (!cancelled) setFloors([])
      } finally {
        if (!cancelled) setFloorsLoading(false)
      }
    }
    loadFloors()

    return () => {
      cancelled = true
    }
  }, [vehicleTypeId])

  // Auto-fill biển số từ OCR khi polling trả về kết quả — không ghi đè nếu
  // biển số đang được điền từ thông tin booking hoặc đã được staff sửa tay.
  useEffect(() => {
    if (
      sessionData?.detectedLicensePlate &&
      plateSource !== 'booking' &&
      !plateTouchedRef.current
    ) {
      setPlateNumber(sessionData.detectedLicensePlate)
      setPlateSource('ocr')
    }
  }, [sessionData?.detectedLicensePlate, plateSource])

  // Auto-fill loại xe từ OCR — không ghi đè nếu đã được điền từ booking hoặc
  // đã được staff sửa tay.
  useEffect(() => {
    if (
      sessionData?.suggestedVehicleTypeId &&
      vehicleTypeSource !== 'booking' &&
      !vehicleTypeTouchedRef.current
    ) {
      setVehicleTypeId(String(sessionData.suggestedVehicleTypeId))
      setVehicleTypeSource('ocr')
    }
  }, [sessionData?.suggestedVehicleTypeId, vehicleTypeSource])

  // Auto-fill biển số/loại xe/tầng từ booking khi quét QR xong — chỉ điền một
  // lần cho mỗi session (tránh polling lặp lại ghi đè chỉnh sửa thủ công sau đó).
  const bookingInfoFilledSessionRef = useRef(null)
  useEffect(() => {
    const info = sessionData?.bookingInfo
    const sessionId = sessionData?.sessionId
    if (activeTab !== 'booking' || !info || !sessionId) return
    if (bookingInfoFilledSessionRef.current === sessionId) return

    bookingInfoFilledSessionRef.current = sessionId
    if (info.licensePlate) {
      setPlateNumber(info.licensePlate)
      setPlateSource('booking')
    }
    if (info.floorId) {
      // Đánh dấu trước — effect load danh sách tầng (chạy do vehicleTypeId đổi)
      // sẽ tự áp lại giá trị này thay vì reset về rỗng.
      pendingBookingFloorIdRef.current = String(info.floorId)
      setFloorId(String(info.floorId))
    }
    if (info.vehicleTypeId) {
      setVehicleTypeId(String(info.vehicleTypeId))
      setVehicleTypeSource('booking')
    }
  }, [activeTab, sessionData?.bookingInfo, sessionData?.sessionId])

  // Live clock — cập nhật mỗi giây
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const isSessionActive = phase === SESSION_PHASES.ACTIVE

  // Đóng modal nhưng KHÔNG dừng polling — session tiếp tục cập nhật lên page
  function handleCloseModal() {
    setShowQrModal(false)
  }

  // Huỷ phiên camera hiện tại — gọi API cancel rồi đóng modal (cancelSession
  // chỉ dọn state về IDLE, không tự đóng modal như khi session vào trạng thái DONE).
  async function handleCancelSession() {
    await cancelSession()
    setShowQrModal(false)
  }

  // Đổi tab guest/booking — dọn sạch session camera cũ (mobileUrl/sessionId/
  // ảnh OCR) và toàn bộ form, tránh hiển thị nhầm dữ liệu của session/tab trước.
  function handleSwitchTab(tab) {
    if (tab === activeTab) return
    reset()
    bookingInfoFilledSessionRef.current = null
    setPlateNumber('')
    setPlateSource('manual')
    plateTouchedRef.current = false
    setVehicleTypeId('')
    setVehicleTypeSource('staff')
    vehicleTypeTouchedRef.current = false
    setFloorId('')
    setNote('')
    setConfirmError(null)
    setConfirmSuccess(null)
    setActiveTab(tab)
  }

  async function handleConfirm() {
    setConfirmError(null)
    setConfirmSuccess(null)
    setCheckinBlocked(false)

    const sessionId = sessionData?.sessionId
    if (!sessionId) {
      setConfirmError('Chưa có phiên camera. Vui lòng chụp ảnh trước.')
      return
    }
    const expectedPurposeForConfirm =
      activeTab === 'guest' ? 'CHECK_IN_GUEST' : 'CHECK_IN_BOOKING'
    if (
      sessionData?.purpose !== expectedPurposeForConfirm ||
      !sessionData?.checkinFaceImg ||
      !sessionData?.checkinVehicleImg
    ) {
      setConfirmError('Vui lòng chụp đủ ảnh khuôn mặt và biển số xe trước khi xác nhận.')
      return
    }
    if (!plateNumber.trim()) {
      setConfirmError('Vui lòng nhập biển số xe.')
      return
    }
    if (!vehicleTypeId) {
      setConfirmError('Vui lòng chọn loại phương tiện.')
      return
    }
    if (activeTab === 'guest' && !floorId) {
      setConfirmError('Vui lòng chọn tầng.')
      return
    }

    setIsConfirming(true)
    try {
      if (activeTab === 'guest') {
        const { data } = await confirmGuestCheckIn({
          floorId: Number(floorId),
          vehicleTypeId: Number(vehicleTypeId),
          licensePlate: plateNumber.trim(),
          cameraSessionId: sessionId,
          plateInputSource: plateSource,
          vehicleTypeInputSource: vehicleTypeSource,
        })
        setGuestTicket(data)
        setShowGuestTicketModal(true)
      } else {
        const bookingId = sessionData?.bookingId
        if (!bookingId) {
          setConfirmError('Chưa có thông tin booking. Vui lòng quét mã QR đặt chỗ.')
          return
        }
        await confirmBookingCheckIn({
          bookingId,
          actualLicensePlate: plateNumber.trim(),
          cameraSessionId: sessionId,
        })
      }

      setConfirmSuccess('Check-in thành công! Barrier đã mở.')
      // Reset form cho xe tiếp theo
      setPlateNumber('')
      setPlateSource('manual')
      plateTouchedRef.current = false
      setVehicleTypeId('')
      setVehicleTypeSource('staff')
      vehicleTypeTouchedRef.current = false
      setFloorId('')
      setNote('')
    } catch (err) {
      if (redirectToLoginIfUnauthorized(err, navigate)) return
      if (isIncidentBlockedError(err)) {
        setCheckinBlocked(true)
        setConfirmError(incidentBlockMessage(err))
      } else {
        setConfirmError(resolveCheckInErrorMessage(err))
      }
    } finally {
      setIsConfirming(false)
    }
  }

  function handleCapturePhoto() {
    setConfirmError(null)
    setConfirmSuccess(null)

    // Tab Booking: KHÔNG gọi tạo session mới — tái sử dụng sessionId/token đã
    // có từ lúc bấm "Quét mã QR đặt chỗ", chỉ thay URL trang mobile-booking-scanner
    // bằng mobile-camera để khách quét lại và chụp ảnh trên cùng session đó.
    if (activeTab === 'booking') {
      if (!mobileUrl) {
        setConfirmError('Vui lòng quét mã QR đặt chỗ trước khi chụp ảnh.')
        return
      }
      setQrPopupUrl(mobileUrl.replace('mobile-booking-scanner', 'mobile-camera'))
      setShowQrModal(true)
      return
    }

    startSession(purpose)
  }

  // Chỉ hiện ảnh / OCR khi purpose của session khớp với tab đang xem
  const expectedPurpose = activeTab === 'guest' ? 'CHECK_IN_GUEST' : 'CHECK_IN_BOOKING'
  const purposeMatches = sessionData?.purpose === expectedPurpose
  const faceImg = purposeMatches ? sessionData?.checkinFaceImg : null
  const vehicleImg = purposeMatches ? sessionData?.checkinVehicleImg : null
  const detectedPlate = purposeMatches ? sessionData?.detectedLicensePlate : null
  const hasRequiredCheckInPhotos = !!faceImg && !!vehicleImg

  return (
    <div className="sci-page">
      <Navbar isLoggedIn={isLoggedIn} />

      <div className="sci-body">
        {/* Sidebar */}
        <Sidebar />
          
        {/* Main */}
        <main className="sci-main">
          <div className="sci-page-header">
            <h1 className="sci-page-title">Cổng xe</h1>
          </div>

          {/* Tabs */}
          <div className="co-top-bar">
            <div className="sci-tabs" style={{ marginBottom: 0 }}>
              <button
                className={`sci-tab-btn ${activeTab === 'guest' ? 'sci-tab-btn--active' : ''}`}
                onClick={() => handleSwitchTab('guest')}
              >
                Guest
              </button>
              <button
                className={`sci-tab-btn ${activeTab === 'booking' ? 'sci-tab-btn--active' : ''}`}
                onClick={() => handleSwitchTab('booking')}
              >
                Booking
              </button>
            </div>
            <button
              className="co-incident-btn"
              type="button"
              onClick={() => setShowIncidentPopup(true)}
            >
              Ghi nhận sự cố
            </button>
          </div>

          {/* Content */}
          <div className={`sci-content ${activeTab === 'guest' ? 'sci-content--guest' : ''}`}>
            {/* Camera Panel — cập nhật real-time từ polling */}
            <div className="sci-detection-panel">
              <h3 className="sci-panel-heading">
                Ảnh nhận diện phương tiện và tài xế
                {isSessionActive && (
                  <span className="sci-session-badge">● Đang chờ...</span>
                )}
              </h3>

              <div className={`sci-camera-row${activeTab === 'booking' ? ' sci-camera-row--col' : ''}`}>
                <div className="sci-camera-box">
                  <p className="sci-camera-label">Biển số xe</p>
                  {vehicleImg ? (
                    <>
                      <div className="sci-camera-img-wrap">
                        <img
                          className="sci-camera-photo"
                          src={vehicleImg}
                          alt="Ảnh biển số"
                        />
                      </div>
                      {detectedPlate && (
                        <span className="sci-camera-ocr">OCR: {detectedPlate}</span>
                      )}
                    </>
                  ) : (
                    <span className="sci-camera-status">
                      {isSessionActive ? 'Chờ khách chụp biển số...' : 'Chưa có ảnh'}
                    </span>
                  )}
                </div>

                <div className="sci-camera-box">
                  <p className="sci-camera-label">Khuôn mặt tài xế</p>
                  {faceImg ? (
                    <div className="sci-camera-img-wrap">
                      <img
                        className="sci-camera-photo"
                        src={faceImg}
                        alt="Ảnh khuôn mặt"
                      />
                    </div>
                  ) : (
                    <span className="sci-camera-status">
                      {isSessionActive ? 'Chờ khách chụp khuôn mặt...' : 'Chưa có ảnh'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Ảnh tham chiếu từ booking — chỉ hiện khi tab Booking */}
            {activeTab === 'booking' && (
              <div className="sci-detection-panel">
                <h3 className="sci-panel-heading">
                  Ảnh tham chiếu từ đặt chỗ
                  {isSessionActive && (
                    <span className="sci-session-badge">● Đang chờ QR...</span>
                  )}
                </h3>

                <div className="sci-camera-row sci-camera-row--col">
                  <div className="sci-camera-box">
                    <p className="sci-camera-label">Ảnh xe đã đăng ký</p>
                    {sessionData?.bookingInfo?.vehicleImgUrl ? (
                      <div className="sci-camera-img-wrap">
                        <img
                          className="sci-camera-photo"
                          src={sessionData.bookingInfo.vehicleImgUrl}
                          alt="Ảnh xe đăng ký booking"
                        />
                      </div>
                    ) : (
                      <span className="sci-camera-status">
                        {isSessionActive ? 'Chờ khách quét mã QR...' : 'Chưa có ảnh'}
                      </span>
                    )}
                  </div>

                  <div className="sci-camera-box">
                    <p className="sci-camera-label">Avatar tài khoản</p>
                    {sessionData?.bookingInfo?.avatarUrl ? (
                      <div className="sci-camera-img-wrap">
                        <img
                          className="sci-camera-photo"
                          src={sessionData.bookingInfo.avatarUrl}
                          alt="Avatar khách hàng"
                        />
                      </div>
                    ) : (
                      <span className="sci-camera-status">
                        {isSessionActive ? 'Chờ khách quét mã QR...' : 'Chưa có ảnh'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Form Panel */}
            <div className="sci-form-panel">
              <h3 className="sci-panel-heading">
                {activeTab === 'guest' ? 'Thông tin xe vào (Khách vãng lai)' : 'Thông tin xe vào (Booking)'}
              </h3>

              {activeTab === 'booking' && (
                <>
                  <p className="sci-qr-prompt-label">Có mã đặt chỗ?</p>
                  <button
                    className="sci-qr-btn"
                    onClick={() => {
                      setConfirmError(null)
                      setConfirmSuccess(null)
                      startSession('CHECK_IN_BOOKING')
                    }}
                    disabled={phase === SESSION_PHASES.CREATING}
                  >
                    {phase === SESSION_PHASES.CREATING ? 'Đang tạo phiên…' : 'Quét mã QR đặt chỗ'}
                  </button>
                </>
              )}

              <button
                className="sci-qr-btn"
                onClick={handleCapturePhoto}
                disabled={phase === SESSION_PHASES.CREATING || checkinBlocked}
              >
                {phase === SESSION_PHASES.CREATING ? 'Đang tạo phiên...' : 'Chụp ảnh'}
              </button>

              <div className="sci-field-group">
                <label className="sci-field-label">BIỂN SỐ XE</label>
                <input
                  className="sci-field-input"
                  placeholder="VD: 51A-123.45"
                  value={plateNumber}
                  onChange={(e) => {
                    setPlateNumber(e.target.value)
                    setPlateSource('manual')
                    plateTouchedRef.current = true
                  }}
                />
              </div>

              <div className="sci-field-group">
                <label className="sci-field-label">LOẠI PHƯƠNG TIỆN</label>
                <select
                  className="sci-field-input sci-field-select"
                  value={vehicleTypeId}
                  onChange={(e) => {
                    setVehicleTypeId(e.target.value)
                    setVehicleTypeSource('staff')
                    vehicleTypeTouchedRef.current = true
                  }}
                >
                  <option value="">-- Chọn loại xe --</option>
                  {vehicleTypes.map((t) => (
                    <option key={t.id} value={String(t.id)}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="sci-field-group">
                <label className="sci-field-label">TẦNG</label>
                <select
                  className="sci-field-input sci-field-select"
                  value={floorId}
                  onChange={(e) => setFloorId(e.target.value)}
                  disabled={!vehicleTypeId || floorsLoading}
                >
                  <option value="">
                    {!vehicleTypeId
                      ? '-- Chọn loại xe trước --'
                      : floorsLoading
                        ? 'Đang tải tầng...'
                        : floors.length === 0
                          ? 'Không có tầng phù hợp'
                          : '-- Chọn tầng --'}
                  </option>
                  {floors.map((f) => {
                    const percentRemaining = f.totalSlots > 0
                      ? (f.availableSlots / f.totalSlots) * 100
                      : 0
                    const color = percentRemaining <= 10
                      ? '#EF4444'
                      : percentRemaining <= 30
                        ? '#de8d02'
                        : '#0e7b36'
                    return (
                      <option key={f.floorId} value={String(f.floorId)} style={{ color }}>
                        {f.floorName} ({f.availableSlots} chỗ trống)
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="sci-field-group">
                <label className="sci-field-label">GHI CHÚ</label>
                <input
                  className="sci-field-input"
                  placeholder=""
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="sci-field-group">
                <label className="sci-field-label">GIỜ VÀO</label>
                <input
                  className="sci-field-input sci-field-input--readonly"
                  readOnly
                  value={now.toLocaleTimeString('vi-VN', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                    hour12: false,
                  })}
                />
              </div>

              {checkinBlocked ? (
                <IncidentBlockedNotice
                  message={confirmError}
                  onRetry={handleConfirm}
                  onDismiss={() => {
                    setCheckinBlocked(false)
                    setConfirmError(null)
                  }}
                  retrying={isConfirming}
                />
              ) : (
                confirmError && <p className="sci-confirm-error">{confirmError}</p>
              )}
              {confirmSuccess && (
                <p className="sci-confirm-success">{confirmSuccess}</p>
              )}

              <button
                className="sci-confirm-btn"
                onClick={handleConfirm}
                disabled={isConfirming || !hasRequiredCheckInPhotos || checkinBlocked}
              >
                {isConfirming ? 'Đang xử lý...' : 'Xác nhận vào – Mở barrier'}
              </button>

              <p className="sci-form-hint">
                {hasRequiredCheckInPhotos
                  ? 'Quét mã QR để tự động điền thông tin đặt chỗ'
                  : 'Cần chụp đủ ảnh khuôn mặt và biển số xe trước khi xác nhận'}
              </p>
            </div>
          </div>
        </main>
      </div>

      {showGuestTicketModal && (
        <GuestTicketQrModal
          ticket={guestTicket}
          onClose={() => setShowGuestTicketModal(false)}
        />
      )}

      {/* QR Modal — ẩn/hiện độc lập với polling */}
      {showQrModal && (
        <QRSessionModal
          phase={phase}
          mobileUrl={qrPopupUrl}
          sessionData={sessionData}
          error={error}
          onClose={handleCloseModal}
          onCancel={handleCancelSession}
        />
      )}

      {showIncidentPopup && (
        <CreateIncidentPopup
          onClose={() => setShowIncidentPopup(false)}
          defaultBookingId={sessionData?.bookingId}
        />
      )}
    </div>
  )
}

export default CheckIn
