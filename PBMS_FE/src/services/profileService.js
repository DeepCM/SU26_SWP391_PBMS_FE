const API_URL = `${import.meta.env.VITE_API_URL}/api/profile`
import getAuthHeader from "../components/auth/authHeader"

// GET /api/profile — lấy hồ sơ người dùng đang đăng nhập
export async function getProfile() {
  const response = await fetch(API_URL, {
    headers: getAuthHeader()
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || "Không thể tải hồ sơ người dùng")
  }
  return await response.json()
}

// PUT /api/profile — cập nhật FullName + Phone + Avatar (multipart/form-data)
// Không set Content-Type thủ công: trình duyệt tự thêm boundary cho FormData.
export async function updateProfile(formData) {
  const token = localStorage.getItem("token")
  const response = await fetch(API_URL, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || "Cập nhật hồ sơ thất bại")
  }
  return await response.json()
}
