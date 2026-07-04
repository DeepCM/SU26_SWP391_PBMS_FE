import { useState, useEffect } from 'react'
import '../../styles/Table.css';

const TableFloor = () => {
    const [analyticsData, setAnalyticsData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showFloorPopup, setShowFloorPopup] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState(null);

    const handleCreate = () => {
        setSelectedFloor(null);
        setShowFloorPopup(true);
    };

    const handleUpdate = (floorItem) => {
        setSelectedFloor(floorItem);
        setShowFloorPopup(true);
    };

    const handleDisable = async (id) => {
        if (!window.confirm('Bạn có chắc muốn vô hiệu hóa tầng này không?')) return;
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

    useEffect(() => {
        // Simulated ghost service execution cycle
        const loadDashboardData = async () => {
            setLoading(true)
            try {
                // Mock data matching backend entity schemas exactly
                setTimeout(() => {
                    const mockData = [
                        { id: 1, floor: '1', name: 'Tầng B1', type: 'Xe máy', description: 'Tầng hầm 1 — dành riêng cho xe máy', capacity: 150 },
                        { id: 2, floor: '2', name: 'Tầng B2', type: 'Xe máy điện', description: 'Tầng hầm 2 — dành riêng cho xe máy điện', capacity: 80 },
                        { id: 3, floor: '3', name: 'Tầng B3', type: 'Ô tô', description: 'Tầng hầm 3 — dành riêng cho ô tô', capacity: 50 },
                    ];

                    setAnalyticsData({
                        tableData: mockData,
                    })
                    setLoading(false)
                }, 400)
            } catch (err) {
                setError(err.message || 'Không thể tải thông tin tổng quan.')
                setLoading(false)
            }
        }

        loadDashboardData()
    }, [])

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
                            <th>ID</th>
                            <th>Số Tầng</th>
                            <th>Tên Tầng</th>
                            <th>Loại Phương Tiện</th>
                            <th>Mô Tả</th>
                            <th>Sức Chứa</th>
                            <th className="sci-text-right">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {analyticsData.tableData.map((row) => (
                            <tr key={row.id}>
                                <td className="sci-text-muted">#{row.id}</td>
                                <td className="sci-font-medium">{row.floor}</td>
                                <td className="sci-font-medium">{row.name}</td>
                                <td className="sci-font-medium">{row.type}</td>
                                <td className="sci-font-medium">{row.description}</td>
                                {/*
                                <td>
                                    <span className={`sci-status-pill ${row.status === 'Hoạt động' ? 'sci-status-active' : 'sci-status-disabled'}`}>
                                        {row.status}
                                    </span>
                                </td>
                                */}
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

export default TableFloor;