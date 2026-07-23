const API_URL = `${import.meta.env.VITE_API_URL}/api/vehicles`
import getAuthHeader from "../components/auth/authHeader"
export const createVehicle = async (formData) => {
  const token = localStorage.getItem("token")
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  });

  if (!response.ok) {
    // Attempt to parse the error message if the backend returned one
    const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(errorData.message || `Error ${response.status}`);
  }

  // Expecting your backend to return the created object
  return await response.json();
};
export async function getMyVehicles() {
  const response = await fetch(API_URL, {
    headers: getAuthHeader()
  })
  if (!response.ok) {
    throw new Error("Không thể tải danh sách xe của bạn")
  }

  return await response.json()
}

export async function deactivateVehicle(id) {
  const response = await fetch(`${API_URL}/${id}/deactivate`, {
    method: "POST",
    headers: getAuthHeader()
  })

  if (response.ok) {
    return true
  }

  let message = "Không thể vô hiệu hóa phương tiện";

  try {
    const data = await response.json();
    message = data.message || message;
  } catch { }

  throw new Error(message);
}

export async function activateVehicle(id) {
  const response = await fetch(`${API_URL}/${id}/activate`, {
    method: "POST",
    headers: getAuthHeader()
  })

  if (response.ok) {
    return true
  }

  let message = "Không thể kích hoạt phương tiện";

  try {
    const data = await response.json();
    message = data.message || message;
  } catch { }

  throw new Error(message);
}

export async function updateVehicle(id, formData) {
  const token = localStorage.getItem("token")
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  });
  if (response.ok) {
    if (response.status === 204) return { success: true };
    try {
      return await response.json();
    } catch {
      return { success: true }; // Fallback if response isn't JSON
    }
  }
}