const API_URL = `${import.meta.env.VITE_API_URL}/api/reviews`
import getAuthHeader from "../components/auth/authHeader"

async function handleResponse(response) {
  if (!response.ok) {
    const text = await response.text()
    let message = response.status === 401
      ? 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại'
      : 'Có lỗi xảy ra'
    if (text) {
      try { message = JSON.parse(text).message || message } catch { /* keep fallback message */ }
    }
    throw new Error(message)
  }

  return await response.json()
}

export async function getMyReviewableSessions() {
  const response = await fetch(`${API_URL}/my-reviewable-sessions`, {
    headers: getAuthHeader()
  })

  return handleResponse(response)
}

export async function getMyReviews() {
  const response = await fetch(`${API_URL}/my-reviews`, {
    headers: getAuthHeader()
  })

  return handleResponse(response)
}

export async function createReview(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(data)
  })

  return handleResponse(response)
}

export async function getAllReviews(filters = {}) {
  const params = new URLSearchParams()
  if (filters.rating) params.set('rating', filters.rating)
  if (filters.replied !== undefined) params.set('replied', filters.replied)
  if (filters.sessionId) params.set('sessionId', filters.sessionId)
  if (filters.userId) params.set('userId', filters.userId)
  const qs = params.toString()

  const response = await fetch(`${API_URL}${qs ? `?${qs}` : ''}`, {
    headers: getAuthHeader()
  })

  return handleResponse(response)
}

export async function getReviewById(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: getAuthHeader()
  })

  return handleResponse(response)
}

export async function replyReview(id, data) {
  const response = await fetch(`${API_URL}/${id}/reply`, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(data)
  })

  return handleResponse(response)
}
