import getAuthHeader from '../components/auth/authHeader'

const CHECKOUT_API = `${import.meta.env.VITE_API_URL}/api/check-out`
const SCAN_SESSIONS_API = `${CHECKOUT_API}/scan-sessions`

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

/**
 * Tạo phiên quét QR check-out (staff) — trả về scannerUrl chứa token để hiện QR cho khách.
 */
export const createCheckoutScanSession = () => post(SCAN_SESSIONS_API)

/**
 * Lấy trạng thái phiên quét — dùng để polling từ trang CheckOut.
 * @param {string} scanSessionId
 */
export const getCheckoutScanSession = async (scanSessionId) => {
  const response = await fetch(`${SCAN_SESSIONS_API}/${scanSessionId}`, {
    headers: { ...getAuthHeader() },
  })
  const data = await response.json().catch(() => null)
  return { status: response.status, data }
}

/**
 * Huỷ phiên quét đang chờ.
 * @param {string} scanSessionId
 */
export const cancelCheckoutScanSession = (scanSessionId) =>
  post(`${SCAN_SESSIONS_API}/${scanSessionId}/cancel`)

/**
 * Gửi nội dung QR đọc được từ điện thoại khách — endpoint anonymous,
 * xác thực qua token gắn trong scannerUrl (không dùng Authorization header của staff).
 * @param {{ scanSessionId: string, token: string, qrValue: string }} params
 */
export const submitCheckoutScanResult = async ({ scanSessionId, token, qrValue }) => {
  const response = await fetch(`${SCAN_SESSIONS_API}/${scanSessionId}/result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Checkout-Scan-Token': token },
    body: JSON.stringify({ qrValue }),
  })
  const data = await response.json().catch(() => null)
  return { status: response.status, data }
}
