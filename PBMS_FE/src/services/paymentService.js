const API_URL = "http://localhost:5021/api/payments"

function getAuthHeader() {
  const token = localStorage.getItem("token")

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  }
}

export async function getPaymentLink(bookingId) {
  const response = await fetch(
    `${API_URL}/booking/${bookingId}/link`,
    {
      method: "POST",
      headers: getAuthHeader()
    }
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.detail || data.title)
  }

  return data
}