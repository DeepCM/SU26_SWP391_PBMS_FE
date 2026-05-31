const API_URL = 'http://localhost:5021/api/Auth'

export const registerUser = async (userData) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  })

  const text = await response.text()

  console.log("RAW RESPONSE:", text)

  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }

  return {
    status: response.status,
    data
  }
}