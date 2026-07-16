const API_URL = `${import.meta.env.VITE_API_URL}/api/parking-sessions`
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

export async function getParkingSessions(query = {}) {
  const params = new URLSearchParams()
  if (query.search) params.set('search', query.search)
  if (query.status) params.set('status', query.status)
  if (query.sessionType) params.set('sessionType', query.sessionType)
  if (query.checkinFrom) params.set('checkinFrom', query.checkinFrom)
  if (query.checkinTo) params.set('checkinTo', query.checkinTo)
  if (query.floorId) params.set('floorId', query.floorId)
  if (query.vehicleTypeId) params.set('vehicleTypeId', query.vehicleTypeId)
  if (query.bookingId) params.set('bookingId', query.bookingId)
  params.set('page', query.page || 1)
  params.set('pageSize', query.pageSize || 20)

  const response = await fetch(`${API_URL}?${params.toString()}`, {
    headers: getAuthHeader()
  })

  return handleResponse(response)
}

export async function getParkingSessionById(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: getAuthHeader()
  })

  return handleResponse(response)
}

// Backend chỉ có API danh sách tầng cho Admin (/api/admin/floors, policy AdminOnly),
// Staff/Manager không có quyền gọi endpoint đó. Vì không được sửa BE, suy ra danh sách
// tầng để lọc từ chính dữ liệu phiên gửi xe (page đầy đủ nhất được phép) thay vì
// một API tầng riêng.
export async function getParkingSessionFloorOptions() {
  const data = await getParkingSessions({ page: 1, pageSize: 100 })
  const floorsMap = new Map()
  for (const item of data.items || []) {
    if (!floorsMap.has(item.floorId)) {
      floorsMap.set(item.floorId, { id: item.floorId, name: item.floorName, number: item.floorNumber })
    }
  }
  return Array.from(floorsMap.values()).sort((a, b) => a.number - b.number)
}
