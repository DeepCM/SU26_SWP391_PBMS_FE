import { useState, useEffect } from 'react';
import '../../styles/Table.css';
import { createPricing, getAllPricing, getOnePricing, updatePricing } from '../../services/pricingService';

const TablePricing = () => {
    // Pricing-focused states
    const [pricingState, setPricingState] = useState(null);
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

    const handleDisable = async (id) => {
        if (!window.confirm('Bạn có chắc muốn vô hiệu hóa không?')) return;
        try {
            // await disablePricing(id); // TODO: Replace with your actual disable/delete API call from pricingService

            // Optimistically update the UI by filtering out the disabled item
            setPricingState(prev => ({
                ...prev,
                tableData: prev.tableData.filter(row => row.id !== id)
            }));
        } catch (err) {
            alert(err.message);
        }
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Consolidated Data Pipeline: Filter first, then Sort
    const getFilteredAndSortedData = () => {
        if (!pricingState?.tableData) return [];

        const searchLower = searchTerm.toLowerCase().trim();

        // 1. Client-side global search filter
        let processedItems = pricingState.tableData.filter((row) => {
            if (!searchLower) return true;
            return (
                row.floorName?.toLowerCase().includes(searchLower) ||
                row.vehicleTypeName?.toLowerCase().includes(searchLower) ||
                row.pricePerHour?.toString().includes(searchLower) ||
                row.depositAmount?.toString().includes(searchLower)
            );
        });

        // 2. Client-side sorting execution
        if (sortConfig.key !== null) {
            processedItems.sort((a, b) => {
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return processedItems;
    };

    // Load initial pricing configurations from the service
    useEffect(() => {
        async function loadPricingData() {
            setLoading(true);
            setError(null);
            try {
                const response = await getAllPricing();
                setPricingState({
                    tableData: response || []
                });
            } catch (err) {
                console.error("Failed to load pricing data:", err);
                setError(err.message || 'Không thể tải cấu hình bảng giá.');
            } finally {
                setLoading(false);
            }
        }

        loadPricingData();
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
            <div className="sci-page sci-error-state" style={{ color: '#ef4444', padding: '20px' }}>
                <p>Lỗi: {error}</p>
            </div>
        );
    }

    return (
        <div className="sci-table-card">

            {/* HEADER: Title, Interactive Search, and Add Button */}
            <div className="sci-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 className="sci-table-title">Quản Lý Bảng Giá Tầng</h2>

                <div className="sci-search-wrapper" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                        type="text"
                        className="sci-search-input"
                        placeholder="Tìm kiếm tầng, loại xe..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />
                    <button className="sci-btn sci-btn-primary" onClick={handleCreate}>
                        + Thêm Mới
                    </button>
                </div>
            </div>

            {/* TABLE DATA */}
            <div className="sci-table-responsive">
                <table className="sci-data-table">
                    <thead>
                        <tr>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'floorName' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('floorName')}
                            >
                                Tên Tầng
                            </th>
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
                        {getFilteredAndSortedData().map((row) => (
                            <tr key={row.id}>
                                <td className="sci-font-medium">{row.floorName}</td>
                                <td className="sci-font-medium">{row.vehicleTypeName}</td>
                                <td className="sci-font-medium">
                                    {row.pricePerHour?.toLocaleString('vi-VN')} đ
                                </td>
                                <td className="sci-font-medium">
                                    {row.depositAmount?.toLocaleString('vi-VN')} đ
                                </td>
                                <td className="sci-text-muted">
                                    {row.effectiveFrom ? new Date(row.effectiveFrom).toLocaleDateString('vi-VN') : '-'}
                                </td>
                                <td className="sci-text-muted">
                                    {row.effectiveTo ? new Date(row.effectiveTo).toLocaleDateString('vi-VN') : '-'}
                                </td>

                                {/* ACTION BUTTONS */}
                                <td className="sci-text-right">
                                    <div className="sci-action-group">
                                        <button className="sci-btn-text sci-edit-btn" onClick={() => handleUpdate(row)}>Sửa</button>
                                        <button className="sci-btn-text sci-disable-btn" onClick={() => handleDisable(row.id)}>
                                            Vô hiệu hóa
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {getFilteredAndSortedData().length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                                    Không tìm thấy kết quả phù hợp.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Optional Pricing Popup wrapper instantiation placeholder
            {showPricingPopup && (
                <PricingPopup
                    pricingData={selectedPricing}
                    onClose={() => setShowPricingPopup(false)}
                />
            )} */}
        </div>
    );
};

export default TablePricing;