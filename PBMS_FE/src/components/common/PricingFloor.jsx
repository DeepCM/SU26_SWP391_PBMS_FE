import { useState, useEffect } from 'react'
import '../../styles/Table.css';
import { createPricing, getAllPricing, getOnePricing, updatePricing } from '../../services/pricingService'

const PricingFloor = () => {
    const [analyticsData, setAnalyticsData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showFloorPopup, setShowFloorPopup] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState(null);
    const [vehicleTypes, setVehicleTypes] = useState([])
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const handleCreate = () => {
        setSelectedFloor(null);
        setShowFloorPopup(true);
    };

    const handleUpdate = (floorItem) => {
        setSelectedFloor(floorItem);
        setShowFloorPopup(true);
    };

    const handleDisable = async (id) => {
        if (!window.confirm('Bạn có chắc muốn vô hiệu hóa không?')) return;
        try {
            // await disableFloor(id); // TODO: Replace with your actual API call

            // Optimistically update the UI by filtering out the disabled item
            setAnalyticsData(prev => ({
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

    const sortedTableData = () => {
        if (!analyticsData?.tableData) return [];

        // Create a shallow copy to avoid mutating state directly
        const sortableItems = [...analyticsData.tableData];

        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                const valA = a[sortConfig.key];
                const valB = b[sortConfig.key];

                // Handle numeric or string comparisons cleanly
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    };

    useEffect(() => {
        async function loadTableData() {
            setLoading(true);
            try {
                // 1. Get all vehicle types
                const types = await getVehicleTypes();
                setVehicleTypes(types);

                let flattenedFloors = [];

                // 2. Fetch slots and pricing for all types in parallel
                await Promise.all(
                    types.map(async (type) => {
                        const slots = await getAvailableSlots(type.id);
                        // const pricing = await getPricingPreview(type.id); // Uncomment if needed for the edit popup later

                        // 3. Extract floors and map them to match your table row structure
                        if (slots && slots.floors) {
                            const typeFloors = slots.floors.map(floor => ({
                                id: floor.floorId,
                                name: floor.floorName,
                                type: type.name || type.id, // Tag the floor with its vehicle type name
                                description: floor.description || `Tầng dành riêng cho ${type.name}`,
                                inUse: Math.round(((floor.occupiedSlots) + (floor.reservedSlots))),
                                available: floor.availableSlots,
                                capacity: floor.totalSlots
                            }));

                            // Merge into the main array
                            flattenedFloors = [...flattenedFloors, ...typeFloors];
                        }
                    })
                );

                // 4. Set state to match the { tableData: [...] } structure expected by your JSX
                setAnalyticsData({
                    tableData: flattenedFloors
                });

            } catch (err) {
                console.error("Failed to load init data:", err);
                setError(err.message || 'Không thể tải dữ liệu tầng.');
            } finally {
                setLoading(false);
            }
        }

        loadTableData();
    }, []);

    if (loading) {
        return (
            <div className="sci-page sci-loading-state">
                <p>Đang tải dữ liệu phân tích...</p>
            </div>
        )
    }

    return (
        <div className="sci-table-card">

            {/* HEADER: Title and Add Button */}
            <div className="sci-table-header">
                <h2 className="sci-table-title">Quản Lý Tầng Đỗ Xe</h2>
                <button className="sci-btn sci-btn-primary" onClick={handleCreate}>
                    + Thêm Mới
                </button>

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

                            {/* Unsortable column: no extra classes or click handlers */}
                            <th>Mô Tả</th>

                            <th
                                className={`sci-sortable ${sortConfig.key === 'available' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('available')}
                            >
                                Chổ Trống
                            </th>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'occupied' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('occupied')}
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
                        {sortedTableData().map((row) => (
                            <tr key={row.id}>
                                <td className="sci-text-muted">B{row.id}</td>
                                <td className="sci-font-medium">{row.type}</td>
                                <td className="sci-font-medium">{row.description}</td>
                                {/*
                                <td>
                                    <span className={`sci-status-pill ${row.status === 'Hoạt động' ? 'sci-status-active' : 'sci-status-disabled'}`}>
                                        {row.status}
                                    </span>
                                </td>
                                */}
                                <td className="sci-font-medium">{row.available}</td>
                                <td className="sci-font-medium">{row.inUse}</td>
                                <td className="sci-font-medium">{row.capacity}</td>
                                {/* ACTION BUTTONS */}
                                <td className="sci-text-right">
                                    <div className="sci-action-group">
                                        <button className="sci-btn-text sci-edit-btn" onClick={() => handleUpdate(row)}>Sửa</button>
                                        <button className="sci-btn-text sci-disable-btn" onClick={() => handleDisable(row.id)}>
                                            {/*{row.status === 'Hoạt động' ? 'Vô hiệu hóa' : 'Kích hoạt'}*/}
                                            Vô hiệu hóa
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Floor Popup collect floor data
            {showFloorPopup && (
                <FloorPopup
                    floorData={selectedFloor}
                    onClose={() => setShowFloorPopup(false)}
                // onRefresh={loadDashboardData} // Useful to trigger a re-fetch after a successful save
                />
            )}  */}
        </div >
    );
};

export default PricingFloor;