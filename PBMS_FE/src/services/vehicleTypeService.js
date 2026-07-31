const API_URL = `${import.meta.env.VITE_API_URL}/api/vehicle-types`;

export async function getVehicleTypes() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Không thể tải thông tin loại xe");
  }
  return await response.json();
}

export async function getAvailableSlots(vehicleTypeId) {
  const response = await fetch(`${API_URL}/${vehicleTypeId}/slots`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error("Không thể tải thông tin chỗ trống");
  }
  return data;
}

/**
 * Gets pricing preview dynamically based on scheduled check-in time
 */
export async function getPricingPreview(vehicleTypeId, scheduledCheckin, { signal } = {}) {
  const params = new URLSearchParams();
  if (scheduledCheckin) {
    params.set("scheduledCheckin", scheduledCheckin);
  }

  const response = await fetch(
    `${API_URL}/${vehicleTypeId}/pricing-preview?${params.toString()}`, 
    {
      cache: "no-store",
      signal
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Không thể tải thông tin giá tại thời điểm đã chọn.");
  }

  return data;
}