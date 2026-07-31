import { useEffect, useMemo, useState } from 'react';
import '../../styles/Table.css';
import { getActivityLogs } from '../../services/activityLogService';
import { formatAuditActor, formatAuditDate } from '../../utils/auditFormatters';
import { getActionLabel } from '../../utils/auditLabels';
import ActivityLogDetailModal from './ActivityLogDetailModal';

const PAGE_SIZE = 50;

export default function TableActivityLog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({});
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getActivityLogs({
        ...filters,
        page,
        pageSize: PAGE_SIZE
      });
      setItems(response?.items || []);
      setTotalCount(response?.totalCount || 0);
    } catch (err) {
      setError(err.message || 'Không thể tải nhật ký hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)), [totalCount]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const applyFilters = () => {
    setPage(1);
  };

  return (
    <div className="sci-table-card">
      <div className="sci-table-header">
        <h2 className="sci-table-title">Nhật ký hệ thống</h2>
        <button className="sci-btn-create" onClick={applyFilters}>Áp dụng bộ lọc</button>
      </div>

      <div className="sci-form-grid-2col" style={{ marginBottom: 16 }}>
        <div className="sci-form-group">
          <label className="sci-form-label">Module</label>
          <input className="sci-form-input" name="targetTable" value={filters.targetTable || ''} onChange={handleFilterChange} placeholder="floors, policies..." />
        </div>
        <div className="sci-form-group">
          <label className="sci-form-label">Hành động</label>
          <input className="sci-form-input" name="action" value={filters.action || ''} onChange={handleFilterChange} placeholder="UPDATE_FLOOR_CAPACITY" />
        </div>
        <div className="sci-form-group">
          <label className="sci-form-label">Người thao tác</label>
          <input className="sci-form-input" name="userId" value={filters.userId || ''} onChange={handleFilterChange} placeholder="ID người dùng" />
        </div>
        <div className="sci-form-group">
          <label className="sci-form-label">Target ID</label>
          <input className="sci-form-input" name="targetId" value={filters.targetId || ''} onChange={handleFilterChange} placeholder="ID bản ghi" />
        </div>
        <div className="sci-form-group">
          <label className="sci-form-label">Từ ngày</label>
          <input className="sci-form-input" type="datetime-local" name="from" value={filters.from || ''} onChange={handleFilterChange} />
        </div>
        <div className="sci-form-group">
          <label className="sci-form-label">Đến ngày</label>
          <input className="sci-form-input" type="datetime-local" name="to" value={filters.to || ''} onChange={handleFilterChange} />
        </div>
      </div>

      {error && <div className="sci-confirm-error sci-alert-margin">{error}</div>}

      <div className="sci-table-responsive">
        <table className="sci-data-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Người thao tác</th>
              <th>Hành động</th>
              <th>Đối tượng</th>
              <th>IP</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="sci-table-empty-row">Đang tải...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan="6" className="sci-table-empty-row">Không có dữ liệu nhật ký.</td></tr>
            ) : (
              items.map((row) => (
                <tr key={row.id}>
                  <td>{formatAuditDate(row.createdAt)}</td>
                  <td>{formatAuditActor(row.userName || row.userEmail, 'Không xác định')}</td>
                  <td>{getActionLabel(row.action)}</td>
                  <td>{row.targetTable}{row.targetId ? `#${row.targetId}` : ''}</td>
                  <td>{row.ipAddress || '—'}</td>
                  <td>
                    <button className="sci-btn-edit" onClick={() => setSelectedLog(row)}>Xem</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="sci-table-header" style={{ marginTop: 16 }}>
        <span>Trang {page}/{totalPages} • Tổng {totalCount}</span>
        <div className="sci-table-actions-wrapper">
          <button className="sci-btn-cancel" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>Trước</button>
          <button className="sci-btn-submit" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>Sau</button>
        </div>
      </div>

      <ActivityLogDetailModal log={selectedLog} isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
