import { useState, useEffect } from 'react';
import '../../styles/Table.css';
import { getUsers, activateUser, deactivateUser } from '../../services/adminService';
import UserPopup from './UserPopup';

const TableUser = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');

    const [showUserPopup, setShowUserPopup] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const ROLE_MAP = {
        admin: 'Quản trị viên',
        manager: 'Quản lý',
        staff: 'Nhân viên',
        driver: 'Người dùng',
    };

    // Hàm lấy ID của Admin đang đăng nhập từ bộ nhớ tạm localStorage
    const getCurrentAdminId = () => {
        try {
            const auth = JSON.parse(localStorage.getItem('auth') || '{}');
            return auth?.user?.id || null;
        } catch (e) {
            return null;
        }
    };

    const handleCreate = () => {
        setSelectedUser(null);
        setShowUserPopup(true);
    };

    const handleUpdate = (userItem) => {
        setSelectedUser(userItem);
        setShowUserPopup(true);
    };

    const handleToggleStatus = async (userItem) => {
        const currentAdminId = getCurrentAdminId();

        // CHẶN ADMIN TỰ VÔ HIỆU HÓA CHÍNH MÌNH TỪ BẢN GHI DANH SÁCH BẢNG
        if (userItem.isActive && String(userItem.id) === String(currentAdminId)) {
            alert("Bạn không thể tự vô hiệu hóa tài khoản quản trị đang đăng nhập!");
            return;
        }

        const actionText = userItem.isActive ? 'vô hiệu hóa' : 'kích hoạt';
        if (!window.confirm(`Bạn có chắc muốn ${actionText} tài khoản này không?`)) return;

        try {
            if (userItem.isActive) {
                await deactivateUser(userItem.id);
            } else {
                await activateUser(userItem.id);
            }

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
                row.id?.toString().includes(searchLower) ||
                row.fullName?.toLowerCase().includes(searchLower) ||
                row.email?.toLowerCase().includes(searchLower) ||
                row.phone?.toLowerCase().includes(searchLower) ||
                (ROLE_MAP[row.role] || row.role)?.toLowerCase().includes(searchLower)
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

            const mappedUsers = (rawUsersList || []).map((user) => ({
                id: user.id,
                fullName: user.fullName || '',
                email: user.email || '',
                phone: user.phone || '-',
                role: user.role?.toLowerCase() || 'user',
                isEmailVerified: user.isEmailVerified ?? false,
                isActive: user.isActive ?? true,
                createdAt: user.createdAt ? new Date(user.createdAt).toLocaleString('vi-VN') : '-',
                updatedAt: user.updatedAt || '',
                avatarUrl: user.avatarUrl || ''
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
                        placeholder="Tìm ID, tên, email, SĐT, vai trò..."
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
                                className={`sci-sortable ${sortConfig.key === 'phone' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('phone')}
                            >
                                Số Điện Thoại
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
                                <td colSpan="5" className="sci-table-empty-row">
                                    Không tìm thấy người dùng nào phù hợp
                                </td>
                            </tr>
                        ) : (
                            getFilteredAndSortedData().map((row) => (
                                <tr key={row.id} className={`sci-table-row ${row.isActive ? 'sci-row-active' : 'sci-row-inactive'}`}>
                                    <td className="sci-font-medium">{row.fullName || '-'}</td>
                                    <td>{row.email || '-'}</td>
                                    <td>{row.phone || '-'}</td>
                                    <td>
                                        <span className={`sci-badge-role ${row.role?.toLowerCase()}`}>
                                            {ROLE_MAP[row.role] || row.role}
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