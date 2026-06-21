const API_URL = `${import.meta.env.VITE_API_URL}/api/payments`
import getAuthHeader from "../components/auth/authHeader"

export async function getPaymentLink(bookingId) {
  const response = await fetch(
    `${API_URL}/booking/${bookingId}/link`,
    {
      method: "POST",
      headers: getAuthHeader()
    }
  )

  if (!response.ok) {
    const text = await response.text()
    let message = response.status === 401
      ? 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại'
      : 'Có lỗi xảy ra'
    if (text) {
      try { message = JSON.parse(text).message || message } catch {}
    }
    throw new Error(message)
  }

  return await response.json()
}

// Đồng bộ trạng thái thanh toán từ PayOS (fallback khi webhook không tới).
// Trả về booking đã cập nhật (kèm QR nếu đã thanh toán). Không throw để không
// chặn việc render danh sách — chỉ trả về null nếu lỗi.
export async function syncPaymentStatus(bookingId) {
  try {
    const response = await fetch(
      `${API_URL}/booking/${bookingId}/sync`,
      {
        method: "POST",
        headers: getAuthHeader()
      }
    )
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

// Đồng bộ trạng thái thanh toán phí checkout từ PayOS (fallback khi webhook
// không tới). Trả về CheckoutPaymentResponseDto đã cập nhật, hoặc null nếu lỗi.
export async function syncCheckoutPaymentStatus(parkingSessionId) {
  try {
    const response = await fetch(
      `${API_URL}/checkout/${parkingSessionId}/sync`,
      {
        method: "POST",
        headers: getAuthHeader()
      }
    )
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}