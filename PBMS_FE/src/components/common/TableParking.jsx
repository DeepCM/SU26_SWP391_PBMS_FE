import { useState, useEffect } from 'react'
import '../../styles/Table.css'
import '../../styles/Incident.css'
import '../../styles/ParkingHistory.css'
import { getParkingSessions, getParkingSessionById, getParkingSessionFloorOptions } from '../../services/parkingHistoryService'
import { getVehicleTypes } from '../../services/vehicleTypeService'
import { PARKING_STATUS_LABELS, SESSION_TYPE_LABELS } from '../../utils/parkingLabels'
import CreateIncidentPopup from './CreateIncidentPopup'

// Backend chỉ lọc theo SessionCode/LicensePlateSnapshot (xem ParkingSessionRepository.BuildHistoryQuery),
// không hỗ trợ tìm theo ID hay Booking ID.
const SEARCH_PLACEHOLDER = 'Tìm kiếm theo mã phiên, biển số...'

// Chưa có luồng nghiệp vụ nào tự động gán trạng thái "incident" cho phiên gửi xe,
// nên bỏ khỏi dropdown filter — vẫn giữ trong PARKING_STATUS_LABELS để hiển thị badge nếu có.
const STATUS_FILTER_OPTIONS = Object.entries(PARKING_STATUS_LABELS).filter(([value]) => value !== 'incident')

const PAGE_SIZE_OPTIONS = [10, 20, 50]

