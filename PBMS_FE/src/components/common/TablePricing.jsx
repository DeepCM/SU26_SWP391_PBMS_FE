import { useState, useEffect } from 'react';
import '../../styles/Table.css';
import { getAllPricing } from '../../services/pricingService';
import { getVehicleTypes } from '../../services/vehicleTypeService';
import PricingPopup from './PricingPopup';

const TablePricing = () => {
    const [pricingState, setPricingState] = useState(null);
    const [vehicleTypesList, setVehicleTypesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPricingPopup, setShowPricingPopup] = useState(false);
    const [selectedPricing, setSelectedPricing] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');

    const handleCreate = () => {
        setSelectedPricing(null);
        setShowPricingPopup(true);
    };

    const handleUpdate = (pricingItem) => {
        setSelectedPricing(pricingItem);
        setShowPricingPopup(true);
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getFilteredAndSortedData = () => {
        if (!pricingState?.tableData) return [];

        const searchLower = searchTerm.toLowerCase().trim();

        let processedItems = pricingState.tableData.filter((row) => {
            if (!searchLower) return true;
            return (
                row.floorName?.toLowerCase().includes(searchLower) ||
                row.vehicleTypeName?.toLowerCase().includes(searchLower) ||
                row.pricePerHour?.toString().includes(searchLower) ||
                row.depositAmount?.toString().includes(searchLower)
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

    // Bóc tách động danh sách Tầng và Loại xe duy nhất từ dữ liệu bảng
    const getUniqueCategories = () => {
        const tableData = pricingState?.tableData || [];
        
        const uniqueFloors = [];
        const floorSeen = new Set();

        const uniqueVehicleTypes = [];
        const vehicleSeen = new Set();

        tableData.forEach(item => {
            if (item.floorId && !floorSeen.has(item.floorId)) {
                floorSeen.add(item.floorId);
                uniqueFloors.push({
                    id: item.floorId,
                    floorName: item.floorName || `Tầng ${item.floorId}`
                });
            }
            if (item.vehicleTypeId && !vehicleSeen.has(item.vehicleTypeId)) {
                vehicleSeen.add(item.vehicleTypeId);
                uniqueVehicleTypes.push({
                    id: item.vehicleTypeId,
                    name: item.vehicleTypeName || `Loại xe ${item.vehicleTypeId}`
                });
            }
        });

        return { uniqueFloors, uniqueVehicleTypes };
    };

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [pricingRes, vehicleTypesRes] = await Promise.all([
                getAllPricing(),
                getVehicleTypes()
            ]);

            setPricingState({
                tableData: pricingRes || []
            });
            setVehicleTypesList(vehicleTypesRes || []);
        } catch (err) {
            console.error("Failed to load pricing or vehicle type data:", err);
            setError(err.message || 'Không thể tải cấu hình bảng giá.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="sci-page sci-loading-state">
                <p>Đang tải dữ liệu cấu hình giá...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="sci-page sci-error-state">
                <p>Lỗi: {error}</p>
            </div>
        );
    }

    return (
        <div className="sci-table-card">
            {/* HEADER */}
            <div className="sci-table-header">
                <h2 className="sci-table-title">Quản Lý Bảng Giá Phương Tiện</h2>

                <div className="sci-search-wrapper">
                    <input
                        type="text"
                        className="sci-search-input"
                        placeholder="Tìm kiếm tầng, loại xe..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="sci-btn-create" onClick={handleCreate}>
                        + Thêm Mới
                    </button>
                </div>
            </div>

            {/* TABLE DATA */}
            <div className="sci-table-responsive">
                <table className="sci-data-table">
                    <thead>
                        <tr>
                            {/* <th
                                className={`sci-sortable ${sortConfig.key === 'floorName' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('floorName')}
                            >
                                Tên Tầng
                            </th> */}
                            <th
                                className={`sci-sortable ${sortConfig.key === 'vehicleTypeName' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('vehicleTypeName')}
                            >
                                Loại Phương Tiện
                            </th>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'pricePerHour' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('pricePerHour')}
                            >
                                Giá Theo Giờ
                            </th>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'depositAmount' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('depositAmount')}
                            >
                                Tiền Đặt Cọc
                            </th>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'effectiveFrom' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('effectiveFrom')}
                            >
                                Áp Dụng Từ
                            </th>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'effectiveTo' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('effectiveTo')}
                            >
                                Áp Dụng Đến
                            </th>
                            <th className="sci-text-right">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getFilteredAndSortedData().length === 0 ? (
                            <tr>
                                <td colSpan="6" className="sci-table-empty-row">
                                    Không tìm thấy cấu hình giá phù hợp.
                                </td>
                            </tr>
                        ) : (
                            getFilteredAndSortedData().map((row) => (
                                <tr key={row.id} className="sci-table-row">
                                    {/* <td className="sci-cell-id">{row.floorName || '-'}</td> */}
                                    <td className="sci-font-medium">{row.vehicleTypeName || '-'}</td>
                                    <td className="sci-font-medium">
                                        {row.pricePerHour ? `${row.pricePerHour.toLocaleString('vi-VN')} đ` : '0 đ'}
                                    </td>
                                    <td className="sci-font-medium">
                                        {row.depositAmount ? `${row.depositAmount.toLocaleString('vi-VN')} đ` : '0 đ'}
                                    </td>
                                    <td className="sci-text-muted">
                                        {row.effectiveFrom ? new Date(row.effectiveFrom).toLocaleDateString('vi-VN') : '-'}
                                    </td>
                                    <td className="sci-text-muted">
                                        {row.effectiveTo ? new Date(row.effectiveTo).toLocaleDateString('vi-VN') : '-'}
                                    </td>
                                    <td className="sci-text-right">
                                        <div className="sci-table-actions-wrapper">
                                            <button className="sci-btn-edit" onClick={() => handleUpdate(row)}>
                                                Sửa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showPricingPopup && (
                <PricingPopup
                    key={selectedPricing?.id || 'new'}
                    pricingData={selectedPricing}
                    vehicleTypesList={vehicleTypesList}
                    onClose={() => setShowPricingPopup(false)}
                    onRefresh={loadData}
                />
            )}
        </div>
    );
};

export default TablePricing;