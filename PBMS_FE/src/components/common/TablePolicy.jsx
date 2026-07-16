import { useState, useEffect } from 'react';
import '../../styles/Table.css';
import { getPolicies, activatePolicy, deactivatePolicy } from '../../services/adminService';
import PolicyPopup from './PolicyPopup';

const TablePolicy = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');

    const [showPolicyPopup, setShowPolicyPopup] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const POLICY_TYPE_MAP = {
        parking_rules: 'Quy định giữ xe',
        deposit_refund: 'Chính sách hoàn tiền cọc',
        fine: 'Quy định xử phạt vi phạm',
        operating_hours: 'Giờ hoạt động'
    };
    const handleCreate = () => {
        setSelectedPolicy(null);
        setShowPolicyPopup(true);
    };

    const handleUpdate = (policyItem) => {
        setSelectedPolicy(policyItem);
        setShowPolicyPopup(true);
    };

    const handleToggleStatus = async (policyItem) => {
        const actionText = policyItem.isActive ? 'vô hiệu hóa' : 'kích hoạt';
        if (!window.confirm(`Bạn có chắc muốn ${actionText} chính sách này không?`)) return;

        try {
            if (policyItem.isActive) {
                await deactivatePolicy(policyItem.id);
            } else {
                await activatePolicy(policyItem.id);
            }

            setAnalyticsData(prev => ({
                ...prev,
                tableData: prev.tableData.map(row =>
                    row.id === policyItem.id ? { ...row, isActive: !row.isActive } : row
                )
            }));
        } catch (err) {
            alert(err.message || `Không thể thực hiện tác vụ ${actionText}.`);
        }
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getFilteredAndSortedData = () => {
        if (!analyticsData?.tableData) return [];

        const searchLower = searchTerm.toLowerCase().trim();

        let processedItems = analyticsData.tableData.filter((row) => {
            if (!searchLower) return true;
            return (
                row.title?.toLowerCase().includes(searchLower) ||
                (POLICY_TYPE_MAP[row.policyType] || row.policyType)?.toLowerCase().includes(searchLower) ||
                row.content?.toLowerCase().includes(searchLower)
            );
        });

        if (sortConfig.key !== null) {
            processedItems.sort((a, b) => {
                const valA = a[sortConfig.key] ?? '';
                const valB = b[sortConfig.key] ?? '';

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return processedItems;
    };

    const loadTableData = async () => {
        setLoading(true);
        setError(null);
        try {
            const rawPoliciesList = await getPolicies();

            const mappedPolicies = (rawPoliciesList || []).map((policy) => ({
                id: policy.id,
                title: policy.title || '',
                policyType: policy.policyType || '',
                content: policy.content || '',
                isActive: policy.isActive ?? true
            }));

            setAnalyticsData({
                tableData: mappedPolicies
            });
        } catch (err) {
            console.error("Failed to load admin policy data:", err);
            setError(err.message || 'Không thể tải dữ liệu chính sách.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTableData();
    }, []);

    if (loading) {
        return (
            <div className="sci-page sci-loading-state">
                <p>Đang tải danh sách chính sách...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sci-page sci-error-state">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="sci-table-card">
            <div className="sci-table-header">
                <h2 className="sci-table-title">Quản Lý Chính Sách</h2>

                <div className="sci-search-wrapper">
                    <input
                        type="text"
                        className="sci-search-input"
                        placeholder="Tìm kiếm tiêu đề, loại chính sách..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="sci-btn-create" onClick={handleCreate}>
                        + Thêm Mới Chính Sách
                    </button>
                </div>
            </div>

            <div className="sci-table-responsive">
                <table className="sci-data-table">
                    <thead>
                        <tr>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'title' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('title')}
                            >
                                Tiêu Đề
                            </th>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'policyType' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('policyType')}
                            >
                                Loại Chính Sách
                            </th>
                            <th>Nội Dung Chi Tiết</th>
                            <th className="sci-text-right">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getFilteredAndSortedData().length === 0 ? (
                            <tr>
                                <td colSpan="4" className="sci-table-empty-row">
                                    Không tìm thấy dữ liệu chính sách phù hợp
                                </td>
                            </tr>
                        ) : (
                            getFilteredAndSortedData().map((row) => (
                                <tr key={row.id} className={`sci-table-row ${row.isActive ? 'sci-row-active' : 'sci-row-inactive'}`}>
                                    <td className="sci-cell-id">
                                        {row.title || '-'}
                                    </td>
                                    <td className="sci-font-medium">
                                        {POLICY_TYPE_MAP[row.policyType] || row.policyType}
                                    </td>
                                    <td className="sci-text-muted">{row.content || '-'}</td>
                                    <td className="sci-text-right">
                                        <div className="sci-table-actions-wrapper">
                                            <button className="sci-btn-edit" onClick={() => handleUpdate(row)}>
                                                Sửa
                                            </button>
                                            <button
                                                className={`sci-btn-toggle-status ${row.isActive ? 'is-active' : 'is-inactive'}`}
                                                onClick={() => handleToggleStatus(row)}
                                            >
                                                {row.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showPolicyPopup && (
                <PolicyPopup
                    key={selectedPolicy?.id || 'new'}
                    policyData={selectedPolicy}
                    onClose={() => setShowPolicyPopup(false)}
                    onRefresh={loadTableData}
                />
            )}
        </div>
    );
};

export default TablePolicy;