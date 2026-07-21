import getAuthHeader from "../components/auth/authHeader"

const API_URL = `${import.meta.env.VITE_API_URL}/api/policies/active`

// ── UTILITY ERROR HANDLER ──────────────────────────────────────────────────
async function handleResponse(response, defaultErrorMessage) {
  // ── DUAL-STREAM STREAM CLONING FOR RAW LOGGING ────────────────────────────
  const debugClone = response.clone();
  try {
    const rawText = await debugClone.text();
    console.log(`%c[API RAW PAYLOAD] ${response.method || 'FETCH'} -> ${response.url} (${response.status})`, "color: #00bfff; font-weight: bold;");
    console.log(rawText || "[Empty Response Body]");
  } catch (logErr) {
    console.warn("[Log Stream Clone Failed]:", logErr);
  }
  // ──────────────────────────────────────────────────────────────────────────

  if (!response.ok) {
    let detailError = ""
    try {
      const errorJson = await response.json()
      detailError = errorJson.message || errorJson.error || ""
    } catch {
      // No JSON error body returned
    }
    throw new Error(detailError ? `${defaultErrorMessage}: ${detailError}` : defaultErrorMessage)
  }

  if (response.status === 204) return true
  const text = await response.text()
  return text ? JSON.parse(text) : true
}

// ── 2. ADMIN POLICIES API ──────────────────────────────────────────────────

export async function getPolicies() {
  const response = await fetch(`${API_URL}`, {
    headers: getAuthHeader()
  })
  return handleResponse(response, "Không thể tải danh sách chính sách phí")
}

export async function getPolicyById(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    headers: getAuthHeader()
  })
  return handleResponse(response, `Không thể tải chi tiết chính sách ID: ${id}`)
}