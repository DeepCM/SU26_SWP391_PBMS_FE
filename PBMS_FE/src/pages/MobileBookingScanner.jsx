import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import jsQR from 'jsqr'
import { postQrResult } from '../services/cameraSessionService'
import '../styles/MobileBookingScanner.css'

const STATE = {
  SCANNING: 'scanning',
  UPLOADING: 'uploading',
  SUCCESS: 'success',
  ERROR: 'error',
}

const SCAN_INTERVAL_MS = 250
// Sau bao lâu quét liên tục không ra mã thì hiện gợi ý hỗ trợ cho người dùng.
const SCAN_SLOW_HINT_MS = 8000

function MobileBookingScanner() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('sessionId')
  const token = searchParams.get('token')

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const lastScanRef = useRef(0)
  const foundRef = useRef(false)
  const scanStartRef = useRef(0)

  const [pageState, setPageState] = useState(STATE.SCANNING)
  const [permissionError, setPermissionError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState(null)
  const [scanningSlow, setScanningSlow] = useState(false)

  const stopEverything = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }, [])

  const handleQrFound = useCallback(
    async (qrContent) => {
      if (foundRef.current) return
      foundRef.current = true
      stopEverything()
      setPageState(STATE.UPLOADING)

      try {
        const { status, data } = await postQrResult({ sessionId, token, qrContent })
        if (status >= 200 && status < 300) {
          setPageState(STATE.SUCCESS)
        } else {
          setErrorMsg(data?.message || `Lỗi ${status}: Không thể gửi kết quả.`)
          setPageState(STATE.ERROR)
        }
      } catch {
        setErrorMsg('Mất kết nối. Vui lòng thử lại.')
        setPageState(STATE.ERROR)
      }
    },
    [sessionId, token, stopEverything]
  )

  const scanLoop = useCallback(
    (timestamp) => {
      if (foundRef.current) return

      if (!scanStartRef.current) scanStartRef.current = timestamp

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
            inversionAttempts: 'attemptBoth',
          })
          if (code?.data) {
            handleQrFound(code.data)
            return
          }
        }

        if (!scanningSlow && timestamp - scanStartRef.current >= SCAN_SLOW_HINT_MS) {
          setScanningSlow(true)
        }
      }

      rafRef.current = requestAnimationFrame(scanLoop)
    },
    [handleQrFound, scanningSlow]
  )

  useEffect(() => {
    if (!sessionId || !token) return

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setIsLoading(false)
        rafRef.current = requestAnimationFrame(scanLoop)
      } catch (err) {
        setIsLoading(false)
        setPermissionError(
          err.name === 'NotAllowedError'
            ? 'Vui lòng cấp quyền truy cập camera để quét mã QR.'
            : 'Không thể khởi động camera. Vui lòng thử lại.'
        )
      }
    }

    startCamera()
    return stopEverything
  }, [sessionId, token, scanLoop, stopEverything])

  // ── Invalid link ──────────────────────────────────────
  if (!sessionId || !token) {
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

  // ── Uploading ─────────────────────────────────────────
  if (pageState === STATE.UPLOADING) {
    return (
      <div className="mbs-page mbs-page--center">
        <div className="mbs-card">
          <span className="mbs-spinner" />
          <p className="mbs-desc">Đang gửi kết quả…</p>
        </div>
      </div>
    )
  }

  // ── Success ───────────────────────────────────────────
  if (pageState === STATE.SUCCESS) {
    return (
      <div className="mbs-page mbs-page--center">
        <div className="mbs-card">
          <div className="mbs-icon mbs-icon--success">✓</div>
          <h2 className="mbs-title">Đọc mã thành công!</h2>
          <p className="mbs-desc">Thông tin booking đã được gửi về quầy. Bạn có thể đóng trang này.</p>
        </div>
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────
  if (pageState === STATE.ERROR) {
    return (
      <div className="mbs-page mbs-page--center">
        <div className="mbs-card">
          <div className="mbs-icon mbs-icon--error">✕</div>
          <h2 className="mbs-title">Gửi thất bại</h2>
          <p className="mbs-desc">{errorMsg}</p>
          <button
            className="mbs-retry-btn"
            onClick={() => {
              foundRef.current = false
              scanStartRef.current = 0
              setScanningSlow(false)
              setErrorMsg(null)
              setPageState(STATE.SCANNING)
              setIsLoading(true)
              streamRef.current?.getTracks().forEach((t) => t.stop())
              navigator.mediaDevices
                .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
                .then((stream) => {
                  streamRef.current = stream
                  if (videoRef.current) videoRef.current.srcObject = stream
                  setIsLoading(false)
                  rafRef.current = requestAnimationFrame(scanLoop)
                })
                .catch(() => setPermissionError('Không thể mở lại camera.'))
            }}
          >
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  // ── Scanning ──────────────────────────────────────────
  return (
    <div className="mbs-page">
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
          </div>
        )}

        <video ref={videoRef} className="mbs-video" autoPlay playsInline muted />

        <div className="mbs-header">
          <p className="mbs-header-title">Quét mã QR đặt chỗ</p>
          <p className="mbs-header-sub">Hướng camera vào mã QR của khách</p>
        </div>

        <div className="mbs-frame">
          <span className="mbs-corner mbs-corner--tl" />
          <span className="mbs-corner mbs-corner--tr" />
          <span className="mbs-corner mbs-corner--bl" />
          <span className="mbs-corner mbs-corner--br" />
          <span className="mbs-scan-line" />
        </div>

        <p className="mbs-hint">
          {scanningSlow
            ? 'Vẫn chưa đọc được mã — thử đưa mã gần hơn, tăng độ sáng hoặc lau sạch camera'
            : 'Giữ điện thoại ổn định, mã QR sẽ được đọc tự động'}
        </p>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default MobileBookingScanner
