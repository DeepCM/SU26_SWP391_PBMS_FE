function IncidentBlockedNotice({ message, onRetry, onDismiss, retrying }) {
  return (
    <div className="sci-incident-blocked">
      <p className="sci-incident-blocked-title">⚠ Có sự cố chưa được giải quyết</p>
      <p className="sci-incident-blocked-message">{message}</p>
      <div className="sci-incident-blocked-actions">
        <button
          type="button"
          className="sci-confirm-btn"
          onClick={onRetry}
          disabled={retrying}
        >
          {retrying ? 'Đang thử lại...' : 'Thử lại'}
        </button>
        <button
          type="button"
          className="sci-incident-blocked-dismiss"
          onClick={onDismiss}
        >
          Quay lại
        </button>
      </div>
    </div>
  )
}

export default IncidentBlockedNotice
