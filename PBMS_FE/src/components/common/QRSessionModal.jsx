import { useEffect, useState } from 'react'
import { SESSION_PHASES } from '../../hooks/useCameraSession'

/**
 * QRSessionModal
 *
 * Props:
 *  - phase: SESSION_PHASES
 *  - mobileUrl: string | null
 *  - sessionData: object | null  — response từ GET /camera-sessions/{id}
 *  - error: string | null
 *  - onClose: () => void         — đóng modal + cancel session
 */
function QRSessionModal({ phase, mobileUrl, sessionData, error, onClose }) {
  const [secondsLeft, setSecondsLeft] = useState(null)

  // Đếm ngược tới expiresAt
  useEffect(() => {
    if (!sessionData?.expiresAt) return

    const tick = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(sessionData.expiresAt) - Date.now()) / 1000)
      )
      setSecondsLeft(diff)
    }

    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [sessionData?.expiresAt])

  const qrImage = mobileUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(mobileUrl)}`
    : null

  const backendStatus = sessionData?.status
  const faceImg = sessionData?.checkinFaceImg
  const vehicleImg = sessionData?.checkinVehicleImg
  const detectedPlate = sessionData?.detectedLicensePlate
  const ocrConfidence = sessionData?.ocrConfidence
  const warnings = sessionData?.warnings ?? []
  const hasVehicleMismatch = warnings.includes('VEHICLE_NOT_MATCH')

  const isDone = phase === SESSION_PHASES.DONE
  const isCreating = phase === SESSION_PHASES.CREATING

  return (
    <div className="sci-qr-modal-overlay" onClick={onClose}>
      <div
        className="sci-qr-modal sci-qr-modal--wide"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sci-qr-modal-header">
          <h3 className="sci-panel-heading">
            {isDone ? 'Phiên đã kết thúc' : 'Quét để chụp ảnh'}
          </h3>
          <button className="sci-qr-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="sci-qr-modal-body">
          {/* Cột trái: QR + trạng thái */}
          <div className="sci-qr-modal-left">
            {isCreating && (
              <div className="sci-qr-loading">
                <span className="sci-qr-spinner" />
                <p>Đang tạo phiên...</p>
              </div>
            )}

            {!isCreating && qrImage && (
              <>
                <img
                  className={`sci-qr-image ${isDone ? 'sci-qr-image--expired' : ''}`}
                  src={qrImage}
                  alt="QR mobile camera"
                />
                <p className="sci-qr-link">{mobileUrl}</p>
              </>
            )}

            {/* Đếm ngược */}
            {!isDone && secondsLeft !== null && (
              <p className={`sci-qr-timer ${secondsLeft < 60 ? 'sci-qr-timer--warning' : ''}`}>
                Hết hạn sau: {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
              </p>
            )}

            {/* Trạng thái backend */}
            {backendStatus && (
              <div className={`sci-qr-status-badge sci-qr-status-badge--${backendStatus.toLowerCase()}`}>
                {STATUS_LABEL[backendStatus] ?? backendStatus}
              </div>
            )}

            {/* Lỗi */}
            {error && <p className="sci-qr-error">{error}</p>}
          </div>

          {/* Cột phải: ảnh + OCR */}
          <div className="sci-qr-modal-right">
            {/* Ảnh biển số */}
            <div className="sci-qr-photo-block">
              <p className="sci-camera-label">Biển số xe</p>
              {vehicleImg ? (
                <img className="sci-qr-photo" src={vehicleImg} alt="Ảnh biển số" />
              ) : (
                <div className="sci-qr-photo-placeholder">
                  {phase === SESSION_PHASES.ACTIVE ? 'Chờ khách chụp...' : '—'}
                </div>
              )}
              {detectedPlate && (
                <div className={`sci-qr-ocr-result ${hasVehicleMismatch ? 'sci-qr-ocr-result--warning' : ''}`}>
                  <span className="sci-qr-ocr-label">OCR:</span>
                  <span className="sci-qr-ocr-value">{detectedPlate}</span>
                  {ocrConfidence !== null && ocrConfidence !== undefined && (
                    <span className="sci-qr-ocr-confidence">
                      ({Math.round(ocrConfidence * 100)}%)
                    </span>
                  )}
                </div>
              )}
              {hasVehicleMismatch && (
                <p className="sci-qr-warning">
                  ⚠ Biển số OCR không khớp với booking
                </p>
              )}
            </div>

            {/* Ảnh khuôn mặt */}
            <div className="sci-qr-photo-block">
              <p className="sci-camera-label">Khuôn mặt tài xế</p>
              {faceImg ? (
                <img className="sci-qr-photo" src={faceImg} alt="Ảnh khuôn mặt" />
              ) : (
                <div className="sci-qr-photo-placeholder">
                  {phase === SESSION_PHASES.ACTIVE ? 'Chờ khách chụp...' : '—'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sci-qr-modal-footer">
          {isDone ? (
            <button className="sci-confirm-btn" onClick={onClose}>
              Đóng
            </button>
          ) : (
            <button className="sci-qr-cancel-btn" onClick={onClose}>
              Huỷ phiên
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const STATUS_LABEL = {
  Pending: 'Chờ khách chụp ảnh',
  FaceUploaded: 'Đã chụp mặt',
  VehicleUploaded: 'Đã chụp biển số',
  Completed: 'Hoàn thành',
  Expired: 'Hết hạn',
  Cancelled: 'Đã huỷ',
}

export default QRSessionModal
