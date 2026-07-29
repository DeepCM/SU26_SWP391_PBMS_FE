const INCIDENT_BLOCK_MESSAGES = {
  CHECKIN_BLOCKED_BY_UNRESOLVED_INCIDENT:
    'Không thể check-in vì đang có sự cố (incident) chưa được xử lý xong. Vui lòng chờ Manager giải quyết rồi thử lại.',
  CHECKOUT_BLOCKED_BY_UNRESOLVED_INCIDENT:
    'Không thể checkout vì đang có sự cố (incident) chưa được xử lý xong. Vui lòng chờ Manager giải quyết rồi thử lại.',
}

export function isIncidentBlockedError(err) {
  return err?.status === 409 && Object.prototype.hasOwnProperty.call(INCIDENT_BLOCK_MESSAGES, err.message)
}

export function incidentBlockMessage(err) {
  return INCIDENT_BLOCK_MESSAGES[err?.message]
}
