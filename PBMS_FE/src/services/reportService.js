const API_URL = `${import.meta.env.VITE_API_URL}/api/reports`
import getAuthHeader from "../components/auth/authHeader"

// Helper to log pure text to the console before parsing JSON
async function logAndParse(response, apiName) {
    if (!response.ok) {
        throw new Error(`Không thể tải báo cáo: ${apiName}`);
    }
    
    try {
        // Clone the response stream to read as pure text without disrupting the JSON parser
        const clonedResponse = response.clone();
        const rawText = await clonedResponse.text();
        
        console.group(`%c[API RAW RESPONSE] ${apiName}`, "color: #00ff00; font-weight: bold; background: #1e1e1e; padding: 2px 5px;");
        console.log("Raw Text:\n", rawText);
        console.groupEnd();
    } catch (e) {
        console.error(`Error logging raw text for ${apiName}:`, e);
    }

    return await response.json();
}

export async function getOverview() {
    const response = await fetch(`${API_URL}/overview`, {
        headers: getAuthHeader()
    })
    return logAndParse(response, "overview")
}

export async function getRevenue() {
    const response = await fetch(`${API_URL}/revenue`, {
        headers: getAuthHeader()
    })
    return logAndParse(response, "revenue")
}

export async function getTraffic() {
    const response = await fetch(`${API_URL}/traffic`, {
        headers: getAuthHeader()
    })
    return logAndParse(response, "traffic")
}

export async function getOccupancy() {
    const response = await fetch(`${API_URL}/occupancy`, {
        headers: getAuthHeader()
    })
    return logAndParse(response, "occupancy")
}

export async function getSlotUsage() {
    const response = await fetch(`${API_URL}/slot-usage`, {
        headers: getAuthHeader()
    })
    return logAndParse(response, "slot-usage")
}