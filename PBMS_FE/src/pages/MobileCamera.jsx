import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { uploadVehiclePhoto, uploadFacePhoto } from '../services/cameraSessionService'
import '../styles/MobileCamera.css'

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

const STEP = { VEHICLE: 'vehicle', FACE: 'face' }
const UPLOAD_STATE = { IDLE: 'idle', UPLOADING: 'uploading', SUCCESS: 'success', ERROR: 'error' }

const STEP_CONFIG = {
  [STEP.VEHICLE]: {
    label: 'Biển số xe',
    hint: 'Đặt biển số xe vào khung hình',
    uploadFn: uploadVehiclePhoto,
    fileName: 'vehicle.jpg',
  },
  [STEP.FACE]: {
    label: 'Khuôn mặt',
    hint: 'Hướng mặt vào khung hình',
    uploadFn: uploadFacePhoto,
    fileName: 'face.jpg',
  },
}

function MobileCamera() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const token = searchParams.get('token')

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const [step, setStep] = useState(STEP.VEHICLE)
  const [facingMode, setFacingMode] = useState('environment')
  const [capturedImage, setCapturedImage] = useState(null)
  const [permissionError, setPermissionError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [uploadState, setUploadState] = useState(UPLOAD_STATE.IDLE)
  const [uploadError, setUploadError] = useState(null)
  const [allDone, setAllDone] = useState(false)

  const missingParams = !sessionId || !token
  const config = STEP_CONFIG[step]

  const startCamera = useCallback(async (mode) => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    setIsLoading(true)
    setPermissionError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch (err) {
      setPermissionError(
        err.name === 'NotAllowedError'
          ? 'Vui lòng cấp quyền truy cập camera để tiếp tục.'
          : 'Không thể khởi động camera. Vui lòng thử lại.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (missingParams) return
    startCamera(facingMode)
    return () => streamRef.current?.getTracks().forEach((t) => t.stop())
  }, [facingMode, startCamera, missingParams])

  // Khi quay về viewfinder (capturedImage = null), re-attach stream vào video element vừa mount lại
  useEffect(() => {
    if (!capturedImage && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [capturedImage])

  function handleCapture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.92))
    setUploadState(UPLOAD_STATE.IDLE)
    setUploadError(null)
  }

  function handleRetake() {
    setCapturedImage(null)
    setUploadState(UPLOAD_STATE.IDLE)
    setUploadError(null)
  }

  function handleFlip() {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
  }

  async function handleConfirm() {
    setUploadState(UPLOAD_STATE.UPLOADING)
    setUploadError(null)
    try {
      const blob = dataUrlToBlob(capturedImage)
      const { status, data } = await config.uploadFn({ sessionId, token, photoBlob: blob })
      if (status >= 200 && status < 300) {
        if (step === STEP.VEHICLE) {
          // Chuyển sang bước chụp mặt
          setCapturedImage(null)
          setUploadState(UPLOAD_STATE.IDLE)
          setStep(STEP.FACE)
        } else {
          setAllDone(true)
        }
      } else {
        setUploadState(UPLOAD_STATE.ERROR)
        const serverMsg = data?.message || data?.error || JSON.stringify(data)
        setUploadError(`Lỗi ${status}: ${serverMsg}`)
      }
    } catch (err) {
      setUploadState(UPLOAD_STATE.ERROR)
      setUploadError(err?.message || 'Không thể kết nối server. Kiểm tra kết nối mạng.')
    }
  }

  // ── Invalid link ─────────────────────────────────────
  if (missingParams) {
    return (
      <div className="mc-page mc-page--center">
        <div className="mc-invalid">
          <div className="mc-invalid-icon">⚠</div>
          <h2 className="mc-invalid-title">Link không hợp lệ</h2>
          <p className="mc-invalid-desc">Vui lòng quét lại mã QR từ màn hình nhân viên.</p>
        </div>
      </div>
    )
  }

  // ── All done ─────────────────────────────────────────
  if (allDone) {
    return (
      <div className="mc-page mc-page--center">
        <div className="mc-success">
          <div className="mc-success-icon">✓</div>
          <h2 className="mc-success-title">Hoàn tất!</h2>
          <p className="mc-success-desc">Đã gửi cả 2 ảnh thành công. Bạn có thể đóng trang này.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mc-page">
      {capturedImage ? (
        /* ── Preview ── */
        <div className="mc-preview">
          <div className="mc-preview-header">
            <span className="mc-step-badge">
              {step === STEP.VEHICLE ? '1 / 2' : '2 / 2'}
            </span>
            <span className="mc-preview-label">Xác nhận ảnh {config.label}</span>
          </div>

          <img className="mc-preview-img" src={capturedImage} alt={`Ảnh ${config.label}`} />

          {uploadState === UPLOAD_STATE.ERROR && (
            <p className="mc-upload-error">{uploadError}</p>
          )}

          <div className="mc-preview-bar">
            <button
              className="mc-btn mc-btn--outline"
              onClick={handleRetake}
              disabled={uploadState === UPLOAD_STATE.UPLOADING}
            >
              Chụp lại
            </button>
            <button
              className="mc-btn mc-btn--primary"
              onClick={handleConfirm}
              disabled={uploadState === UPLOAD_STATE.UPLOADING}
            >
              {uploadState === UPLOAD_STATE.UPLOADING ? 'Đang gửi…' : 'Xác nhận'}
            </button>
          </div>
        </div>
      ) : (
        /* ── Viewfinder ── */
        <div className="mc-viewfinder">
          {/* Step header */}
          <div className="mc-step-header">
            <div className="mc-step-dots">
              <span className={`mc-step-dot ${step === STEP.VEHICLE ? 'mc-step-dot--active' : 'mc-step-dot--done'}`} />
              <span className={`mc-step-dot ${step === STEP.FACE ? 'mc-step-dot--active' : ''}`} />
            </div>
            <p className="mc-step-title">
              {step === STEP.VEHICLE ? 'Bước 1 / 2 — Biển số xe' : 'Bước 2 / 2 — Khuôn mặt'}
            </p>
          </div>

          {isLoading && (
            <div className="mc-overlay-msg">
              <span className="mc-spinner" />
              <p>Đang khởi động camera…</p>
            </div>
          )}

          {permissionError && (
            <div className="mc-overlay-msg">
              <p className="mc-error-text">{permissionError}</p>
              <button className="mc-btn mc-btn--primary" onClick={() => startCamera(facingMode)}>
                Thử lại
              </button>
            </div>
          )}

          <video ref={videoRef} className="mc-video" autoPlay playsInline muted />

          <div className="mc-frame">
            <span className="mc-corner mc-corner--tl" />
            <span className="mc-corner mc-corner--tr" />
            <span className="mc-corner mc-corner--bl" />
            <span className="mc-corner mc-corner--br" />
          </div>

          <p className="mc-hint-text">{config.hint}</p>

          <div className="mc-controls">
            <button className="mc-flip-btn" onClick={handleFlip} aria-label="Đổi camera">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6M23 20v-6h-6" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
            </button>

            <button
              className="mc-capture-btn"
              onClick={handleCapture}
              disabled={isLoading || !!permissionError}
              aria-label="Chụp hình"
            >
              <span className="mc-capture-inner" />
            </button>

            <div style={{ width: 44 }} />
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default MobileCamera
