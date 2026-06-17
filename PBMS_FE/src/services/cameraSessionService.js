const API_URL = 'http://localhost:5021/api/camera-sessions'
const NGROK_API_URL = 'https://devouring-impatient-goldmine.ngrok-free.dev/api/camera-sessions'

const getAuthHeader = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Tạo camera session mới.
 * @param {{ purpose: string, gateId?: number }} params
 * @returns {{ status: number, data: CreateCameraSessionResponseDto }}
 *
 * Response shape:
 * {
 *   sessionId: number,
 *   purpose: string,
 *   status: string,
 *   expiresAt: string (ISO),
 *   cameraUrl: string,
 *   mobileUrl: string
 * }
 */
export const createCameraSession = async ({ purpose, gateId }) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({
      purpose,
      gateId: gateId !== undefined ? String(gateId) : undefined,
    }),
  })
  const data = await response.json()
  return { status: response.status, data }
}

/**
 * Lấy trạng thái camera session hiện tại (dùng cho polling).
 * @param {number} sessionId
 * @returns {{ status: number, data: CameraSessionResponseDto }}
 *
 * Response shape:
 * {
 *   sessionId: number,
 *   staffId: number,
 *   gateId: string | null,
 *   purpose: string,
 *   status: string,           // Pending | FaceUploaded | VehicleUploaded | Completed | Expired | Cancelled
 *   bookingId: number | null,
 *   bookingCode: string | null,
 *   bookingInfo: BookingInfo | null,
 *   checkinFaceImg: string | null,
 *   checkinVehicleImg: string | null,
 *   detectedLicensePlate: string | null,
 *   suggestedVehicleTypeId: number | null,
 *   ocrConfidence: number | null,
 *   ocrRawText: string | null,
 *   createdAt: string (ISO),
 *   updatedAt: string (ISO),
 *   expiresAt: string (ISO),
 *   warnings: string[]        // vd: ["VEHICLE_NOT_MATCH"]
 * }
 */
export const getCameraSession = async (sessionId) => {
  const response = await fetch(`${API_URL}/${sessionId}`, {
    method: 'GET',
    headers: {
      ...getAuthHeader(),
    },
  })
  const data = await response.json()
  return { status: response.status, data }
}

/**
 * Huỷ camera session.
 * @param {number} sessionId
 * @returns {{ status: number, data: { sessionId: number, status: string } }}
 */
export const cancelCameraSession = async (sessionId) => {
  const response = await fetch(`${API_URL}/${sessionId}/cancel`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
    },
  })
  const data = await response.json()
  return { status: response.status, data }
}

/**
 * Hoàn thành camera session (staff confirm).
 * @param {number} sessionId
 * @returns {{ status: number, data: { sessionId: number, status: string } }}
 */
export const completeCameraSession = async (sessionId) => {
  const response = await fetch(`${API_URL}/${sessionId}/complete`, {
    method: 'POST',
    headers: {
      ...getAuthHeader(),
    },
  })
  const data = await response.json()
  return { status: response.status, data }
}

/**
 * Upload ảnh xe từ mobile (không cần auth header — xác thực qua token).
 * Gửi multipart/form-data: sessionId + token dưới dạng text field, photo là binary file.
 * @param {{ sessionId: string|number, token: string, photoBlob: Blob }} params
 * @returns {{ status: number, data: object }}
 */
export const uploadVehiclePhoto = async ({ sessionId, token, photoBlob }) => {
  const form = new FormData()
  form.append('photo', photoBlob, 'vehicle.jpg')

  // token truyền qua query string ([FromQuery] phía ASP.NET Core)
  const response = await fetch(
    `${NGROK_API_URL}/${sessionId}/vehicle-photo?token=${encodeURIComponent(token)}`,
    { method: 'POST', body: form }
  )

  let data = null
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = { message: await response.text() }
  }

  return { status: response.status, data }
}

/**
 * Upload ảnh khuôn mặt từ mobile.
 * @param {{ sessionId: string|number, token: string, photoBlob: Blob }} params
 * @returns {{ status: number, data: object }}
 */
export const uploadFacePhoto = async ({ sessionId, token, photoBlob }) => {
  const form = new FormData()
  form.append('photo', photoBlob, 'face.jpg')

  const response = await fetch(
    `${NGROK_API_URL}/${sessionId}/face-photo?token=${encodeURIComponent(token)}`,
    { method: 'POST', body: form }
  )

  let data = null
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = { message: await response.text() }
  }

  return { status: response.status, data }
}

/**
 * Gửi nội dung QR đọc được lên backend (từ trang MobileBookingScanner).
 * @param {{ sessionId: string|number, token: string, qrContent: string }} params
 */
export const postQrResult = async ({ sessionId, token, qrContent }) => {
  const response = await fetch(
    `${API_URL}/${sessionId}/qr-result?token=${encodeURIComponent(token)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrContent }),
    }
  )
  let data = null
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    data = { message: await response.text() }
  }
  return { status: response.status, data }
}

// Các status terminal — polling dừng khi gặp một trong các giá trị này
export const TERMINAL_STATUSES = ['Completed', 'Expired', 'Cancelled']

// Purpose constants
export const CAMERA_SESSION_PURPOSES = {
  CHECK_IN_GUEST: 'CHECK_IN_GUEST',
  CHECK_IN_BOOKING: 'CHECK_IN_BOOKING',
}
