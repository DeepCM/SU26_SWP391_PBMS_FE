import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/StaffCheckIn.css'
import { useCameraSession, SESSION_PHASES } from '../hooks/useCameraSession'
import QRSessionModal from '../components/common/QRSessionModal'
import Navbar from '../components/common/Navbar'

// TODO: lấy gateId thực từ context/profile/config
const GATE_ID = 1

function StaffCheckIn() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('guest')
  const [plateNumber, setPlateNumber] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [note, setNote] = useState('')
  const [entryTime, setEntryTime] = useState('')

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))

  const { phase, sessionData, mobileUrl, error, startSession, reset } =
    useCameraSession()

  const purpose =
    activeTab === 'guest' ? 'CHECK_IN_GUEST' : 'CHECK_IN_BOOKING'

  // Modal chỉ hiện khi đang tạo/chờ — tự đóng khi session kết thúc
  const showQrPopup =
    phase === SESSION_PHASES.CREATING || phase === SESSION_PHASES.ACTIVE

  // Auto-fill biển số từ OCR khi polling trả về kết quả
  useEffect(() => {
    if (sessionData?.detectedLicensePlate) {
      setPlateNumber(sessionData.detectedLicensePlate)
    }
  }, [sessionData?.detectedLicensePlate])

  const isSessionActive = phase === SESSION_PHASES.ACTIVE

  const shiftInfo = {
    shift: 'Ca sáng: 07:00 – 15:00',
    date: 'Thứ Năm: 21/05/2026',
    staff: 'Nhân viên: Trần Nam',
  }

  function handleConfirm() {
    console.log('Confirmed:', { plateNumber, vehicleType, note, entryTime })
  }

  function handleCapturePhoto() {
    startSession(purpose, GATE_ID)
  }

  function handleCloseModal() {
    reset()
  }

  // Ảnh từ session hiện tại để hiển thị trên Camera Panel
  const faceImg = sessionData?.checkinFaceImg
  const vehicleImg = sessionData?.checkinVehicleImg
  const detectedPlate = sessionData?.detectedLicensePlate

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
            <p className="sci-page-subtitle">
              {shiftInfo.shift} · {shiftInfo.date} · {shiftInfo.staff}
            </p>
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

              <div className="sci-camera-box">
                <p className="sci-camera-label">Biển số xe</p>
                {vehicleImg ? (
                  <>
                    <img
                      className="sci-camera-photo"
                      src={vehicleImg}
                      alt="Ảnh biển số"
                    />
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
                  <img
                    className="sci-camera-photo"
                    src={faceImg}
                    alt="Ảnh khuôn mặt"
                  />
                ) : (
                  <span className="sci-camera-status">
                    {isSessionActive ? 'Chờ khách chụp khuôn mặt...' : 'Chưa có ảnh'}
                  </span>
                )}
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
                      <span className="sci-booking-value">{sessionData.bookingInfo.fullName ?? '—'}</span>
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
                    onClick={() => startSession('CHECK_IN_BOOKING', GATE_ID)}
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
                  onChange={(e) => setPlateNumber(e.target.value)}
                />
              </div>

              <div className="sci-field-group">
                <label className="sci-field-label">LOẠI PHƯƠNG TIỆN</label>
                <select
                  className="sci-field-input sci-field-select"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                >
                  <option value="">-- Chọn loại xe --</option>
                  <option value="motorbike">Xe máy</option>
                  <option value="car">Ô tô</option>
                  <option value="bicycle">Xe đạp</option>
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
                  className="sci-field-input"
                  placeholder="DD/MM/YYYY HH:MM"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                />
              </div>

              <button className="sci-confirm-btn" onClick={handleConfirm}>
                Xác nhận vào – Mở barrier
              </button>

              <p className="sci-form-hint">
                Quét mã QR để tự động điền thông tin đặt chỗ
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* QR Modal — chỉ render khi có session */}
      {showQrPopup && (
        <QRSessionModal
          phase={phase}
          mobileUrl={mobileUrl}
          sessionData={sessionData}
          error={error}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default StaffCheckIn