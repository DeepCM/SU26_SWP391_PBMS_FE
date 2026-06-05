const API_URL = 'http://localhost:5021/api/Auth'
import getAuthHeader from "../components/auth/authHeader"

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await response.json()
  return { status: response.status, data }
}

export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(userData)
  })
  const text = await response.text()
  return {status: response.status, data}
}

export const verifyEmail = async (email, otp) => {
  const response = await fetch(`${API_URL}/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  })
  const data = await response.json()
  return { status: response.status, data }
}

export const getUser = () => {
  const user = localStorage.getItem("user")

  if (!user || user === "undefined" || user === "null") {
    return null
  }

  try {
    return JSON.parse(user)
  } catch (e) {
    console.error("Invalid user in localStorage:", user)
    return null
  }
}

export const getToken = () => {
  return localStorage.getItem("token")
}