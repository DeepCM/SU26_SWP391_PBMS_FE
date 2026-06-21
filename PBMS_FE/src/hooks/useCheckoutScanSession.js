import { useState, useEffect, useRef, useCallback } from 'react'
import {
  createCheckoutScanSession,
  getCheckoutScanSession,
  cancelCheckoutScanSession,
} from '../services/checkOutService'

const POLL_INTERVAL_MS = 3000
const TERMINAL_STATUSES = ['Completed', 'Expired', 'Cancelled']

export const SCAN_SESSION_PHASES = {
  IDLE: 'idle',
  CREATING: 'creating',
  ACTIVE: 'active',
  DONE: 'done',
}

/**
 * useCheckoutScanSession — tạo & poll phiên quét QR check-out (api/check-out/scan-sessions)
 * để khách tự quét mã vé/booking bằng điện thoại, thay cho việc nhân viên nhập tay.
 */
export function useCheckoutScanSession() {
  const [phase, setPhase] = useState(SCAN_SESSION_PHASES.IDLE)
  const [scanSessionId, setScanSessionId] = useState(null)
  const [scanData, setScanData] = useState(null)
  const [mobileUrl, setMobileUrl] = useState(null)
  const [error, setError] = useState(null)

  const intervalRef = useRef(null)

  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => () => stopPolling(), [stopPolling])

  const startPolling = useCallback(
    (id) => {
      stopPolling()

      intervalRef.current = setInterval(async () => {
        try {
          const { status, data } = await getCheckoutScanSession(id)

          if (status !== 200) {
            stopPolling()
            setError(data?.message || 'Không thể lấy thông tin phiên quét.')
            setPhase(SCAN_SESSION_PHASES.DONE)
            return
          }

          setScanData(data)

          if (TERMINAL_STATUSES.includes(data.status)) {
            stopPolling()
            setPhase(SCAN_SESSION_PHASES.DONE)
          }
        } catch {
          stopPolling()
          setError('Mất kết nối. Vui lòng thử lại.')
          setPhase(SCAN_SESSION_PHASES.DONE)
        }
      }, POLL_INTERVAL_MS)
    },
    [stopPolling]
  )

  const startSession = useCallback(async () => {
    setScanSessionId(null)
    setScanData(null)
    setMobileUrl(null)
    setError(null)
    setPhase(SCAN_SESSION_PHASES.CREATING)

    try {
      const { status, data } = await createCheckoutScanSession()

      if (status !== 201) {
        setError(data?.message || 'Không thể tạo phiên quét. Vui lòng thử lại.')
        setPhase(SCAN_SESSION_PHASES.IDLE)
        return
      }

      setScanSessionId(data.scanSessionId)
      setMobileUrl(data.scannerUrl)
      setScanData({ status: data.status, expiresAt: data.expiresAt })
      setPhase(SCAN_SESSION_PHASES.ACTIVE)
      startPolling(data.scanSessionId)
    } catch {
      setError('Không thể kết nối server. Vui lòng thử lại.')
      setPhase(SCAN_SESSION_PHASES.IDLE)
    }
  }, [startPolling])

  const cancelSession = useCallback(async () => {
    stopPolling()
    if (scanSessionId) {
      try {
        await cancelCheckoutScanSession(scanSessionId)
      } catch {
        // phiên có thể đã kết thúc — bỏ qua lỗi huỷ
      }
    }
  }, [scanSessionId, stopPolling])

  const reset = useCallback(() => {
    stopPolling()
    setScanSessionId(null)
    setScanData(null)
    setMobileUrl(null)
    setError(null)
    setPhase(SCAN_SESSION_PHASES.IDLE)
  }, [stopPolling])

  return {
    phase,
    scanSessionId,
    scanData,
    mobileUrl,
    error,
    startSession,
    cancelSession,
    reset,
  }
}
