import getAuthHeader from '../components/auth/authHeader'

const CAMERA_API = 'http://localhost:5021/api/camera-sessions'
const CHECKIN_API = 'http://localhost:5021/api/check-in'

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
    throw new Error(message)
  }

  return { status: response.status, data }
}

export const completeSession = (sessionId) =>
  post(`${CAMERA_API}/${sessionId}/complete`)

export const confirmGuestCheckIn = (body) =>
  post(`${CHECKIN_API}/guest/confirm`, body)

export const confirmBookingCheckIn = (body) =>
  post(`${CHECKIN_API}/booking/confirm`, body)
