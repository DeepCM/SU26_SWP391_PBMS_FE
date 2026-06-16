import { useState, useEffect, useRef, useCallback } from 'react'
import {
  createCameraSession,
  getCameraSession,
  cancelCameraSession,
  TERMINAL_STATUSES,
} from '../services/cameraSessionService'

const POLL_INTERVAL_MS = 3000

/**
 * Các trạng thái nội bộ của hook (khác với status từ backend).
 * idle      — chưa có session nào
 * creating  — đang gọi POST tạo session
 * active    — session đang tồn tại, đang polling
 * done      — session kết thúc (Completed / Expired / Cancelled)
 */
export const SESSION_PHASES = {
  IDLE: 'idle',
  CREATING: 'creating',
  ACTIVE: 'active',
  DONE: 'done',
}

/**
 * useCameraSession
 *
 * Expose:
 *  - phase: 'idle' | 'creating' | 'active' | 'done'
 *  - sessionData: object | null  — response mới nhất từ GET /camera-sessions/{id}
 *  - mobileUrl: string | null    — URL để generate QR
 *  - error: string | null        — thông báo lỗi
 *  - startSession(purpose, gateId) — tạo session với purpose chỉ định
 *  - reset()                       — dọn sạch state, sẵn sàng cho xe tiếp theo
 */
export function useCameraSession() {
  const [phase, setPhase] = useState(SESSION_PHASES.IDLE)
  const [sessionData, setSessionData] = useState(null)
  const [mobileUrl, setMobileUrl] = useState(null)
  const [error, setError] = useState(null)

  // Lưu sessionId và intervalId vào ref để tránh stale closure trong interval
  const sessionIdRef = useRef(null)
  const intervalRef = useRef(null)

  // Dừng polling — gọi bất cứ khi nào cần
  const stopPolling = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  // Cleanup khi component unmount
  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  // Bắt đầu polling GET /camera-sessions/{sessionId}
  const startPolling = useCallback(
    (sessionId) => {
      // Tránh tạo nhiều interval cùng lúc
      stopPolling()

      intervalRef.current = setInterval(async () => {
        try {
          const { status, data } = await getCameraSession(sessionId)

          if (status !== 200) {
            // Lỗi từ server — dừng polling, báo lỗi
            stopPolling()
            setError(data?.message || 'Không thể lấy thông tin session.')
            setPhase(SESSION_PHASES.DONE)
            return
          }

          setSessionData(data)

          // Dừng polling nếu session đã kết thúc
          if (TERMINAL_STATUSES.includes(data.status)) {
            stopPolling()
            setPhase(SESSION_PHASES.DONE)
          }
        } catch (err) {
          // Lỗi network — dừng polling
          stopPolling()
          setError('Mất kết nối. Vui lòng thử lại.')
          setPhase(SESSION_PHASES.DONE)
        }
      }, POLL_INTERVAL_MS)
    },
    [stopPolling]
  )

  /**
   * Tạo session với purpose chỉ định và bắt đầu polling.
   * @param {string} purpose
   * @param {number} gateId
   */
  const startSession = useCallback(
    async (purpose, gateId) => {
      // Reset state cũ trước khi tạo session mới — tránh hiển thị ảnh/OCR của session cũ
      setSessionData(null)
      setMobileUrl(null)
      setError(null)
      sessionIdRef.current = null
      setPhase(SESSION_PHASES.CREATING)

      try {
        const { status, data } = await createCameraSession({
          purpose,
          // TODO: lấy gateId thực từ context/profile/config
          gateId,
        })

        if (status !== 201) {
          setError(data?.message || 'Không thể tạo session. Vui lòng thử lại.')
          setPhase(SESSION_PHASES.IDLE)
          return
        }

        sessionIdRef.current = data.sessionId
        setMobileUrl(data.mobileUrl)
        setPhase(SESSION_PHASES.ACTIVE)
        startPolling(data.sessionId)
      } catch (err) {
        setError('Không thể kết nối server. Vui lòng thử lại.')
        setPhase(SESSION_PHASES.IDLE)
      }
    },
    [startPolling]
  )


  /**
   * Huỷ session hiện tại nếu còn active, sau đó reset toàn bộ state.
   * Gọi khi staff bấm "xe tiếp theo" hoặc đóng modal giữa chừng.
   */
  const reset = useCallback(async () => {
    stopPolling()

    const currentSessionId = sessionIdRef.current
    if (currentSessionId && phase === SESSION_PHASES.ACTIVE) {
      // Cố gắng cancel session đang active — không block UI dù thất bại
      try {
        await cancelCameraSession(currentSessionId)
      } catch (_) {
        // Bỏ qua lỗi cancel — session sẽ tự expire
      }
    }

    sessionIdRef.current = null
    setSessionData(null)
    setMobileUrl(null)
    setError(null)
    setPhase(SESSION_PHASES.IDLE)
  }, [phase, stopPolling])

  return {
    phase,
    sessionData,
    mobileUrl,
    error,
    startSession,
    reset,
  }
}
