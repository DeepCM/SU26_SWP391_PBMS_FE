import { useState, useEffect, useMemo, useCallback } from 'react';
import '../../styles/Table.css';
import { getAllPricing } from '../../services/pricingService';
import { getVehicleTypes } from '../../services/vehicleTypeService';
import PricingPopup from './PricingPopup';
import { formatAuditActor, formatAuditDate } from '../../utils/auditFormatters';

const TablePricing = () => {
    const [pricingState, setPricingState] = useState(null);
    const [vehicleTypesList, setVehicleTypesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPricingPopup, setShowPricingPopup] = useState(false);
    const [selectedPricing, setSelectedPricing] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');

    const isPolicyActiveOrPast = useCallback((effectiveFrom) => {
        if (!effectiveFrom) return false;
        return new Date(effectiveFrom) <= new Date();
    }, []);

    const isSuperseded = useCallback((item, allPricingData) => {
        if (!item?.effectiveFrom) return false;

        const itemEffectiveDate = new Date(item.effectiveFrom);
        const now = new Date();

        if (itemEffectiveDate > now) return false;

        return allPricingData.some(other => {
            const matchesCategory =
                other.vehicleTypeId === item.vehicleTypeId &&
                other.floorId === item.floorId &&
                other.id !== item.id;

            if (!matchesCategory || !other.effectiveFrom) return false;

            const otherEffectiveDate = new Date(other.effectiveFrom);

            return otherEffectiveDate > itemEffectiveDate && otherEffectiveDate <= now;
        });
    }, []);

    // Pure FE calculation helper for Effective To and Status
    const getPolicyLifecycle = useCallback((row, allData) => {
        const categoryPolicies = allData.filter(p => 
            p.vehicleTypeId === row.vehicleTypeId && 
            p.floorId === row.floorId
        ).sort((a, b) => new Date(a.effectiveFrom) - new Date(b.effectiveFrom));

        const index = categoryPolicies.findIndex(p => p.id === row.id);
        let effectiveTo = null;
        if (index !== -1 && index < categoryPolicies.length - 1) {
            const nextPolicy = categoryPolicies[index + 1];
            const nextDate = new Date(nextPolicy.effectiveFrom);
            nextDate.setDate(nextDate.getDate() - 1);
            effectiveTo = nextDate;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const fromDate = row.effectiveFrom ? new Date(row.effectiveFrom) : null;
        if (fromDate) fromDate.setHours(0, 0, 0, 0);

        let statusText = 'Sắp áp dụng';
        let statusColor = '#0d6efd'; // Blue text

        if (fromDate && fromDate > today) {
            statusText = 'Sắp áp dụng';
            statusColor = '#0d6efd';
        } else if (fromDate && fromDate <= today) {
            if (effectiveTo) {
                const toDate = new Date(effectiveTo);
                toDate.setHours(0, 0, 0, 0);
                if (toDate < today) {
                    statusText = 'Hết hiệu lực';
                    statusColor = '#6c757d'; // Gray text
                } else {
                    statusText = 'Đang áp dụng';
                    statusColor = '#198754'; // Green text
                }
            } else {
                statusText = 'Đang áp dụng';
                statusColor = '#198754'; // Green text
            }
        }

        return {
            effectiveToDate: effectiveTo,
            statusText,
            statusColor
        };
    }, []);

    const handleCreate = () => {
        setSelectedPricing(null);
        setShowPricingPopup(true);
    };

    const handleUpdate = (item) => {
        const superseded = typeof isSuperseded === 'function'
            ? isSuperseded(item, pricingState?.tableData || [])
            : (item.isSuperseded ?? false);

        if (isPolicyActiveOrPast(item.effectiveFrom) || superseded) {
            alert("Chính sách giá đã hoặc đang có hiệu lực (hoặc đã bị thay thế) không thể chỉnh sửa.");
            return;
        }
        setSelectedPricing(item);
        setShowPricingPopup(true);
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredAndSortedData = useMemo(() => {
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
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];

                if (valA === null || valA === undefined) valA = '';
                if (valB === null || valB === undefined) valB = '';

                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
                }

                if (sortConfig.key === 'effectiveFrom') {
                    const timeA = valA ? new Date(valA).getTime() : 0;
                    const timeB = valB ? new Date(valB).getTime() : 0;
                    return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
                }

                const strA = String(valA).toLowerCase();
                const strB = String(valB).toLowerCase();
                if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return processedItems;
    }, [pricingState?.tableData, searchTerm, sortConfig]);

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
                            <th>Trạng Thái</th>
                            <th>Cập nhật cuối</th>
                            <th className="sci-text-right">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedData.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="sci-table-empty-row">
                                    Không tìm thấy cấu hình giá phù hợp.
                                </td>
                            </tr>
                        ) : (
                            filteredAndSortedData.map((row) => {
                                const superseded = typeof isSuperseded === 'function'
                                    ? isSuperseded(row, pricingState?.tableData || [])
                                    : (row.isSuperseded ?? false);

                                const activeOrPast = isPolicyActiveOrPast(row.effectiveFrom);
                                const isLocked = activeOrPast || superseded;
                                const lifecycle = getPolicyLifecycle(row, pricingState?.tableData || []);

                                let statusTooltip = "Chỉnh sửa chính sách giá";
                                if (superseded) {
                                    statusTooltip = "Chính sách giá đã hết hiệu lực (đã bị thay thế).";
                                } else if (activeOrPast) {
                                    statusTooltip = "Chính sách giá đang có hiệu lực không thể chỉnh sửa.";
                                }

                                return (
                                    <tr key={row.id} className={`sci-table-row ${isLocked ? 'sci-row-disabled' : ''}`}>
                                        <td className="sci-font-medium">
                                            {row.vehicleTypeName || '-'}
                                        </td>
                                        <td className="sci-font-medium">
                                            {row.pricePerHour ? `${row.pricePerHour.toLocaleString('vi-VN')} đ` : '0 đ'}
                                        </td>
                                        <td className="sci-font-medium">
                                            {row.depositAmount ? `${row.depositAmount.toLocaleString('vi-VN')} đ` : '0 đ'}
                                        </td>
                                        <td className="sci-text-muted">
                                            {row.effectiveFrom ? new Date(row.effectiveFrom).toLocaleDateString('vi-VN') : '-'}
                                        </td>
                                        <td>
                                            <span style={{ color: lifecycle.statusColor, fontWeight: 500 }}>
                                                {lifecycle.statusText}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="audit-cell">
                                                <span className="audit-actor">{formatAuditActor(row.updatedByName || row.createdByName)}</span>
                                                <br />
                                                <small className="audit-date">{formatAuditDate(row.updatedAt || row.createdAt)}</small>
                                            </div>
                                        </td>
                                        <td className="sci-text-right">
                                            <div className="sci-table-actions-wrapper">
                                                <button
                                                    className="sci-btn-edit"
                                                    onClick={() => handleUpdate(row)}
                                                    disabled={isLocked}
                                                    title={statusTooltip}
                                                >
                                                    Sửa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
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