import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import jsQR from 'jsqr'
import { submitCheckoutScanResult } from '../services/checkOutService'
import '../styles/MobileBookingScanner.css'

const SCAN_INTERVAL_MS = 250

const STAGE = {
  SCAN: 'scan',
  SUBMITTING: 'submitting',
  DONE: 'done',
  ERROR: 'error',
}

function readTokenFromHash() {
  const match = window.location.hash.match(/token=([^&]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

function MobileCheckoutScan() {
  const [searchParams] = useSearchParams()
  const scanSessionId = searchParams.get('scanSessionId')
  const token = readTokenFromHash()

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const lastScanRef = useRef(0)
  const foundRef = useRef(false)

  const [stage, setStage] = useState(STAGE.SCAN)
  const [isLoading, setIsLoading] = useState(true)
  const [permissionError, setPermissionError] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [manualMode, setManualMode] = useState(false)
  const [manualValue, setManualValue] = useState('')

  const missingParams = !scanSessionId || !token

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }, [])

  const submitQrValue = useCallback(
    async (qrValue) => {
      setStage(STAGE.SUBMITTING)
      setErrorMsg(null)
      try {
        const { status, data } = await submitCheckoutScanResult({
          scanSessionId,
          token,
          qrValue,
        })
        if (status >= 200 && status < 300) {
          setStage(STAGE.DONE)
        } else {
          setErrorMsg(data?.message || `Lỗi ${status}: Không thể gửi kết quả.`)
          setStage(STAGE.ERROR)
        }
      } catch {
        setErrorMsg('Mất kết nối. Vui lòng thử lại.')
        setStage(STAGE.ERROR)
      }
    },
    [scanSessionId, token]
  )

  const handleQrFound = useCallback(
    (qrContent) => {
      if (foundRef.current) return
      foundRef.current = true
      stopCamera()
      submitQrValue(qrContent)
    },
    [stopCamera, submitQrValue]
  )

  const scanLoop = useCallback(
    (timestamp) => {
      if (foundRef.current) return

      if (timestamp - lastScanRef.current >= SCAN_INTERVAL_MS) {
        lastScanRef.current = timestamp

        const video = videoRef.current
        const canvas = canvasRef.current
        if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          canvas.getContext('2d').drawImage(video, 0, 0)
          const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          })
          if (code?.data) {
            handleQrFound(code.data)
            return
          }
        }
      }

      rafRef.current = requestAnimationFrame(scanLoop)
    },
    [handleQrFound]
  )

  const startCamera = useCallback(async () => {
    setIsLoading(true)
    setPermissionError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      setIsLoading(false)
      setPermissionError(
        window.isSecureContext
          ? 'Trình duyệt không hỗ trợ truy cập camera.'
          : 'Cần mở trang này qua đường dẫn HTTPS để dùng camera.'
      )
      return
    }

    const constraintsList = [
      { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      { video: { facingMode: 'environment' }, audio: false },
      { video: true, audio: false },
    ]

    for (const constraints of constraintsList) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setIsLoading(false)
        rafRef.current = requestAnimationFrame(scanLoop)
        return
      } catch (err) {
        if (err.name === 'OverconstrainedError') continue
        setIsLoading(false)
        setPermissionError(
          err.name === 'NotAllowedError'
            ? 'Vui lòng cấp quyền truy cập camera để quét mã QR.'
            : err.name === 'NotFoundError'
              ? 'Không tìm thấy camera trên thiết bị.'
              : err.name === 'NotReadableError'
                ? 'Camera đang được dùng bởi ứng dụng khác. Vui lòng đóng ứng dụng đó và thử lại.'
                : 'Không thể khởi động camera. Vui lòng thử lại.'
        )
        return
      }
    }

    setIsLoading(false)
    setPermissionError('Không thể khởi động camera. Vui lòng thử lại.')
  }, [scanLoop])

  useEffect(() => {
    if (missingParams || stage !== STAGE.SCAN || manualMode) return
    startCamera()
    return stopCamera
  }, [missingParams, stage, manualMode, startCamera, stopCamera])

  useEffect(() => stopCamera, [stopCamera])

  function handleManualSubmit(e) {
    e.preventDefault()
    if (!manualValue.trim()) return
    foundRef.current = true
    submitQrValue(manualValue.trim())
  }

  function handleRetry() {
    foundRef.current = false
    setErrorMsg(null)
    setManualValue('')
    setStage(STAGE.SCAN)
  }

  // ── Link không hợp lệ ──────────────────────────────────
  if (missingParams) {
    return (
      <div className="mbs-page mbs-page--center">
        <div className="mbs-card">
          <div className="mbs-icon mbs-icon--warn">⚠</div>
          <h2 className="mbs-title">Link không hợp lệ</h2>
          <p className="mbs-desc">Vui lòng thử lại từ màn hình nhân viên.</p>
        </div>
      </div>
    )
  }

  // ── Submitting ────────────────────────────────────────
  if (stage === STAGE.SUBMITTING) {
    return (
      <div className="mbs-page mbs-page--center">
        <div className="mbs-card">
          <span className="mbs-spinner" />
          <p className="mbs-desc">Đang gửi kết quả…</p>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────
  if (stage === STAGE.ERROR) {
    return (
      <div className="mbs-page mbs-page--center">
        <div className="mbs-card">
          <div className="mbs-icon mbs-icon--error">✕</div>
          <h2 className="mbs-title">Không thể tiếp tục</h2>
          <p className="mbs-desc">{errorMsg}</p>
          <button className="mbs-retry-btn" onClick={handleRetry}>
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  // ── Done ──────────────────────────────────────────────
  if (stage === STAGE.DONE) {
    return (
      <div className="mbs-page mbs-page--center">
        <div className="mbs-card">
          <div className="mbs-icon mbs-icon--success">✓</div>
          <h2 className="mbs-title">Đã quét thành công!</h2>
          <p className="mbs-desc">Thông tin vé/booking đã được gửi về quầy. Bạn có thể đóng trang này.</p>
        </div>
      </div>
    )
  }

  // ── Scan (default) ──────────────────────────────────────
  return (
    <div className="mbs-page">
      {manualMode ? (
        <div className="mbs-page mbs-page--center">
          <form className="mbs-card" onSubmit={handleManualSubmit}>
            <h2 className="mbs-title">Nhập mã thủ công</h2>
            <p className="mbs-desc">Nhập mã vé (PS-xxxxxx) hoặc mã Booking</p>
            <input
              type="text"
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              placeholder="VD: PS-000001 hoặc 9"
              style={{ width: '100%', padding: '10px 12px', fontSize: 16, borderRadius: 8, border: '1px solid #d1d5db', marginBottom: 12 }}
              autoFocus
            />
            <button className="mbs-retry-btn" type="submit" disabled={!manualValue.trim()}>
              Xác minh
            </button>
            <button
              type="button"
              className="mbs-retry-btn"
              style={{ marginTop: 8, background: 'transparent', color: '#6b7280' }}
              onClick={() => setManualMode(false)}
            >
              Quay lại quét QR
            </button>
          </form>
        </div>
      ) : (
        <div className="mbs-viewfinder">
          {isLoading && (
            <div className="mbs-overlay">
              <span className="mbs-spinner" />
              <p>Đang khởi động camera…</p>
            </div>
          )}

          {permissionError && (
            <div className="mbs-overlay">
              <p className="mbs-error-text">{permissionError}</p>
              <button className="mbs-retry-btn" onClick={startCamera}>
                Thử lại
              </button>
            </div>
          )}

          <video ref={videoRef} className="mbs-video" autoPlay playsInline muted />

          <div className="mbs-header">
            <p className="mbs-header-title">Quét mã vé / booking khách</p>
            <p className="mbs-header-sub">Hướng camera vào mã QR trên vé hoặc của khách</p>
          </div>

          <div className="mbs-frame">
            <span className="mbs-corner mbs-corner--tl" />
            <span className="mbs-corner mbs-corner--tr" />
            <span className="mbs-corner mbs-corner--bl" />
            <span className="mbs-corner mbs-corner--br" />
            <span className="mbs-scan-line" />
          </div>

          <p className="mbs-hint">Giữ điện thoại ổn định, mã QR sẽ được đọc tự động</p>

          <button
            type="button"
            className="mbs-retry-btn"
            style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)' }}
            onClick={() => {
              stopCamera()
              setManualMode(true)
            }}
          >
            Nhập mã thủ công
          </button>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default MobileCheckoutScan
