const API_URL = `${import.meta.env.VITE_API_URL}/api/pricing-policies`
import getAuthHeader from "../components/auth/authHeader"
export const createPricing = async (pricingData) => {
    const token = localStorage.getItem("token")
    const response = await fetch(API_URL, {
        method: "POST",
        headers: getAuthHeader(),
        body: JSON.stringify(pricingData)
    });

    if (!response.ok) {
        // Attempt to parse the error message if the backend returned one
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `Error ${response.status}`);
    }

    // Expecting your backend to return the created object
    return await response.json();
};
export async function getAllPricing() {
    const response = await fetch(API_URL, {
        headers: getAuthHeader()
    })
    if (!response.ok) {
        throw new Error("Không thể tải danh sách giá")
    }

    return await response.json()
}

export async function getOnePricing(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        headers: getAuthHeader()
    })
    if (!response.ok) {
        throw new Error("Không thể tải thông tin giá")
    }

    return await response.json()
}

export async function updatePricing(id, pricingData) {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: getAuthHeader(),
        body: JSON.stringify(pricingData)
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