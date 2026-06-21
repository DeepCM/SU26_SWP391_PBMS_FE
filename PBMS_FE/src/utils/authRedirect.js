/**
 * Nếu lỗi là 401 (token hết hạn/không hợp lệ), xoá session cũ và chuyển về /login.
 * @param {Error & { status?: number }} err
 * @param {(path: string) => void} navigate
 * @returns {boolean} true nếu đã redirect (caller nên dừng xử lý lỗi tiếp)
 */
export function redirectToLoginIfUnauthorized(err, navigate) {
  if (err?.status !== 401) return false

  localStorage.removeItem('token')
  localStorage.removeItem('user')
  navigate('/login')
  return true
}
