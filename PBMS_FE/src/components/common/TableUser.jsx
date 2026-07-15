import { useState, useEffect } from 'react';
import '../../styles/Table.css';
import { getUsers, updateUser } from '../../services/adminService';
import UserPopup from './UserPopup';

const TableUser = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');

    const [showUserPopup, setShowUserPopup] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const handleCreate = () => {
        setSelectedUser(null);
        setShowUserPopup(true);
    };

    const handleUpdate = (userItem) => {
        setSelectedUser(userItem);
        setShowUserPopup(true);
    };

    const handleToggleStatus = async (userItem) => {
        const actionText = userItem.isActive ? 'vô hiệu hóa' : 'kích hoạt';
        if (!window.confirm(`Bạn có chắc muốn ${actionText} tài khoản này không?`)) return;

        try {
            await updateUser(userItem.id, {
                isActive: !userItem.isActive
            });

            setAnalyticsData(prev => ({
                ...prev,
                tableData: prev.tableData.map(row =>
                    row.id === userItem.id ? { ...row, isActive: !row.isActive } : row
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
                row.fullName?.toLowerCase().includes(searchLower) ||
                row.email?.toLowerCase().includes(searchLower) ||
                row.role?.toLowerCase().includes(searchLower)
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
            const rawUsersList = await getUsers();

            // Locate this block in loadTableData inside TableUser.jsx:
            const mappedUsers = (rawUsersList || []).map((user) => ({
                id: user.id,
                fullName: user.fullName || '',
                email: user.email || '',
                role: user.role?.toLowerCase() || 'user', // Safe-mapped to lowercase
                isActive: user.isActive ?? true
            }));

            setAnalyticsData({
                tableData: mappedUsers
            });
        } catch (err) {
            console.error("Failed to load admin users data:", err);
            setError(err.message || 'Không thể tải danh sách tài khoản.');
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
                <p>Đang tải danh sách tài khoản...</p>
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
                <h2 className="sci-table-title">Quản Lý Người Dùng</h2>

                <div className="sci-search-wrapper">
                    <input
                        type="text"
                        className="sci-search-input"
                        placeholder="Tìm tên, email, vai trò..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="sci-btn-create" onClick={handleCreate}>
                        + Thêm Tài Khoản
                    </button>
                </div>
            </div>

            <div className="sci-table-responsive">
                <table className="sci-data-table">
                    <thead>
                        <tr>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'fullName' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('fullName')}
                            >
                                Họ Và Tên
                            </th>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'email' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('email')}
                            >
                                Email
                            </th>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'role' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('role')}
                            >
                                Vai Trò
                            </th>
                            <th className="sci-text-right">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getFilteredAndSortedData().length === 0 ? (
                            <tr>
                                <td colSpan="4" className="sci-table-empty-row">
                                    Không tìm thấy người dùng nào phù hợp
                                </td>
                            </tr>
                        ) : (
                            getFilteredAndSortedData().map((row) => (
                                <tr key={row.id} className={`sci-table-row ${row.isActive ? 'sci-row-active' : 'sci-row-inactive'}`}>
                                    <td className="sci-cell-id">
                                        {row.fullName || '-'}
                                    </td>
                                    <td className="sci-font-medium">{row.email || '-'}</td>
                                    <td>
                                        <span className={`sci-badge-role ${row.role?.toLowerCase()}`}>
                                            {row.role}
                                        </span>
                                    </td>
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

            {showUserPopup && (
                <UserPopup
                    key={selectedUser?.id || 'new'}
                    userData={selectedUser}
                    onClose={() => setShowUserPopup(false)}
                    onRefresh={loadTableData}
                />
            )}
        </div>
    );
};

export default TableUser;