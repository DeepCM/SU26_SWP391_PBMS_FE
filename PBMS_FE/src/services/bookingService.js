const API_URL = "http://localhost:5021/api/bookings"

function getAuthHeader() {
  const token = localStorage.getItem("token")

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  }
}

export async function createBooking(bookingData) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(bookingData)
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || data.title)
  }

  return data
}

export async function getMyBookings() {
  const response = await fetch(API_URL, {
    headers: getAuthHeader()
  })

  if (!response.ok) {
    throw new Error("Failed to fetch bookings")
  }

  return await response.json()
}

export async function cancelBooking(id) {
  const response = await fetch(`${API_URL}/${id}/cancel`, {
    method: "POST",
    headers: getAuthHeader()
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.detail || data.title)
  }

  return true
}