function formatDateTime(value) {
    if (!value) return '—'
    const d = new Date(value)
    return d.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

function formatCurrency(value) {
    if (value === null || value === undefined) return '—'
    return `${Number(value).toLocaleString('vi-VN')} đ`
}

const TableParking = () => {
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)

    const [searchInput, setSearchInput] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [sessionTypeFilter, setSessionTypeFilter] = useState('')
    const [floorFilter, setFloorFilter] = useState('')
    const [vehicleTypeFilter, setVehicleTypeFilter] = useState('')
    const [checkinFrom, setCheckinFrom] = useState('')
    const [checkinTo, setCheckinTo] = useState('')

    // Backend không hỗ trợ tham số sắp xếp (chỉ luôn trả về theo Check-in giảm dần),
    // nên sortConfig chỉ áp dụng lại thứ tự trên dữ liệu của trang hiện tại.
    const [sortConfig, setSortConfig] = useState({ key: 'actualCheckin', direction: 'desc' })

    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [totalPages, setTotalPages] = useState(0)
    const [totalCount, setTotalCount] = useState(0)

    const [floorOptions, setFloorOptions] = useState([])
    const [vehicleTypeOptions, setVehicleTypeOptions] = useState([])

    const [selectedSessionId, setSelectedSessionId] = useState(null)
    const [incidentSessionId, setIncidentSessionId] = useState(null)

    // Debounce ô tìm kiếm trước khi gửi request lên backend
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(searchInput.trim())
            setPage(1)
        }, 400)
        return () => clearTimeout(timer)
    }, [searchInput])

    useEffect(() => {
        async function loadFilterOptions() {
            try {
                const [floors, types] = await Promise.all([
                    getParkingSessionFloorOptions(),
                    getVehicleTypes(),
                ])
                setFloorOptions(floors)
                setVehicleTypeOptions(types)
            } catch {
                // Bộ lọc tầng/loại xe là tiện ích phụ trợ — bỏ qua nếu không tải được
            }
        }
        loadFilterOptions()
    }, [])

    useEffect(() => {
        async function loadSessions() {
            setLoading(true)
            setLoadError(null)
            try {
                const data = await getParkingSessions({
                    search: searchTerm || undefined,
                    status: statusFilter || undefined,
                    sessionType: sessionTypeFilter || undefined,
                    floorId: floorFilter || undefined,
                    vehicleTypeId: vehicleTypeFilter || undefined,
                    checkinFrom: checkinFrom || undefined,
                    checkinTo: checkinTo || undefined,
                    page,
                    pageSize,
                })
                setSessions(data.items || [])
                setTotalPages(data.totalPages || 0)
                setTotalCount(data.totalCount || 0)
            } catch (err) {
                setLoadError(err.message || 'Không thể tải lịch sử phiên gửi xe.')
            } finally {
                setLoading(false)
            }
        }

        loadSessions()
    }, [searchTerm, statusFilter, sessionTypeFilter, floorFilter, vehicleTypeFilter, checkinFrom, checkinTo, page, pageSize])

    const requestSort = (key) => {
        let direction = 'asc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const applySortPreset = (value) => {
        switch (value) {
            case 'newest': setSortConfig({ key: 'actualCheckin', direction: 'desc' }); break
            case 'oldest': setSortConfig({ key: 'actualCheckin', direction: 'asc' }); break
            case 'id-asc': setSortConfig({ key: 'id', direction: 'asc' }); break
            case 'id-desc': setSortConfig({ key: 'id', direction: 'desc' }); break
            default: break
        }
    }

    const getSortedSessions = () => {
        if (!sortConfig.key) return sessions
        const sorted = [...sessions].sort((a, b) => {
            const valA = a[sortConfig.key]
            const valB = b[sortConfig.key]
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
            return 0
        })
        return sorted
    }

    function goToPage(nextPage) {
        if (nextPage < 1 || nextPage > totalPages || nextPage === page) return
        setPage(nextPage)
    }

    function getPageNumbers() {
        const numbers = []
        const start = Math.max(1, page - 2)
        const end = Math.min(totalPages, start + 4)
        for (let i = start; i <= end; i++) numbers.push(i)
        return numbers
    }

    if (loading && sessions.length === 0) {
        return (
            <div className="sci-page sci-loading-state">
                <p>Đang tải lịch sử phiên gửi xe...</p>
            </div>
        )
    }

    if (loadError) {
        return (
            <div className="sci-table-card">
                <div className="sci-table-header">
                    <h2 className="sci-table-title">Quản Lý Lịch Sử Phiên Gửi Xe</h2>
                </div>
                <p className="sci-form-error">{loadError}</p>
            </div>
        )
    }

    const sortedSessions = getSortedSessions()

    return (
        <div className="sci-table-card">
            <div className="sci-table-header">
                <h2 className="sci-table-title">Quản Lý Lịch Sử Phiên Gửi Xe</h2>
            </div>

            <div className="sci-filter-row" style={{ marginBottom: '16px' }}>
                <input
                    type="text"
                    className="sci-search-input"
                    placeholder={SEARCH_PLACEHOLDER}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
                <select className="sci-filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}>
                    <option value="">Tất cả trạng thái</option>
                    {STATUS_FILTER_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
                <select className="sci-filter-select" value={sessionTypeFilter} onChange={(e) => { setSessionTypeFilter(e.target.value); setPage(1) }}>
                    <option value="">Tất cả loại phiên</option>
                    {Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
                <select className="sci-filter-select" value={floorFilter} onChange={(e) => { setFloorFilter(e.target.value); setPage(1) }}>
                    <option value="">Tất cả tầng</option>
                    {floorOptions.map((floor) => (
                        <option key={floor.id} value={floor.id}>{floor.name}</option>
                    ))}
                </select>
                <select className="sci-filter-select" value={vehicleTypeFilter} onChange={(e) => { setVehicleTypeFilter(e.target.value); setPage(1) }}>
                    <option value="">Tất cả loại xe</option>
                    {vehicleTypeOptions.map((type) => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                </select>
                <div className="sci-date-filter-group">
                    <span>Check-in từ</span>
                    <input
                        type="date"
                        className="sci-date-input"
                        value={checkinFrom}
                        onChange={(e) => { setCheckinFrom(e.target.value); setPage(1) }}
                    />
                    <span>đến</span>
                    <input
                        type="date"
                        className="sci-date-input"
                        value={checkinTo}
                        onChange={(e) => { setCheckinTo(e.target.value); setPage(1) }}
                    />
                </div>
                <select className="sci-filter-select" defaultValue="newest" onChange={(e) => applySortPreset(e.target.value)}>
                    <option value="newest">Check-in mới nhất</option>
                    <option value="oldest">Check-in cũ nhất</option>
                    <option value="id-asc">ID tăng dần</option>
                    <option value="id-desc">ID giảm dần</option>
                </select>
            </div>

            <div className="sci-table-responsive">
                <table className="sci-data-table">
                    <thead>
                        <tr>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'id' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('id')}
                            >
                                ID
                            </th>
                            <th>Booking ID</th>
                            <th>Biển Số</th>
                            <th>Loại Xe</th>
                            <th>Tầng</th>
                            <th>Loại Phiên</th>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'actualCheckin' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('actualCheckin')}
                            >
                                Check-in
                            </th>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'actualCheckout' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('actualCheckout')}
                            >
                                Check-out
                            </th>
                            <th>Trạng Thái</th>
                            <th className="sci-text-right">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedSessions.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="sci-text-muted">Không tìm thấy phiên gửi xe phù hợp.</td>
                            </tr>
                        ) : (
                            sortedSessions.map((row) => (
                                <tr key={row.id} className="sci-row-clickable" onClick={() => setSelectedSessionId(row.id)}>
                                    <td className="sci-text-muted">#{row.id}</td>
                                    <td>{row.bookingId ?? '—'}</td>
                                    <td className="sci-font-medium">{row.licensePlate}</td>
                                    <td>{row.vehicleTypeName}</td>
                                    <td>{row.floorName}</td>
                                    <td>{SESSION_TYPE_LABELS[row.sessionType] || row.sessionType}</td>
                                    <td className="sci-text-muted">{formatDateTime(row.actualCheckin)}</td>
                                    <td className="sci-text-muted">{formatDateTime(row.actualCheckout)}</td>
                                    <td>
                                        <span className={`sci-status-pill sci-status-${row.status}`}>
                                            {PARKING_STATUS_LABELS[row.status] || row.status}
                                        </span>
                                    </td>
                                    <td className="sci-text-right">
                                        <button
                                            className="sci-btn sci-btn-warning"
                                            onClick={(e) => { e.stopPropagation(); setIncidentSessionId(row.id) }}
                                        >
                                            Ghi nhận sự cố
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="sci-pagination-wrapper">
                <div className="sci-pagination-info">
                    {totalCount === 0
                        ? 'Không có bản ghi nào'
                        : `Trang ${page}/${totalPages} — tổng ${totalCount} bản ghi`}
                </div>
                <div className="sci-pagination-controls">
                    <select
                        className="sci-filter-select"
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                    >
                        {PAGE_SIZE_OPTIONS.map((size) => (
                            <option key={size} value={size}>{size} / trang</option>
                        ))}
                    </select>
                    <button className="sci-pagination-btn" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                        Trước
                    </button>
                    {getPageNumbers().map((num) => (
                        <button
                            key={num}
                            className={`sci-pagination-btn ${num === page ? 'sci-pagination-btn--active' : ''}`}
                            onClick={() => goToPage(num)}
                        >
                            {num}
                        </button>
                    ))}
                    <button className="sci-pagination-btn" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                        Sau
                    </button>
                </div>
            </div>

            {selectedSessionId != null && (
                <ParkingSessionDetailPopup
                    sessionId={selectedSessionId}
                    onClose={() => setSelectedSessionId(null)}
                />
            )}

            {incidentSessionId != null && (
                <CreateIncidentPopup
                    defaultSessionId={incidentSessionId}
                    onClose={() => setIncidentSessionId(null)}
                />
            )}
        </div>
    )
}

function ImageField({ label, url, onEnlarge }) {
    return (
        <div className="sci-image-item">
            <span className="sci-image-item-label">{label}</span>
            {url ? (
                <img
                    src={url}
                    alt={label}
                    className="sci-image-preview"
                    onClick={() => onEnlarge(url)}
                />
            ) : (
                <div className="sci-image-empty">Không có ảnh</div>
            )}
        </div>
    )
}

function ParkingSessionDetailPopup({ sessionId, onClose }) {
    const [detail, setDetail] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [enlargedImage, setEnlargedImage] = useState(null)

    useEffect(() => {
        async function loadDetail() {
            setLoading(true)
            setError(null)
            try {
                const data = await getParkingSessionById(sessionId)
                setDetail(data)
            } catch (err) {
                setError(err.message || 'Không thể tải chi tiết phiên gửi xe.')
            } finally {
                setLoading(false)
            }
        }
        loadDetail()
    }, [sessionId])

    return (
        <div className="sci-incident-modal-overlay" onClick={onClose}>
            <div className="sci-incident-modal sci-parking-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sci-incident-modal-header">
                    <h3>Phiên Gửi Xe #{sessionId}</h3>
                    <button className="sci-incident-modal-close" onClick={onClose}>×</button>
                </div>
                <div className="sci-incident-modal-body">
                    {loading && <p className="sci-text-muted">Đang tải chi tiết...</p>}
                    {error && <p className="sci-form-error">{error}</p>}

                    {detail && !loading && !error && (
                        <>
                            <div className="sci-incident-detail-grid">
                                <div className="sci-incident-detail-item">
                                    <span className="sci-incident-detail-label">ID</span>
                                    <span className="sci-incident-detail-value">#{detail.id}</span>
                                </div>
                                <div className="sci-incident-detail-item">
                                    <span className="sci-incident-detail-label">Mã Phiên</span>
                                    <span className="sci-incident-detail-value">{detail.sessionCode || '—'}</span>
                                </div>
                                <div className="sci-incident-detail-item">
                                    <span className="sci-incident-detail-label">Booking ID</span>
                                    <span className="sci-incident-detail-value">{detail.bookingId ?? '—'}</span>
                                </div>
                                <div className="sci-incident-detail-item">
                                    <span className="sci-incident-detail-label">Vehicle ID</span>
                                    <span className="sci-incident-detail-value">{detail.vehicleId ?? '—'}</span>
                                </div>
                                <div className="sci-incident-detail-item">
                                    <span className="sci-incident-detail-label">Biển Số</span>
                                    <span className="sci-incident-detail-value">{detail.licensePlate}</span>
                                </div>
                                <div className="sci-incident-detail-item">
                                    <span className="sci-incident-detail-label">Loại Xe</span>
                                    <span className="sci-incident-detail-value">{detail.vehicleTypeName}</span>
                                </div>
                                <div className="sci-incident-detail-item">
                                    <span className="sci-incident-detail-label">Tầng</span>
                                    <span className="sci-incident-detail-value">{detail.floorName}</span>
                                </div>
                                <div className="sci-incident-detail-item">
                                    <span className="sci-incident-detail-label">Số Tầng</span>
                                    <span className="sci-incident-detail-value">{detail.floorNumber}</span>
                                </div>
                                <div className="sci-incident-detail-item">
                                    <span className="sci-incident-detail-label">Loại Phiên</span>
                                    <span className="sci-incident-detail-value">{SESSION_TYPE_LABELS[detail.sessionType] || detail.sessionType}</span>
                                </div>
                                <div className="sci-incident-detail-item">
                                    <span className="sci-incident-detail-label">Trạng Thái</span>
                                    <span className={`sci-status-pill sci-status-${detail.status}`}>
                                        {PARKING_STATUS_LABELS[detail.status] || detail.status}
                                    </span>
                                </div>
                                <div className="sci-incident-detail-item">
                                    <span className="sci-incident-detail-label">Đơn Giá Áp Dụng</span>
                                    <span className="sci-incident-detail-value">{formatCurrency(detail.appliedPricePerHour)}/giờ</span>
                                </div>
                                <div className="sci-incident-detail-item">
                                    <span className="sci-incident-detail-label">Nhân Viên Check-in</span>
                                    <span className="sci-incident-detail-value">{detail.staffCheckinName || '—'}</span>
                                </div>
                                <div className="sci-incident-detail-item">
                                    <span className="sci-incident-detail-label">Nhân Viên Check-out</span>
                                    <span className="sci-incident-detail-value">{detail.staffCheckoutName || 'Chưa có'}</span>
                                </div>
                                <div className="sci-incident-detail-item">
                                    <span className="sci-incident-detail-label">Thời Gian Check-in</span>
                                    <span className="sci-incident-detail-value">{formatDateTime(detail.actualCheckin)}</span>
                                </div>
                                <div className="sci-incident-detail-item">
                                    <span className="sci-incident-detail-label">Thời Gian Check-out</span>
                                    <span className="sci-incident-detail-value">{formatDateTime(detail.actualCheckout)}</span>
                                </div>
                            </div>

                            <div className="sci-incident-section">
                                <p className="sci-incident-section-title">Hình Ảnh Check-in</p>
                                <div className="sci-image-gallery">
                                    <ImageField label="Ảnh Xe" url={detail.checkinVehicleImg} onEnlarge={setEnlargedImage} />
                                    <ImageField label="Ảnh Khuôn Mặt" url={detail.checkinFaceImg} onEnlarge={setEnlargedImage} />
                                </div>
                            </div>

                            <div className="sci-incident-section">
                                <p className="sci-incident-section-title">Hình Ảnh Check-out</p>
                                <div className="sci-image-gallery">
                                    <ImageField label="Ảnh Xe" url={detail.checkoutVehicleImg} onEnlarge={setEnlargedImage} />
                                    <ImageField label="Ảnh Khuôn Mặt" url={detail.checkoutFaceImg} onEnlarge={setEnlargedImage} />
                                </div>
                            </div>

                            <div className="sci-incident-section">
                                <p className="sci-incident-section-title">Ghi Chú</p>
                                <p className="sci-history-content">{detail.notes || 'Không có ghi chú.'}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {enlargedImage && (
                <div className="sci-lightbox-overlay" onClick={(e) => { e.stopPropagation(); setEnlargedImage(null) }}>
                    <button className="sci-lightbox-close" onClick={() => setEnlargedImage(null)}>×</button>
                    <img src={enlargedImage} alt="Xem chi tiết" className="sci-lightbox-image" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </div>
    )
}

export default TableParking
