import getAuthHeader from '../components/auth/authHeader'

const CHECKOUT_API = `${import.meta.env.VITE_API_URL}/api/check-out`

async function post(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      data?.message ||
      (data?.errors && Object.values(data.errors).flat()[0]) ||
      `Lỗi ${response.status}`
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return { status: response.status, data }
}

/**
 * Tạo camera session để chụp ảnh check-out (khuôn mặt + biển số).
 * @param {{ parkingSessionId: number, flowType?: 'GUEST' | 'BOOKING' }} params
 */
export const createCheckoutPhotoSession = ({ parkingSessionId, flowType = 'GUEST' }) =>
  post(`${CHECKOUT_API}/photo-session`, { parkingSessionId, flowType })

/**
 * Xác minh vé khách vãng lai trước khi check-out (qua mã vé hoặc session code).
 * @param {{ ticketQrCode?: string, sessionCode?: string }} params
 */
export const verifyGuestCheckOut = ({ ticketQrCode, sessionCode }) =>
  post(`${CHECKOUT_API}/guest/verify`, { ticketQrCode, sessionCode })

/**
 * Xác nhận check-out khách vãng lai — mở barrier.
 */
export const confirmGuestCheckOut = (body) =>
  post(`${CHECKOUT_API}/guest/confirm`, body)

/**
 * Xác minh booking trước khi check-out.
 * @param {{ bookingQrCode?: string, bookingId?: number }} params
 */
export const verifyBookingCheckOut = ({ bookingQrCode, bookingId }) =>
  post(`${CHECKOUT_API}/booking/verify`, { bookingQrCode, bookingId })

/**
 * Xác nhận check-out theo booking — mở barrier.
 */
export const confirmBookingCheckOut = (body) =>
  post(`${CHECKOUT_API}/booking/confirm`, body)
