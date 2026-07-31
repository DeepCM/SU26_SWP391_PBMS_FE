import { useState, useEffect } from 'react'
import '../../styles/Table.css';
import { getFloors, activateFloor, deactivateFloor } from '../../services/adminService'
import { getVehicleTypes } from '../../services/vehicleTypeService'
import FloorPopup from './FloorPopup';

const TableFloor = () => {
    const [analyticsData, setAnalyticsData] = useState(null)
    const [vehicleTypes, setVehicleTypes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');

    // Popup visibility and selection states
    const [showFloorPopup, setShowFloorPopup] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState(null); // Stores the full row object

    const handleCreate = () => {
        setSelectedFloor(null); // Sets to null for Create Mode
        setShowFloorPopup(true);
    };

    const handleUpdate = (floorItem) => {
        setSelectedFloor(floorItem); // Sets the full row details for Edit Mode
        setShowFloorPopup(true);
    };

    const handleToggleStatus = async (floorItem) => {
        const actionText = floorItem.isActive ? 'vô hiệu hóa' : 'kích hoạt';
        if (!window.confirm(`Bạn có chắc muốn ${actionText} tầng này không?`)) return;
        
        try {
            if (floorItem.isActive) {
                await deactivateFloor(floorItem.id);
            } else {
                await activateFloor(floorItem.id);
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

        let processedItems = analyticsData.tableData.filter((row) => {
            if (!searchLower) return true;
            return (
                row.name?.toLowerCase().includes(searchLower) ||
                row.type?.toLowerCase().includes(searchLower) ||
                row.id?.toString().includes(searchLower)
            );
        });

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

    const loadTableData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [rawFloorsList, types] = await Promise.all([
                getFloors(),
                getVehicleTypes()
            ]);

            setVehicleTypes(types);

            const mappedFloors = (rawFloorsList || []).map((floor) => {
                let displayType = 'Tất cả';
                let rawVehicleIds = [];

                // Extract and map raw vehicle IDs for popup checkboxes
                if (floor.vehicleTypeIds && Array.isArray(floor.vehicleTypeIds)) {
                    rawVehicleIds = floor.vehicleTypeIds;
                    displayType = floor.vehicleTypeIds
                        .map(id => types.find(t => t.id === id)?.name || id)
                        .join(', ');
                } else if (floor.vehicleTypeId) {
                    rawVehicleIds = [floor.vehicleTypeId];
                    displayType = types.find(t => t.id === floor.vehicleTypeId)?.name || floor.vehicleTypeId;
                } else if (floor.vehicleTypes && Array.isArray(floor.vehicleTypes)) {
                    rawVehicleIds = floor.vehicleTypes.map(vt => typeof vt === 'object' ? vt.id : vt);
                    displayType = floor.vehicleTypes
                        .map(vt => {
                            if (typeof vt === 'object') return vt.name || vt.id;
                            const match = types.find(t => t.id === vt || t.name === vt);
                            return match ? match.name : vt;
                        })
                        .join(', ');
                } else if (floor.vehicleTypeName) {
                    displayType = floor.vehicleTypeName;
                } else if (floor.vehicleType) {
                    const match = types.find(t => t.id === floor.vehicleType);
                    rawVehicleIds = match ? [match.id] : [];
                    displayType = match ? match.name : floor.vehicleType;
                }

                return {
                    id: floor.floorId ?? floor.id,
                    name: floor.name || `Tầng ${floor.floorNumber ?? floor.floorId}`,
                    floorNumber: floor.floorNumber ?? 1,
                    type: displayType,
                    vehicleTypeIds: vehicleTypes.name,
                    description: floor.description || `Khu vực vận hành tầng ${floor.floorNumber ?? ''}`,
                    inUse: Math.round((floor.occupiedSlots || 0) + (floor.reservedSlots || 0)),
                    available: floor.availableSlots ?? 0,
                    capacity: floor.totalSlots ?? 0,
                    isActive: floor.isActive ?? true
                };
            });

            setAnalyticsData({
                tableData: mappedFloors
            });

        } catch (err) {
            console.error("Failed to load admin floor data:", err);
            setError(err.message || 'Không thể tải dữ liệu tầng.');
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
                <p>Đang tải danh sách quản lý tầng...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="sci-page sci-error-state">
                <p>{error}</p>
            </div>
        )
    }

    return (
        <div className="sci-table-card">

            {/* HEADER: Title, Search and Create Trigger */}
            <div className="sci-table-header">
                <h2 className="sci-table-title">Quản Lý Tầng Đỗ Xe</h2>

                <div className="sci-search-wrapper">
                    <input
                        type="text"
                        className="sci-search-input"
                        placeholder="Tìm kiếm tầng, loại xe..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="sci-btn-create" onClick={handleCreate}>
                        + Thêm Mới Tầng
                    </button>
                </div>
            </div>

            {/* TABLE DATA */}
            <div className="sci-table-responsive">
                <table className="sci-data-table">
                    <thead>
                        <tr>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'name' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('name')}
                            >
                                Tên Tầng
                            </th>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'type' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('type')}
                            >
                                Loại Phương Tiện
                            </th>
                            <th>Mô Tả</th>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'available' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('available')}
                            >
                                Chỗ Trống
                            </th>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'inUse' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('inUse')}
                            >
                                Đã chiếm
                            </th>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'capacity' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('capacity')}
                            >
                                Sức Chứa
                            </th>
                            <th className="sci-text-right">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getFilteredAndSortedData().length === 0 ? (
                            <tr>
                                <td colSpan="7" className="sci-table-empty-row">
                                    Không tìm thấy tầng đỗ xe nào tương thích
                                </td>
                            </tr>
                        ) : (
                            getFilteredAndSortedData().map((row) => (
                                <tr key={row.id} className={`sci-table-row ${row.isActive ? 'sci-row-active' : 'sci-row-inactive'}`}>
                                    <td className="sci-cell-id">
                                        {row.name}
                                    </td>
                                    <td className="sci-font-medium">{row.type}</td>
                                    <td className="sci-text-muted">{row.description}</td>
                                    <td className="sci-cell-available">{row.available}</td>
                                    <td className="sci-font-medium">{row.inUse}</td>
                                    <td className="sci-cell-capacity">{row.capacity}</td>
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

            {/* Floor Popup handling Create / Edit operations */}
            {showFloorPopup && (
                <FloorPopup
                    key={selectedFloor?.id || 'new'} // Forces a clean state reset on mode switch
                    floorData={selectedFloor}
                    vehicleTypes={vehicleTypes}
                    onClose={() => setShowFloorPopup(false)}
                    onRefresh={loadTableData}
                />
            )}
        </div>
    );
};

export default TableFloor;