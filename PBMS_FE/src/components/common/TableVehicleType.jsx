import { useState, useEffect } from 'react';
import '../../styles/Table.css';
import { getVehicleTypes, activateVehicleType, deactivateVehicleType } from '../../services/adminService';
import VehicleTypePopup from './VehicleTypePopup';

const TableVehicleType = () => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');

    const [showPopup, setShowPopup] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const handleCreate = () => {
        setSelectedItem(null);
        setShowPopup(true);
    };

    const handleUpdate = (item) => {
        setSelectedItem(item);
        setShowPopup(true);
    };

    const handleToggleStatus = async (item) => {
        const actionText = item.isActive ? 'vô hiệu hóa' : 'kích hoạt';
        if (!window.confirm(`Bạn có chắc muốn ${actionText} loại xe này không?`)) return;

        try {
            if (item.isActive) {
                await deactivateVehicleType(item.id);
            } else {
                await activateVehicleType(item.id);
            }

            await loadTableData();
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

        // Tìm kiếm thông minh theo Tên loại xe hoặc Mô tả
        let processedItems = analyticsData.tableData.filter((row) => {
            if (!searchLower) return true;
            return (
                row.name?.toLowerCase().includes(searchLower) ||
                row.description?.toLowerCase().includes(searchLower)
            );
        });

        // Sắp xếp động
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
            const rawList = await getVehicleTypes();

            const mappedData = (rawList || []).map((item) => ({
                id: item.id,
                name: item.name || '',
                description: item.description || '',
                isActive: item.isActive ?? true
            }));

            setAnalyticsData({
                tableData: mappedData
            });
        } catch (err) {
            console.error("Failed to load vehicle types data:", err);
            setError(err.message || 'Không thể tải dữ liệu loại xe.');
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
                <p>Đang tải danh sách loại xe...</p>
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
                <h2 className="sci-table-title">Quản Lý Loại Xe</h2>

                <div className="sci-search-wrapper">
                    <input
                        type="text"
                        className="sci-search-input"
                        placeholder="Tìm kiếm tên loại xe, mô tả..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="sci-btn-create" onClick={handleCreate}>
                        + Thêm Mới Loại Xe
                    </button>
                </div>
            </div>

            <div className="sci-table-responsive">
                <table className="sci-data-table">
                    <thead>
                        <tr>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'name' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('name')}
                            >
                                Tên Loại Xe
                            </th>
                            <th>Mô Tả Chi Tiết</th>
                            <th className="sci-text-right">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getFilteredAndSortedData().length === 0 ? (
                            <tr>
                                <td colSpan="3" className="sci-table-empty-row">
                                    Không tìm thấy dữ liệu loại xe phù hợp
                                </td>
                            </tr>
                        ) : (
                            getFilteredAndSortedData().map((row) => (
                                <tr key={row.id} className={`sci-table-row ${row.isActive ? 'sci-row-active' : 'sci-row-inactive'}`}>
                                    <td className="sci-font-medium">
                                        {row.name || '-'}
                                    </td>
                                    <td className="sci-text-muted">{row.description || '-'}</td>
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

            {showPopup && (
                <VehicleTypePopup
                    key={selectedItem?.id || 'new'}
                    policyData={selectedItem}
                    onClose={() => setShowPopup(false)}
                    onRefresh={loadTableData}
                />
            )}
        </div>
    );
};

export default TableVehicleType;