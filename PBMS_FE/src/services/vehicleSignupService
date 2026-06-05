const API_URL = 'http://localhost:5021/api/'
import getAuthHeader from "../components/auth/authHeader"

export const signupVehicle = async (vehicleData) => {
  const response = await fetch(`${API_URL}/signup-vehicle`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(vehicleData)
  })
  const data = await response.json()
  return { status: response.status, data }
}

export const editVehicle = async (vehicleData) => {
  const response = await fetch(`${API_URL}/signup-vehicle/${vehicleData.id}`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify(vehicleData)
  })
  const data = await response.json()
  return { status: response.status, data }
}

export async function getVehicle() {
  const response = await fetch(API_URL, {
      headers: getAuthHeader()
    })
    if (!response.ok) {
    throw new Error("Không thể tải thông tin xe của bạn")
  }
  return await response.json()
}

export async function removeVehicle(id) {
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
