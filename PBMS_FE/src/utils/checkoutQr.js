/**
 * Phân tích nội dung mã QR/mã nhập tay lúc check-out để quyết định gọi
 * booking/verify hay guest/verify.
 *
 * - Nếu là JSON có "bookingId", hoặc là một số nguyên thuần -> booking.
 * - Ngược lại -> coi là sessionCode/ticketQrCode của khách vãng lai.
 */
export function parseCheckoutQrContent(raw) {
  const text = (raw ?? '').trim()
  if (!text) return null

  if (/^\d+$/.test(text)) {
    return { flowType: 'booking', bookingId: Number(text) }
  }

  try {
    const json = JSON.parse(text)
    if (json && typeof json === 'object' && json.bookingId !== undefined) {
      const bookingId = Number(json.bookingId)
      if (!Number.isNaN(bookingId)) {
        return { flowType: 'booking', bookingId }
      }
    }
    if (json && typeof json === 'object' && json.sessionCode) {
      return { flowType: 'guest', sessionCode: String(json.sessionCode).trim() }
    }
  } catch {
    // không phải JSON — coi như chuỗi thô
  }

  return { flowType: 'guest', sessionCode: text }
}
