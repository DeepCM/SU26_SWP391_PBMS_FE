const API_URL = "http://localhost:5021/api/payments"
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