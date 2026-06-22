import { useState, useEffect, useRef, useCallback } from 'react'
import {
  createCameraSession,
  getCameraSession,
  cancelCameraSession,
  TERMINAL_STATUSES,
} from '../services/cameraSessionService'

const POLL_INTERVAL_MS = 3000
// Số lần lỗi mạng liên tiếp tối đa trước khi coi là mất kết nối thật và dừng polling.
const MAX_CONSECUTIVE_ERRORS = 3

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
  // true khi server trả 401 (token hết hạn/không hợp lệ) trong lúc polling —
  // caller (component) theo dõi cờ này để redirect về trang login.
  const [unauthorized, setUnauthorized] = useState(false)

  // Lưu sessionId và intervalId vào ref để tránh stale closure trong interval
  const sessionIdRef = useRef(null)
  const intervalRef = useRef(null)
  // Đếm số lần lỗi mạng liên tiếp — cho phép vài lần rớt mạng thoáng qua mà
  // không phải dừng hẳn polling và bắt scan lại từ đầu.
  const consecutiveErrorsRef = useRef(0)

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

          if (status === 401) {
            // Token hết hạn/không hợp lệ — dừng polling, để caller redirect login
            stopPolling()
            setUnauthorized(true)
            setPhase(SESSION_PHASES.DONE)
            return
          }

          if (status !== 200) {
            // Lỗi từ server — dừng polling, báo lỗi
            stopPolling()
            setError(data?.message || 'Không thể lấy thông tin session.')
            setPhase(SESSION_PHASES.DONE)
            return
          }

          consecutiveErrorsRef.current = 0
          setSessionData(data)

          // Dừng polling nếu session đã kết thúc
          if (TERMINAL_STATUSES.includes(data.status)) {
            stopPolling()
            setPhase(SESSION_PHASES.DONE)
          }
        } catch (err) {
          // Lỗi network — cho phép vài lần liên tiếp trước khi dừng hẳn polling,
          // tránh việc rớt mạng thoáng qua làm hỏng cả phiên đang quét.
          consecutiveErrorsRef.current += 1
          if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
            stopPolling()
            setError('Mất kết nối. Vui lòng thử lại.')
            setPhase(SESSION_PHASES.DONE)
          }
        }
      }, POLL_INTERVAL_MS)
    },
    [stopPolling]
  )

  /**
   * Tạo session với purpose chỉ định và bắt đầu polling.
   * @param {string} purpose
   */
  const startSession = useCallback(
    async (purpose) => {
      // Reset state cũ trước khi tạo session mới — tránh hiển thị ảnh/OCR của session cũ
      setSessionData(null)
      setMobileUrl(null)
      setError(null)
      setUnauthorized(false)
      consecutiveErrorsRef.current = 0
      sessionIdRef.current = null
      setPhase(SESSION_PHASES.CREATING)

      try {
        const { status, data } = await createCameraSession({ purpose })

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


  const reset = useCallback(() => {
    stopPolling()
    sessionIdRef.current = null
    consecutiveErrorsRef.current = 0
    setSessionData(null)
    setMobileUrl(null)
    setError(null)
    setUnauthorized(false)
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
        // Bỏ qua lỗi gọi cancel — phía staff vẫn muốn đóng/huỷ phiên trên UI,
        // session sẽ tự hết hạn theo expiresAt nếu request này thất bại.
      }
    }

    sessionIdRef.current = null
    consecutiveErrorsRef.current = 0
    setSessionData(null)
    setMobileUrl(null)
    setError(null)
    setUnauthorized(false)
    setPhase(SESSION_PHASES.IDLE)
  }, [stopPolling])

  return {
    phase,
    sessionData,
    mobileUrl,
    error,
    unauthorized,
    startSession,
    reset,
    cancelSession,
  }
}
