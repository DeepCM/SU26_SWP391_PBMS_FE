const API_URL = `${import.meta.env.VITE_API_URL}/api/incidents`
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

export async function getIncidents(filters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.incidentType) params.set('incidentType', filters.incidentType)
  if (filters.sessionId) params.set('sessionId', filters.sessionId)
  const qs = params.toString()

  const response = await fetch(`${API_URL}${qs ? `?${qs}` : ''}`, {
    headers: getAuthHeader()
  })

  return handleResponse(response)
}

export async function getMyReportedIncidents(filters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.incidentType) params.set('incidentType', filters.incidentType)
  if (filters.sessionId) params.set('sessionId', filters.sessionId)
  const qs = params.toString()

  const response = await fetch(`${API_URL}/my-reported${qs ? `?${qs}` : ''}`, {
    headers: getAuthHeader()
  })

  return handleResponse(response)
}

// Backend trả reporterName/handlerName rỗng ngay sau khi tạo/handle/resolve...
// (navigation property ReportedByNavigation/HandledByNavigation chưa được nạp
// lại trong cùng lượt request) — gọi lại GET để lấy tên chính xác, dùng thay
// cho response của các API POST ở trên khi cần hiển thị reporterName/handlerName.
export async function getIncidentById(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: getAuthHeader()
  })

  return handleResponse(response)
}

export async function getMyReportedIncidentById(id) {
  const response = await fetch(`${API_URL}/my-reported/${id}`, {
    headers: getAuthHeader()
  })

  return handleResponse(response)
}

export async function createIncident(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(data)
  })

  return handleResponse(response)
}

export async function handleIncident(id, data) {
  const response = await fetch(`${API_URL}/${id}/handle`, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(data)
  })

  return handleResponse(response)
}

export async function requestIncidentMoreInfo(id, data) {
  const response = await fetch(`${API_URL}/${id}/request-more-info`, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(data)
  })

  return handleResponse(response)
}

export async function resolveIncident(id, data) {
  const response = await fetch(`${API_URL}/${id}/resolve`, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(data)
  })

  return handleResponse(response)
}

export async function provideAdditionalInfo(id, data) {
  const response = await fetch(`${API_URL}/${id}/provide-additional-info`, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(data)
  })

  return handleResponse(response)
}
