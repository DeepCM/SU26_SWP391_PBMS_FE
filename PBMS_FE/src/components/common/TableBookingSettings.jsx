import { useState, useEffect } from 'react';
import '../../styles/Table.css';
import { getBookingSettings, updateBookingSettings } from '../../services/adminService';
import BookingSettingsPopup from './BookingSettingsPopup';

const SETTING_DEFINITIONS = [
    {
        key: 'checkinGraceMinutes',
        title: 'Thời gian gia hạn check-in',
        description: 'Cho phép khách trễ hẹn tối đa mà không bị mất cọc (0 - 180 phút)',
        unit: 'Phút',
        minValue: 0
    },
    {
        key: 'earlyCheckinAllowanceMinutes',
        title: 'Cho phép check-in sớm',
        description: 'Thời gian khách có thể vào bãi sớm hơn so với khung giờ đặt (0 - 180 phút)',
        unit: 'Phút',
        minValue: 0
    },
    {
        key: 'maxBookingHoursAhead',
        title: 'Thời gian đặt chỗ trước tối đa',
        description: 'Khoảng thời gian giới hạn xa nhất được phép đặt cọc trước (1 - 168 giờ)',
        unit: 'Giờ',
        minValue: 1
    }
];

const TableBookingSettings = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    
    // State quản lý Sắp xếp và Tìm kiếm
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [searchTerm, setSearchTerm] = useState('');

    // Load dữ liệu từ API
    const fetchBookingSettings = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getBookingSettings();
            setSettings(res?.data || res);
        } catch (err) {
            console.error('Fetch Booking Settings Error:', err);
            setError(err.message || 'Không thể tải cấu hình quy định đặt chỗ.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookingSettings();
    }, []);

    // Chuyển đổi Object Settings thành Array các dòng dữ liệu
    const getTableRows = () => {
        if (!settings) return [];
        return SETTING_DEFINITIONS.map((def) => ({
            ...def,
            value: settings[def.key] ?? def.minValue
        }));
    };

    // Xử lý request sắp xếp
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Xử lý lọc dữ liệu và sắp xếp
    const getFilteredAndSortedData = () => {
        const rows = getTableRows();
        const searchLower = searchTerm.toLowerCase().trim();

        let processedItems = rows.filter((row) => {
            if (!searchLower) return true;
            return (
                row.title.toLowerCase().includes(searchLower) ||
                row.description.toLowerCase().includes(searchLower) ||
                row.value.toString().includes(searchLower) ||
                row.unit.toLowerCase().includes(searchLower)
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

    // Mở Popup chỉnh sửa toàn bộ cấu hình
    const handleOpenEditPopup = () => {
        setIsPopupOpen(true);
    };

    // Đặt thuộc tính được chọn ở dòng hiện tại về giá trị tối thiểu (minValue)
    const handleResetToMin = async (settingKey, minValue) => {
        if (!settings) return;
        
        const payload = {
            checkinGraceMinutes: Number(settings.checkinGraceMinutes ?? 0),
            earlyCheckinAllowanceMinutes: Number(settings.earlyCheckinAllowanceMinutes ?? 0),
            maxBookingHoursAhead: Number(settings.maxBookingHoursAhead ?? 1),
            [settingKey]: minValue // Đặt giá trị thuộc tính này về minValue tương ứng
        };

        try {
            setLoading(true);
            await updateBookingSettings(payload);
            await fetchBookingSettings();
        } catch (err) {
            console.error('Reset Setting Error:', err);
            setError(err.message || 'Không thể đặt giá trị về mặc định.');
            setLoading(false);
        }
    };

    if (loading && !settings) {
        return (
            <div className="sci-page sci-loading-state">
                <p>Đang tải dữ liệu cấu hình quy định đặt chỗ...</p>
            </div>
        );
    }

    if (error && !settings) {
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
                <h2 className="sci-table-title">Thiết Lập Quy Định Đặt Chỗ</h2>

                <div className="sci-search-wrapper">
                    <input
                        type="text"
                        className="sci-search-input"
                        placeholder="Tìm kiếm quy định, giá trị..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="sci-btn-create" onClick={handleOpenEditPopup}>
                        Sửa Cấu Hình
                    </button>
                </div>
            </div>

            {error && <div className="sci-confirm-error sci-alert-margin">{error}</div>}

            {/* TABLE DATA */}
            <div className="sci-audit-summary" style={{ marginBottom: 16 }}>
                <h4>Thông tin kiểm soát</h4>
                <div className="sci-audit-meta">
                    <div><strong>Người tạo:</strong> {settings?.createdByName || 'Không xác định'}</div>
                    <div><strong>Ngày tạo:</strong> {settings?.createdAt ? new Date(settings.createdAt).toLocaleString('vi-VN') : '—'}</div>
                    <div><strong>Cập nhật cuối:</strong> {settings?.updatedByName || settings?.createdByName || 'Chưa có cập nhật'}</div>
                    <div><strong>Thời gian sửa:</strong> {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString('vi-VN') : '—'}</div>
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
                                Cấu Hình
                            </th>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'description' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('description')}
                            >
                                Mô Tả Quy Định
                            </th>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'value' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('value')}
                            >
                                Giá Trị
                            </th>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'unit' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('unit')}
                            >
                                Đơn Vị
                            </th>
                            <th className="sci-text-right">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getFilteredAndSortedData().length === 0 ? (
                            <tr>
                                <td colSpan="5" className="sci-table-empty-row">
                                    Không tìm thấy cấu hình quy định phù hợp.
                                </td>
                            </tr>
                        ) : (
                            getFilteredAndSortedData().map((row) => (
                                <tr key={row.key} className="sci-table-row">
                                    <td className="sci-font-medium">{row.title}</td>
                                    <td className="sci-text-muted">{row.description}</td>
                                    <td className="sci-font-medium sci-cell-value">
                                        {row.value}
                                    </td>
                                    <td>{row.unit}</td>
                                    <td className="sci-text-right">
                                        <div className="sci-table-actions-wrapper">
                                            <button 
                                                className="sci-btn-toggle-status is-active" 
                                                onClick={() => handleResetToMin(row.key, row.minValue)}
                                            >
                                                Đặt về MIN ({row.minValue})
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* POPUP */}
            <BookingSettingsPopup
                isOpen={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                currentSettings={settings}
                onSaveSuccess={fetchBookingSettings}
            />
        </div>
    );
};

export default TableBookingSettings;