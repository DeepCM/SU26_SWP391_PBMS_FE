const API_URL = `${import.meta.env.VITE_API_URL}/api/bookings`
import getAuthHeader from "../components/auth/authHeader"

export async function createBooking(bookingData) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(bookingData)
  })
  if (!response.ok) {
    const text = await response.text()
    let message = response.status === 401
      ? 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại'
      : 'Có lỗi xảy ra'
    if (text) {
      try { message = JSON.parse(text).message || message } catch { }
    }
    throw new Error(message)
  }

  return await response.json()
}

export async function getMyBookings() {
  const response = await fetch(API_URL, {
    headers: getAuthHeader()
  })

  if (!response.ok) {
    throw new Error("Không thể tải lịch sử đặt xe của bạn")
  }

  return await response.json()
}

export async function cancelBooking(id) {
  const response = await fetch(`${API_URL}/${id}/cancel`, {
    method: "POST",
    headers: getAuthHeader()
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.message)
  }

  return true
}