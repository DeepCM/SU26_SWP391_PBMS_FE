const API_URL = `${import.meta.env.VITE_API_URL}/api/reports`
import getAuthHeader from "../components/auth/authHeader"

export async function getOverview() {
    const response = await fetch(`${API_URL}/overview`, {
        headers: getAuthHeader()
    })
    if (!response.ok) {
        throw new Error("Không thể tải báo cáo tổng quan")
    }

    return await response.json()
}

export async function getRevenue() {
    const response = await fetch(`${API_URL}/revenue`, {
        headers: getAuthHeader()
    })
    if (!response.ok) {
        throw new Error("Không thể tải báo cáo doanh thu")
    }

    return await response.json()
}

export async function getTraffic() {
    const response = await fetch(`${API_URL}/traffic`, {
        headers: getAuthHeader()
    })
    if (!response.ok) {
        throw new Error("Không thể tải báo cáo lưu lượng")
    }

    return await response.json()
}

export async function getOccupancy() {
    const response = await fetch(`${API_URL}/occupancy`, {
        headers: getAuthHeader()
    })
    if (!response.ok) {
        throw new Error("Không thể tải báo cáo tỷ lệ chiếm dụng")
    }

    return await response.json()
}

export async function getSlotUsage() {
    const response = await fetch(`${API_URL}/slot-usage`, {
        headers: getAuthHeader()
    })
    if (!response.ok) {
        throw new Error("Không thể tải báo cáo sử dụng chỗ đỗ")
    }

    return await response.json()
}