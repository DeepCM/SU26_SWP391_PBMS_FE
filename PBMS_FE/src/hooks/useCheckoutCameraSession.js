import { useState, useEffect, useRef, useCallback } from 'react'
import { getCameraSession, cancelCameraSession, TERMINAL_STATUSES } from '../services/cameraSessionService'
import { createCheckoutPhotoSession } from '../services/checkOutService'

const POLL_INTERVAL_MS = 3000

/**
 * Các trạng thái nội bộ của hook (giống useCameraSession, dùng riêng cho check-out).
 */
export const SESSION_PHASES = {
  IDLE: 'idle',
  CREATING: 'creating',
  ACTIVE: 'active',
  DONE: 'done',
}

/**
 * useCheckoutCameraSession — tạo & poll camera session để chụp ảnh check-out
 * (khuôn mặt + biển số xe ra), gắn với một ParkingSessionId cụ thể.
 */
export function useCheckoutCameraSession() {
  const [phase, setPhase] = useState(SESSION_PHASES.IDLE)
  const [sessionData, setSessionData] = useState(null)
  const [mobileUrl, setMobileUrl] = useState(null)
  const [error, setError] = useState(null)

  const intervalRef = useRef(null)
  const sessionIdRef = useRef(null)

  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  const startPolling = useCallback(
    (sessionId) => {
      stopPolling()

      intervalRef.current = setInterval(async () => {
        try {
          const { status, data } = await getCameraSession(sessionId)

          if (status !== 200) {
            stopPolling()
            setError(data?.message || 'Không thể lấy thông tin session.')
            setPhase(SESSION_PHASES.DONE)
            return
          }

          setSessionData(data)

          if (TERMINAL_STATUSES.includes(data.status)) {
            stopPolling()
            setPhase(SESSION_PHASES.DONE)
          }
        } catch {
          stopPolling()
          setError('Mất kết nối. Vui lòng thử lại.')
          setPhase(SESSION_PHASES.DONE)
        }
      }, POLL_INTERVAL_MS)
    },
    [stopPolling]
  )

  /**
   * Tạo phiên chụp ảnh check-out cho một ParkingSession cụ thể.
   * @param {number} parkingSessionId
   * @param {'GUEST' | 'BOOKING'} flowType
   */
  const startSession = useCallback(
    async (parkingSessionId, flowType = 'GUEST') => {
      setSessionData(null)
      setMobileUrl(null)
      setError(null)
      sessionIdRef.current = null
      setPhase(SESSION_PHASES.CREATING)

      try {
        const { status, data } = await createCheckoutPhotoSession({
          parkingSessionId,
          flowType,
        })

        if (status !== 201) {
          setError(data?.message || 'Không thể tạo phiên chụp ảnh. Vui lòng thử lại.')
          setPhase(SESSION_PHASES.IDLE)
          return
        }

        sessionIdRef.current = data.cameraSessionId
        setMobileUrl(data.mobileUrl)
        setPhase(SESSION_PHASES.ACTIVE)
        startPolling(data.cameraSessionId)
      } catch {
        setError('Không thể kết nối server. Vui lòng thử lại.')
        setPhase(SESSION_PHASES.IDLE)
      }
    },
    [startPolling]
  )

  const reset = useCallback(() => {
    stopPolling()
    sessionIdRef.current = null
    setSessionData(null)
    setMobileUrl(null)
    setError(null)
    setPhase(SESSION_PHASES.IDLE)
  }, [stopPolling])

  /**
   * Huỷ session hiện tại — gọi POST /camera-sessions/{id}/cancel để backend
   * chuyển trạng thái CameraSession sang Cancelled, rồi dọn sạch state local.
   */
  const cancelSession = useCallback(async () => {
    const sessionId = sessionIdRef.current
    stopPolling()

    if (sessionId) {
      try {
        await cancelCameraSession(sessionId)
      } catch {
        // Bỏ qua lỗi gọi cancel — staff vẫn muốn đóng/huỷ phiên trên UI.
      }
    }

    sessionIdRef.current = null
    setSessionData(null)
    setMobileUrl(null)
    setError(null)
    setPhase(SESSION_PHASES.IDLE)
  }, [stopPolling])

  return {
    phase,
    sessionData,
    mobileUrl,
    error,
    startSession,
    reset,
    cancelSession,
  }
}
