const API_URL = "http://localhost:5021/api/vehicle-types"

export async function getVehicleTypes() {
  const response = await fetch(API_URL)
  if (!response.ok) {
    throw new Error("Failed to fetch vehicle types")
  }

  return await response.json()
}

export async function getAvailableSlots(vehicleTypeId) {
  const response = await fetch(
    `http://localhost:5021/api/vehicle-types/${vehicleTypeId}/slots`
  )

  if (!response.ok) {
    throw new Error("Không thể tải thông tin chỗ trống")
  }

  return await response.json()
}