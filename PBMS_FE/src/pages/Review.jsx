import { useState, useEffect } from 'react'
import Navbar from '../components/common/Navbar'
import StarRating from '../components/common/StarRating'
import ReviewModal from '../components/review/ReviewModal'
import '../styles/Home.css'
import '../styles/Bookings.css'
import '../styles/Table.css'
import '../styles/Incident.css'
import '../styles/Review.css'
import { getMyReviewableSessions, getMyReviews } from '../services/reviewService'

const SESSION_TYPE_LABELS = {
    booking: 'Booking',
    walkin: 'Gửi xe trực tiếp',
}

const TABS = [
    { key: 'reviewable', label: 'Có thể đánh giá' },
    { key: 'mine', label: 'Đánh giá của tôi' },
]

function formatDateTime(value) {
    if (!value) return '—'
    const d = new Date(value)
    return d.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

// ─── Tab 1: Có thể đánh giá ─────────────────────────────────────
function ReviewableSessionsTable({ sessions, onReviewCreated }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [sortConfig, setSortConfig] = useState({ key: 'actualCheckout', direction: 'desc' })
    const [selectedSession, setSelectedSession] = useState(null)
    const [showReviewModal, setShowReviewModal] = useState(false)

    const applySortPreset = (value) => {
        switch (value) {
            case 'newest': setSortConfig({ key: 'actualCheckout', direction: 'desc' }); break
            case 'oldest': setSortConfig({ key: 'actualCheckout', direction: 'asc' }); break
            default: break
        }
    }

    const getFilteredAndSortedData = () => {
        const searchLower = searchTerm.toLowerCase().trim()
        const processed = sessions.filter((row) => {
            if (!searchLower) return true
            return (
                row.licensePlateSnapshot?.toLowerCase().includes(searchLower) ||
                row.vehicleTypeName?.toLowerCase().includes(searchLower)
            )
        })
        processed.sort((a, b) => {
            const valA = new Date(a[sortConfig.key]).getTime()
            const valB = new Date(b[sortConfig.key]).getTime()
            return sortConfig.direction === 'asc' ? valA - valB : valB - valA
        })
        return processed
    }

    const filteredData = getFilteredAndSortedData()

    const handleReviewSuccess = (created) => {
        onReviewCreated(created)
        setShowReviewModal(false)
        setSelectedSession(null)
    }

    return (
        <div className="sci-table-card">
            <div className="sci-table-header">
                <h2 className="sci-table-title">Có Thể Đánh Giá</h2>
                <div className="sci-search-wrapper" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        className="sci-search-input"
                        placeholder="Tìm kiếm biển số, loại xe..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                    />
                    <select className="sci-filter-select" defaultValue="newest" onChange={(e) => applySortPreset(e.target.value)}>
                        <option value="newest">Check-out mới nhất</option>
                        <option value="oldest">Check-out cũ nhất</option>
                    </select>
                </div>
            </div>

            <div className="sci-table-responsive">
                <table className="sci-data-table">
                    <thead>
                        <tr>
                            <th>Biển Số Xe</th>
                            <th>Loại Xe</th>
                            <th>Thời Gian Check-out</th>
                            <th>Nguồn</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sessions.length === 0 ? (
                            <tr><td colSpan={4} className="sci-text-muted">Hiện tại không có lượt gửi xe nào cần đánh giá.</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan={4} className="sci-text-muted">Không tìm thấy dữ liệu phù hợp.</td></tr>
                        ) : (
                            filteredData.map((row) => (
                                <tr key={row.sessionId} className="sci-row-clickable" onClick={() => setSelectedSession(row)}>
                                    <td className="sci-font-medium">{row.licensePlateSnapshot}</td>
                                    <td>{row.vehicleTypeName}</td>
                                    <td className="sci-text-muted">{formatDateTime(row.actualCheckout)}</td>
                                    <td>{row.bookingId != null ? 'Booking' : (SESSION_TYPE_LABELS[row.sessionType] || 'Gửi xe trực tiếp')}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedSession && (
                <ReviewableSessionDetailPopup
                    session={selectedSession}
                    onClose={() => setSelectedSession(null)}
                    onReview={() => setShowReviewModal(true)}
                />
            )}

            {showReviewModal && selectedSession && (
                <ReviewModal
                    session={selectedSession}
                    onClose={() => setShowReviewModal(false)}
                    onSuccess={handleReviewSuccess}
                />
            )}
        </div>
    )
}

function ReviewableSessionDetailPopup({ session, onClose, onReview }) {
    return (
        <div className="sci-incident-modal-overlay" onClick={onClose}>
            <div className="sci-incident-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sci-incident-modal-header">
                    <h3>Chi Tiết Lượt Gửi Xe</h3>
                    <button className="sci-incident-modal-close" onClick={onClose}>×</button>
                </div>
                <div className="sci-incident-modal-body">
                    <div className="sci-incident-detail-grid">
                        <div className="sci-incident-detail-item">
                            <span className="sci-incident-detail-label">Parking ID</span>
                            <span className="sci-incident-detail-value">{session.sessionId}</span>
                        </div>
                        <div className="sci-incident-detail-item">
                            <span className="sci-incident-detail-label">Booking ID</span>
                            <span className="sci-incident-detail-value">{session.bookingId ?? 'Không có booking'}</span>
                        </div>
                        <div className="sci-incident-detail-item">
                            <span className="sci-incident-detail-label">Biển Số Xe</span>
                            <span className="sci-incident-detail-value">{session.licensePlateSnapshot}</span>
                        </div>
                        <div className="sci-incident-detail-item">
                            <span className="sci-incident-detail-label">Loại Phương Tiện</span>
                            <span className="sci-incident-detail-value">{session.vehicleTypeName}</span>
                        </div>
                        <div className="sci-incident-detail-item">
                            <span className="sci-incident-detail-label">Tầng</span>
                            <span className="sci-incident-detail-value">{session.floorName}</span>
                        </div>
                        <div className="sci-incident-detail-item">
                            <span className="sci-incident-detail-label">Loại Phiên</span>
                            <span className="sci-incident-detail-value">{SESSION_TYPE_LABELS[session.sessionType] || session.sessionType}</span>
                        </div>
                        <div className="sci-incident-detail-item">
                            <span className="sci-incident-detail-label">Check-in</span>
                            <span className="sci-incident-detail-value">{formatDateTime(session.actualCheckin)}</span>
                        </div>
                        <div className="sci-incident-detail-item">
                            <span className="sci-incident-detail-label">Check-out</span>
                            <span className="sci-incident-detail-value">{formatDateTime(session.actualCheckout)}</span>
                        </div>
                    </div>

                    <div className="sci-incident-action-buttons">
                        <button className="sci-btn sci-btn-primary" onClick={onReview}>Đánh giá</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Tab 2: Đánh giá của tôi ────────────────────────────────────
function MyReviewsTable({ reviews }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [ratingFilter, setRatingFilter] = useState('')
    const [repliedFilter, setRepliedFilter] = useState('')
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' })
    const [selectedReview, setSelectedReview] = useState(null)

    const applySortPreset = (value) => {
        switch (value) {
            case 'newest': setSortConfig({ key: 'createdAt', direction: 'desc' }); break
            case 'oldest': setSortConfig({ key: 'createdAt', direction: 'asc' }); break
            default: break
        }
    }

    const getFilteredAndSortedData = () => {
        const searchLower = searchTerm.toLowerCase().trim()
        const processed = reviews.filter((row) => {
            if (ratingFilter && String(row.rating) !== ratingFilter) return false
            if (repliedFilter === 'true' && !row.isReplied) return false
            if (repliedFilter === 'false' && row.isReplied) return false
            if (!searchLower) return true
            return row.licensePlateSnapshot?.toLowerCase().includes(searchLower)
        })
        processed.sort((a, b) => {
            const valA = new Date(a[sortConfig.key]).getTime()
            const valB = new Date(b[sortConfig.key]).getTime()
            return sortConfig.direction === 'asc' ? valA - valB : valB - valA
        })
        return processed
    }

    const filteredData = getFilteredAndSortedData()

    return (
        <div className="sci-table-card">
            <div className="sci-table-header">
                <h2 className="sci-table-title">Đánh Giá Của Tôi</h2>
                <div className="sci-search-wrapper" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        className="sci-search-input"
                        placeholder="Tìm kiếm biển số..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
                    />
                    <select className="sci-filter-select" value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
                        <option value="">Tất cả số sao</option>
                        {[5, 4, 3, 2, 1].map((r) => (
                            <option key={r} value={r}>{r} sao</option>
                        ))}
                    </select>
                    <select className="sci-filter-select" value={repliedFilter} onChange={(e) => setRepliedFilter(e.target.value)}>
                        <option value="">Tất cả trạng thái</option>
                        <option value="true">Đã phản hồi</option>
                        <option value="false">Chưa phản hồi</option>
                    </select>
                    <select className="sci-filter-select" defaultValue="newest" onChange={(e) => applySortPreset(e.target.value)}>
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                    </select>
                </div>
            </div>

            <div className="sci-table-responsive">
                <table className="sci-data-table">
                    <thead>
                        <tr>
                            <th>Biển Số Xe</th>
                            <th>Số Sao</th>
                            <th>Thời Gian Đánh Giá</th>
                            <th>Trạng Thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.length === 0 ? (
                            <tr><td colSpan={4} className="sci-text-muted">Bạn chưa có đánh giá nào.</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan={4} className="sci-text-muted">Không tìm thấy dữ liệu phù hợp.</td></tr>
                        ) : (
                            filteredData.map((row) => (
                                <tr key={row.id} className="sci-row-clickable" onClick={() => setSelectedReview(row)}>
                                    <td className="sci-font-medium">{row.licensePlateSnapshot}</td>
                                    <td><StarRating value={row.rating} /></td>
                                    <td className="sci-text-muted">{formatDateTime(row.createdAt)}</td>
                                    <td>
                                        <span className={`sci-status-pill ${row.isReplied ? 'sci-status-replied' : 'sci-status-unreplied'}`}>
                                            {row.isReplied ? 'Đã phản hồi' : 'Chưa phản hồi'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedReview && (
                <MyReviewDetailPopup review={selectedReview} onClose={() => setSelectedReview(null)} />
            )}
        </div>
    )
}

function MyReviewDetailPopup({ review, onClose }) {
    return (
        <div className="sci-incident-modal-overlay" onClick={onClose}>
            <div className="sci-incident-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sci-incident-modal-header">
                    <h3>Đánh Giá #{review.id}</h3>
                    <button className="sci-incident-modal-close" onClick={onClose}>×</button>
                </div>
                <div className="sci-incident-modal-body">
                    <div className="sci-incident-section">
                        <p className="sci-incident-section-title">Thông Tin Đánh Giá</p>
                        <div className="sci-incident-detail-grid">
                            <div className="sci-incident-detail-item">
                                <span className="sci-incident-detail-label">Số Sao</span>
                                <span className="sci-incident-detail-value"><StarRating value={review.rating} /></span>
                            </div>
                            <div className="sci-incident-detail-item">
                                <span className="sci-incident-detail-label">Thời Gian Đánh Giá</span>
                                <span className="sci-incident-detail-value">{formatDateTime(review.createdAt)}</span>
                            </div>
                        </div>
                        <p className="sci-history-content">{review.comment || 'Không có nhận xét.'}</p>
                    </div>

                    <div className="sci-incident-section">
                        <p className="sci-incident-section-title">Thông Tin Lượt Gửi Xe</p>
                        <div className="sci-incident-detail-grid">
                            <div className="sci-incident-detail-item">
                                <span className="sci-incident-detail-label">Parking ID</span>
                                <span className="sci-incident-detail-value">{review.sessionId}</span>
                            </div>
                            <div className="sci-incident-detail-item">
                                <span className="sci-incident-detail-label">Booking ID</span>
                                <span className="sci-incident-detail-value">{review.bookingId ?? 'Không có booking'}</span>
                            </div>
                            <div className="sci-incident-detail-item">
                                <span className="sci-incident-detail-label">Biển Số Xe</span>
                                <span className="sci-incident-detail-value">{review.licensePlateSnapshot}</span>
                            </div>
                            <div className="sci-incident-detail-item">
                                <span className="sci-incident-detail-label">Loại Phương Tiện</span>
                                <span className="sci-incident-detail-value">{review.vehicleTypeName}</span>
                            </div>
                            <div className="sci-incident-detail-item">
                                <span className="sci-incident-detail-label">Tầng</span>
                                <span className="sci-incident-detail-value">{review.floorName}</span>
                            </div>
                            <div className="sci-incident-detail-item">
                                <span className="sci-incident-detail-label">Check-in</span>
                                <span className="sci-incident-detail-value">{formatDateTime(review.actualCheckin)}</span>
                            </div>
                            <div className="sci-incident-detail-item">
                                <span className="sci-incident-detail-label">Check-out</span>
                                <span className="sci-incident-detail-value">{formatDateTime(review.actualCheckout)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="sci-incident-section">
                        <p className="sci-incident-section-title">Phản Hồi Từ Quản Lý</p>
                        {review.isReplied ? (
                            <>
                                <p className="sci-history-content">{review.managerReply}</p>
                                <div className="sci-incident-detail-grid" style={{ marginTop: '8px' }}>
                                    <div className="sci-incident-detail-item">
                                        <span className="sci-incident-detail-label">Người Phản Hồi</span>
                                        <span className="sci-incident-detail-value">{review.replierName || 'Không xác định'}</span>
                                    </div>
                                    <div className="sci-incident-detail-item">
                                        <span className="sci-incident-detail-label">Thời Gian Phản Hồi</span>
                                        <span className="sci-incident-detail-value">{formatDateTime(review.repliedAt)}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="sci-history-content">Đánh giá này chưa được phản hồi.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ─────────────────────────────────────────────────
export default function Review() {
    const [isLoggedIn] = useState(!!localStorage.getItem('token'))
    const [activeTab, setActiveTab] = useState('reviewable')
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)
    const [reviewableSessions, setReviewableSessions] = useState([])
    const [myReviews, setMyReviews] = useState([])

    useEffect(() => {
        async function load() {
            setLoading(true)
            setLoadError(null)
            try {
                const [sessions, reviews] = await Promise.all([getMyReviewableSessions(), getMyReviews()])
                setReviewableSessions(sessions)
                setMyReviews(reviews)
            } catch (err) {
                setLoadError(err.message || 'Không thể tải dữ liệu đánh giá.')
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [])

    const handleReviewCreated = (created) => {
        setReviewableSessions(prev => prev.filter(s => s.sessionId !== created.sessionId))
        setMyReviews(prev => [created, ...prev])
    }

    return (
        <div className="bookings-page">
            <Navbar isLoggedIn={isLoggedIn} />

            <main className="bookings-main">
                <div className="bookings-page-header">
                    <div className="bookings-title-group">
                        <h1 className="bookings-title">Đánh giá</h1>
                        <p className="bookings-subtitle">Đánh giá các lượt gửi xe đã hoàn tất và xem lại đánh giá của bạn</p>
                    </div>
                </div>

                <div className="booking-tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            className={`booking-tab ${activeTab === tab.key ? 'booking-tab--active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading && (
                    <div className="sci-page sci-loading-state">
                        <p>Đang tải dữ liệu đánh giá...</p>
                    </div>
                )}

                {!loading && loadError && (
                    <div className="sci-table-card">
                        <p className="sci-form-error">{loadError}</p>
                    </div>
                )}

                {!loading && !loadError && activeTab === 'reviewable' && (
                    <ReviewableSessionsTable sessions={reviewableSessions} onReviewCreated={handleReviewCreated} />
                )}
                {!loading && !loadError && activeTab === 'mine' && (
                    <MyReviewsTable reviews={myReviews} />
                )}
            </main>
        </div>
    )
}
