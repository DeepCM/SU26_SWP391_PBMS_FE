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

  // Separate pending form filters from active applied filters
  const [pendingFilters, setPendingFilters] = useState({});
  const [filters, setFilters] = useState({});

  // Sorting configuration state
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Normalize targetTable for partial/flexible floor matching ("floor", "fl" -> "floors")
      let targetTableParam = filters.targetTable ? filters.targetTable.trim() : '';
      const lowerTarget = targetTableParam.toLowerCase();
      if (lowerTarget === 'fl' || lowerTarget === 'floor' || lowerTarget === 'floo' || lowerTarget === 'flo') {
        targetTableParam = 'floors';
      }

      const response = await getActivityLogs({
        ...filters,
        targetTable: targetTableParam || undefined,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        page,
        pageSize: PAGE_SIZE
      });

      let fetchedItems = response?.items || [];

      // Client-side partial substring fallback for targetTable filter
      if (filters.targetTable) {
        const term = filters.targetTable.trim().toLowerCase();
        fetchedItems = fetchedItems.filter(item =>
          item.targetTable && item.targetTable.toLowerCase().includes(term)
        );
      }

      setItems(fetchedItems);
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

  const sortedItems = useMemo(() => {
    if (!items || items.length === 0) return [];
    return [...items].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [items, sortConfig]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)), [totalCount]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setPendingFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setFilters({ ...pendingFilters });
    setPage(1);
  };

  const handleResetFilters = () => {
    setPendingFilters({});
    setFilters({});
    setPage(1);
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setPage(1);
  };

  return (
    <div className="sci-table-card">
      <div className="sci-table-header">
        <h2 className="sci-table-title">Nhật ký hệ thống</h2>
        <div className="sci-table-actions-wrapper">
          <button className="sci-btn-cancel" onClick={handleResetFilters}>Đặt lại</button>
          <button className="sci-btn-create" onClick={applyFilters}>Áp dụng bộ lọc</button>
        </div>
      </div>

      <div className="sci-form-grid-2col" style={{ marginBottom: 16 }}>
        <div className="sci-form-group">
          <label className="sci-form-label">Đối tượng</label>
          <input className="sci-form-input" name="targetTable" value={pendingFilters.targetTable || ''} onChange={handleFilterChange} placeholder="Nhập tên đối tượng (VD: floor, fl, floors)..." />
        </div>
        <div className="sci-form-group">
          <label className="sci-form-label">Hành động</label>
          <input className="sci-form-input" name="action" value={pendingFilters.action || ''} onChange={handleFilterChange} placeholder="Nhập tên hành động..." />
        </div>
        <div className="sci-form-group">
          <label className="sci-form-label">Người thao tác</label>
          <input className="sci-form-input" name="userName" value={pendingFilters.userName || ''} onChange={handleFilterChange} placeholder="Nhập tên người thao tác..." />
        </div>
        <div className="sci-form-group">
          <label className="sci-form-label">ID đối tượng</label>
          <input className="sci-form-input" name="targetId" value={pendingFilters.targetId || ''} onChange={handleFilterChange} placeholder="Nhập ID đối tượng..." />
        </div>
        <div className="sci-form-group">
          <label className="sci-form-label">Từ ngày</label>
          <input className="sci-form-input" type="datetime-local" name="from" value={pendingFilters.from || ''} onChange={handleFilterChange} />
        </div>
        <div className="sci-form-group">
          <label className="sci-form-label">Đến ngày</label>
          <input className="sci-form-input" type="datetime-local" name="to" value={pendingFilters.to || ''} onChange={handleFilterChange} />
        </div>
      </div>

      {error && <div className="sci-confirm-error sci-alert-margin">{error}</div>}

      <div className="sci-table-responsive">
        <table className="sci-data-table">
          <thead>
            <tr>
              <th
                className={`sci-sortable ${sortConfig.key === 'createdAt' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                onClick={() => requestSort('createdAt')}
              >
                Thời gian
              </th>
              <th
                className={`sci-sortable ${sortConfig.key === 'userName' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                onClick={() => requestSort('userName')}
              >
                Người thao tác
              </th>
              <th
                className={`sci-sortable ${sortConfig.key === 'action' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                onClick={() => requestSort('action')}
              >
                Hành động
              </th>
              <th
                className={`sci-sortable ${sortConfig.key === 'targetTable' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                onClick={() => requestSort('targetTable')}
              >
                Đối tượng
              </th>
              <th
                className={`sci-sortable ${sortConfig.key === 'targetId' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                onClick={() => requestSort('targetId')}
              >
                ID đối tượng
              </th>
              <th>Địa chỉ IP</th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="sci-table-empty-row">Đang tải...</td></tr>
            ) : sortedItems.length === 0 ? (
              <tr><td colSpan="7" className="sci-table-empty-row">Không có dữ liệu nhật ký.</td></tr>
            ) : (
              sortedItems.map((row) => (
                <tr key={row.id}>
                  <td>{formatAuditDate(row.createdAt)}</td>
                  <td>{formatAuditActor(row.userName || row.userEmail, 'Không xác định')}</td>
                  <td>{getActionLabel(row.action)}</td>
                  <td>{row.targetTable || '—'}</td>
                  <td>{row.targetId ? `#${row.targetId}` : '—'}</td>
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