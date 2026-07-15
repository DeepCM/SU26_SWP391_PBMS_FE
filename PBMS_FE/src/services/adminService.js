import getAuthHeader from "../components/auth/authHeader"

const API_URL = `${import.meta.env.VITE_API_URL}/api/admin`

// ── UTILITY ERROR HANDLER ──────────────────────────────────────────────────
async function handleResponse(response, defaultErrorMessage) {
  if (!response.ok) {
    let detailError = ""
    try {
      const errorJson = await response.json()
      detailError = errorJson.message || errorJson.error || ""
    } catch {
      // No JSON error body returned
    }
    throw new Error(detailError ? `${defaultErrorMessage}: ${detailError}` : defaultErrorMessage)
  }
  
  // Return empty object on 204 No Content or empty responses
  if (response.status === 204) return true
  const text = await response.text()
  return text ? JSON.parse(text) : true
}

// ── 1. ADMIN FLOORS API ────────────────────────────────────────────────────

export async function getFloors() {
  const response = await fetch(`${API_URL}/floors`, {
    headers: getAuthHeader()
  })
  return handleResponse(response, "Không thể tải danh sách tầng")
}

export async function getFloorById(id) {
  const response = await fetch(`${API_URL}/floors/${id}`, {
    headers: getAuthHeader()
  })
  return handleResponse(response, `Không thể tải chi tiết tầng ID: ${id}`)
}

export async function createFloor(floorData) {
  const response = await fetch(`${API_URL}/floors`, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(floorData)
  })
  return handleResponse(response, "Không thể khởi tạo tầng mới")
}

export async function activateFloor(id) {
  const response = await fetch(`${API_URL}/floors/${id}/activate`, {
    method: "POST",
    headers: getAuthHeader()
  })
  return handleResponse(response, `Không thể kích hoạt hoạt động tầng ID: ${id}`)
}

export async function deactivateFloor(id) {
  const response = await fetch(`${API_URL}/floors/${id}/deactivate`, {
    method: "POST",
    headers: getAuthHeader()
  })
  return handleResponse(response, `Không thể tạm dừng hoạt động tầng ID: ${id}`)
}

export async function updateFloor(id, updateData) {
  const response = await fetch(`${API_URL}/floors/${id}`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(updateData)
  })
  return handleResponse(response, `Không thể cập nhật thông tin tầng ID: ${id}`)
}

export async function updateFloorCapacity(id, capacityData) {
  const response = await fetch(`${API_URL}/floors/${id}/capacity`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(capacityData)
  })
  return handleResponse(response, `Không thể cập nhật cấu hình sức chứa của tầng ID: ${id}`)
}

export async function updateFloorVehicleTypes(id, vehicleTypesData) {
  const response = await fetch(`${API_URL}/floors/${id}/vehicle-types`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(vehicleTypesData)
  })
  return handleResponse(response, `Không thể cập nhật danh sách loại xe hỗ trợ của tầng ID: ${id}`)
}

export async function deleteFloor(id) {
  const response = await fetch(`${API_URL}/floors/${id}`, {
    method: "DELETE",
    headers: getAuthHeader()
  })
  return handleResponse(response, `Không thể xóa tầng khỏi hệ thống ID: ${id}`)
}


// ── 2. ADMIN POLICIES API ──────────────────────────────────────────────────

export async function getPolicies() {
  const response = await fetch(`${API_URL}/policies`, {
    headers: getAuthHeader()
  })
  return handleResponse(response, "Không thể tải danh sách chính sách phí")
}

export async function getPolicyById(id) {
  const response = await fetch(`${API_URL}/policies/${id}`, {
    headers: getAuthHeader()
  })
  return handleResponse(response, `Không thể tải chi tiết chính sách ID: ${id}`)
}

export async function createPolicy(policyData) {
  const response = await fetch(`${API_URL}/policies`, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(policyData)
  })
  return handleResponse(response, "Không thể khởi tạo chính sách mới")
}

export async function activatePolicy(id) {
  const response = await fetch(`${API_URL}/policies/${id}/activate`, {
    method: "POST",
    headers: getAuthHeader()
  })
  return handleResponse(response, `Không thể áp dụng kích hoạt chính sách ID: ${id}`)
}

export async function deactivatePolicy(id) {
  const response = await fetch(`${API_URL}/policies/${id}/deactivate`, {
    method: "POST",
    headers: getAuthHeader()
  })
  return handleResponse(response, `Không thể vô hiệu hóa áp dụng chính sách ID: ${id}`)
}

export async function updatePolicy(id, policyData) {
  const response = await fetch(`${API_URL}/policies/${id}`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(policyData)
  })
  return handleResponse(response, `Không thể điều chỉnh cấu hình chính sách ID: ${id}`)
}


// ── 3. ADMIN USERS API ─────────────────────────────────────────────────────

export async function getUsers() {
  const response = await fetch(`${API_URL}/users`, {
    headers: getAuthHeader()
  })
  return handleResponse(response, "Không thể tải danh sách tài khoản người dùng")
}

export async function getUserById(id) {
  const response = await fetch(`${API_URL}/users/${id}`, {
    headers: getAuthHeader()
  })
  return handleResponse(response, `Không thể xem hồ sơ người dùng ID: ${id}`)
}

export async function createUser(userData) {
  const response = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(userData)
  })
  return handleResponse(response, "Không thể khởi tạo tài khoản quản lý mới")
}

export async function resetUserPassword(id, passwordData) {
  const response = await fetch(`${API_URL}/users/${id}/reset-password`, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(passwordData)
  })
  return handleResponse(response, `Không thể đặt lại mật khẩu cho tài khoản ID: ${id}`)
}

export async function activateUser(id) {
  const response = await fetch(`${API_URL}/users/${id}/activate`, {
    method: "POST",
    headers: getAuthHeader()
  })
  return handleResponse(response, `Không thể mở khóa hoạt động cho tài khoản ID: ${id}`)
}

export async function deactivateUser(id) {
  const response = await fetch(`${API_URL}/users/${id}/deactivate`, {
    method: "POST",
    headers: getAuthHeader()
  })
  return handleResponse(response, `Không thể đình bản tạm khóa tài khoản ID: ${id}`)
}

export async function updateUser(id, updateData) {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(updateData)
  })
  return handleResponse(response, `Không thể cập nhật hồ sơ cá nhân của tài khoản ID: ${id}`)
}

export async function updateUserRole(id, roleData) {
  const response = await fetch(`${API_URL}/users/${id}/role`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify(roleData)
  })
  return handleResponse(response, `Không thể chuyển đổi vai trò hệ thống của tài khoản ID: ${id}`)
}