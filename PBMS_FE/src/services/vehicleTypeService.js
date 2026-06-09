const API_URL = "http://localhost:5021/api/vehicle-types"

export async function getVehicleTypes() {
  const response = await fetch(API_URL)
  if (!response.ok) {
    throw new Error("Không thể tải thông tin loại xe")
  }

  return await response.json()
}

export async function getAvailableSlots(vehicleTypeId) {
  const response = await fetch(`${API_URL}/${vehicleTypeId}/slots`)
  const data = await response.json()
  if (!response.ok) {
    throw new Error("Không thể tải thông tin chỗ trống")
  }

  return data
}

export async function getPricingPreview(vehicleTypeId) {
  const response = await fetch(`${API_URL}/${vehicleTypeId}/pricing-preview`)
  const data = await response.json()
  if (!response.ok) {
    throw new Error("Không thể tải thông tin giá")
  }

  return data
}