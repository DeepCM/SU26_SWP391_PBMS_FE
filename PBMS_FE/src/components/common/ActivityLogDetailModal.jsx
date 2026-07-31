import { useMemo } from 'react';
import { formatAuditActor, formatAuditDate } from '../../utils/auditFormatters';
import { getActionLabel } from '../../utils/auditLabels';

function safeParseAuditJson(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch {
    return { rawValue: value };
  }
}

function renderJson(value) {
  const parsed = safeParseAuditJson(value);

  if (!parsed) {
    return <span>—</span>;
  }

  if (typeof parsed === 'object' && !Array.isArray(parsed)) {
    return (
      <pre className="sci-json-diff">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  }

  return <pre className="sci-json-diff">{String(parsed)}</pre>;
}

export default function ActivityLogDetailModal({ log, isOpen, onClose }) {
  const parsedOldValue = useMemo(() => safeParseAuditJson(log?.oldValue), [log]);
  const parsedNewValue = useMemo(() => safeParseAuditJson(log?.newValue), [log]);

  if (!isOpen || !log) return null;

  return (
    <div className="sci-modal-overlay">
      <div className="sci-modal-container" style={{ maxWidth: 720 }}>
        <div className="sci-modal-header">
          <h3 className="sci-modal-title">Chi tiết nhật ký</h3>
          <button type="button" className="sci-btn-close-modal" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="sci-modal-body">
          <div className="sci-audit-summary">
            <div className="sci-audit-meta">
              <div><strong>Thời gian:</strong> {formatAuditDate(log.createdAt)}</div>
              <div><strong>Người thao tác:</strong> {formatAuditActor(log.userName || log.userEmail)}</div>
              <div><strong>Hành động:</strong> {getActionLabel(log.action)}</div>
              <div><strong>Bảng:</strong> {log.targetTable || '—'}</div>
              <div><strong>ID bảng:</strong> {log.targetId ? `#${log.targetId}` : '—'}</div>
              <div><strong>IP:</strong> {log.ipAddress || '—'}</div>
            </div>
          </div>

          <div className="sci-form-group">
            <label className="sci-form-label">Giá trị trước</label>
            {renderJson(parsedOldValue)}
          </div>

          <div className="sci-form-group">
            <label className="sci-form-label">Giá trị sau</label>
            {renderJson(parsedNewValue)}
          </div>
        </div>

        <div className="sci-modal-footer">
          <button type="button" className="sci-btn-cancel" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}
