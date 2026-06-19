import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/CheckIn.css'
import { useCameraSession, SESSION_PHASES } from '../hooks/useCameraSession'
import QRSessionModal from '../components/common/QRSessionModal'
import Navbar from '../components/common/Navbar'
import { getVehicleTypes, getAvailableSlots } from '../services/vehicleTypeService'
import { confirmGuestCheckIn, confirmBookingCheckIn } from '../services/checkInService'
import { redirectToLoginIfUnauthorized } from '../utils/authRedirect'

// TODO: lấy gateId thực từ context/profile/config
const GATE_ID = 1

function CheckIn() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('guest')
  const [plateNumber, setPlateNumber] = useState('')
  const [plateSource, setPlateSource] = useState('manual')
  const [vehicleTypeId, setVehicleTypeId] = useState('')
  const [vehicleTypeSource, setVehicleTypeSource] = useState('staff')
  const [floorId, setFloorId] = useState('')
  const [note, setNote] = useState('')
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [floors, setFloors] = useState([])
  const [floorsLoading, setFloorsLoading] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState(null)
  const [confirmSuccess, setConfirmSuccess] = useState(null)

  const [now, setNow] = useState(new Date())
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))
  const [showQrModal, setShowQrModal] = useState(false)
  // URL hiển thị trong popup QR — mặc định bám theo mobileUrl của session,
  // nhưng có thể bị ghi đè thủ công (xem handleCapturePhoto, tab Booking).
  const [qrPopupUrl, setQrPopupUrl] = useState(null)

  const { phase, sessionData, mobileUrl, error, startSession } =
    useCameraSession()

  const purpose =
    activeTab === 'guest' ? 'CHECK_IN_GUEST' : 'CHECK_IN_BOOKING'

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

  // Tải danh sách tầng theo loại phương tiện đã chọn — mỗi loại xe chỉ đỗ
  // được ở một số tầng nhất định, nên tầng phải phụ thuộc vehicleTypeId.
  useEffect(() => {
    setFloorId('')

    if (!vehicleTypeId) {
      setFloors([])
      return
    }

    let cancelled = false
    async function loadFloors() {
      setFloorsLoading(true)
      try {
        const data = await getAvailableSlots(vehicleTypeId)
        if (!cancelled) setFloors(data.floors ?? [])
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

  // Auto-fill biển số từ OCR khi polling trả về kết quả
  useEffect(() => {
    if (sessionData?.detectedLicensePlate) {
      setPlateNumber(sessionData.detectedLicensePlate)
      setPlateSource('ocr')
    }
  }, [sessionData?.detectedLicensePlate])

  // Auto-fill loại xe từ OCR
  useEffect(() => {
    if (sessionData?.suggestedVehicleTypeId) {
      setVehicleTypeId(String(sessionData.suggestedVehicleTypeId))
      setVehicleTypeSource('ocr')
    }
  }, [sessionData?.suggestedVehicleTypeId])

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

  async function handleConfirm() {
    setConfirmError(null)
    setConfirmSuccess(null)

    const sessionId = sessionData?.sessionId
    if (!sessionId) {
      setConfirmError('Chưa có phiên camera. Vui lòng chụp ảnh trước.')
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

    const entryGate = `Cổng ${GATE_ID}`

    setIsConfirming(true)
    try {
      if (activeTab === 'guest') {
        await confirmGuestCheckIn({
          floorId: Number(floorId),
          vehicleTypeId: Number(vehicleTypeId),
          licensePlate: plateNumber.trim(),
          cameraSessionId: sessionId,
          plateInputSource: plateSource,
          vehicleTypeInputSource: vehicleTypeSource,
          entryGate,
        })
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
          entryGate,
        })
      }

      setConfirmSuccess('Check-in thành công! Barrier đã mở.')
      // Reset form cho xe tiếp theo
      setPlateNumber('')
      setPlateSource('manual')
      setVehicleTypeId('')
      setVehicleTypeSource('staff')
      setFloorId('')
      setNote('')
    } catch (err) {
      if (redirectToLoginIfUnauthorized(err, navigate)) return
      setConfirmError(err.message || 'Lỗi kết nối server. Vui lòng thử lại.')
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

    startSession(purpose, GATE_ID)
  }

  // Chỉ hiện ảnh / OCR khi purpose của session khớp với tab đang xem
  const expectedPurpose = activeTab === 'guest' ? 'CHECK_IN_GUEST' : 'CHECK_IN_BOOKING'
  const purposeMatches = sessionData?.purpose === expectedPurpose
  const faceImg = purposeMatches ? sessionData?.checkinFaceImg : null
  const vehicleImg = purposeMatches ? sessionData?.checkinVehicleImg : null
  const detectedPlate = purposeMatches ? sessionData?.detectedLicensePlate : null

  return (
    <div className="sci-page">
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
          <div className="sci-page-header">
            <h1 className="sci-page-title">Cổng xe</h1>
          </div>

          {/* Tabs */}
          <div className="sci-tabs">
            <button
              className={`sci-tab-btn ${activeTab === 'guest' ? 'sci-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('guest')}
            >
              Guest
            </button>
            <button
              className={`sci-tab-btn ${activeTab === 'booking' ? 'sci-tab-btn--active' : ''}`}
              onClick={() => setActiveTab('booking')}
            >
              Booking
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

            {/* Booking info panel — chỉ hiện khi tab Booking */}
            {activeTab === 'booking' && (
              <div className="sci-detection-panel">
                <h3 className="sci-panel-heading">
                  Thông tin đặt chỗ
                  {isSessionActive && (
                    <span className="sci-session-badge">● Đang chờ QR...</span>
                  )}
                </h3>
                {sessionData?.bookingInfo ? (
                  <div className="sci-booking-info">
                    <div className="sci-booking-row">
                      <span className="sci-booking-label">Họ tên</span>
                      <span className="sci-booking-value">{sessionData.bookingInfo.customerName ?? '—'}</span>
                    </div>
                    <div className="sci-booking-row">
                      <span className="sci-booking-label">Biển số</span>
                      <span className="sci-booking-value">{sessionData.bookingInfo.licensePlate ?? '—'}</span>
                    </div>
                    <div className="sci-booking-row">
                      <span className="sci-booking-label">Loại xe</span>
                      <span className="sci-booking-value">{sessionData.bookingInfo.vehicleType ?? '—'}</span>
                    </div>
                    <div className="sci-booking-row">
                      <span className="sci-booking-label">Tầng</span>
                      <span className="sci-booking-value">{sessionData.bookingInfo.floorName ?? '—'}</span>
                    </div>
                    <div className="sci-booking-row">
                      <span className="sci-booking-label">Giờ vào dự kiến</span>
                      <span className="sci-booking-value">{sessionData.bookingInfo.scheduledCheckin ?? '—'}</span>
                    </div>
                  </div>
                ) : (
                  <span className="sci-camera-status">
                    {isSessionActive ? 'Chờ khách quét mã QR...' : 'Chưa có thông tin'}
                  </span>
                )}
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
                      startSession('CHECK_IN_BOOKING', GATE_ID)
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
                disabled={phase === SESSION_PHASES.CREATING}
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
                  {floors.map((f) => (
                    <option key={f.floorId} value={String(f.floorId)}>{f.floorName}</option>
                  ))}
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

              {confirmError && (
                <p className="sci-confirm-error">{confirmError}</p>
              )}
              {confirmSuccess && (
                <p className="sci-confirm-success">{confirmSuccess}</p>
              )}

              <button
                className="sci-confirm-btn"
                onClick={handleConfirm}
                disabled={isConfirming}
              >
                {isConfirming ? 'Đang xử lý...' : 'Xác nhận vào – Mở barrier'}
              </button>

              <p className="sci-form-hint">
                Quét mã QR để tự động điền thông tin đặt chỗ
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* QR Modal — ẩn/hiện độc lập với polling */}
      {showQrModal && (
        <QRSessionModal
          phase={phase}
          mobileUrl={qrPopupUrl}
          sessionData={sessionData}
          error={error}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default CheckIn
