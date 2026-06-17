import { useEffect, useState } from 'react'
import { SESSION_PHASES } from '../../hooks/useCameraSession'

function QRSessionModal({ phase, mobileUrl, sessionData, error, onClose }) {
  const [secondsLeft, setSecondsLeft] = useState(null)

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

  const isDone = phase === SESSION_PHASES.DONE
  const isCreating = phase === SESSION_PHASES.CREATING

  return (
    <div className="sci-qr-modal-overlay" onClick={onClose}>
      <div
        className="sci-qr-modal"
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