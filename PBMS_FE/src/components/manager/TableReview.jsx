import { useState, useEffect } from 'react'
import '../../styles/Table.css'
import '../../styles/Incident.css'
import '../../styles/Review.css'
import { getAllReviews, getReviewById, replyReview } from '../../services/reviewService'
import StarRating from '../common/StarRating'

function formatDateTime(value) {
    if (!value) return '—'
    const d = new Date(value)
    return d.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

const TableReview = () => {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [ratingFilter, setRatingFilter] = useState('')
    const [repliedFilter, setRepliedFilter] = useState('')
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' })
    const [selectedReview, setSelectedReview] = useState(null)

    useEffect(() => {
        async function loadReviews() {
            setLoading(true)
            setLoadError(null)
            try {
                const data = await getAllReviews({
                    rating: ratingFilter || undefined,
                    replied: repliedFilter === '' ? undefined : repliedFilter === 'true',
                })
                setReviews(data)
            } catch (err) {
                setLoadError(err.message || 'Không thể tải danh sách đánh giá.')
            } finally {
                setLoading(false)
            }
        }

        loadReviews()
    }, [ratingFilter, repliedFilter])

    const requestSort = (key) => {
        let direction = 'asc'
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const applySortPreset = (value) => {
        switch (value) {
            case 'newest': setSortConfig({ key: 'createdAt', direction: 'desc' }); break
            case 'oldest': setSortConfig({ key: 'createdAt', direction: 'asc' }); break
            case 'id-asc': setSortConfig({ key: 'id', direction: 'asc' }); break
            case 'id-desc': setSortConfig({ key: 'id', direction: 'desc' }); break
            default: break
        }
    }

    const getFilteredAndSortedData = () => {
        const searchLower = searchTerm.toLowerCase().trim()

        const processedItems = reviews.filter((row) => {
            if (!searchLower) return true
            return (
                row.id?.toString().includes(searchLower) ||
                row.reviewerName?.toLowerCase().includes(searchLower)
            )
        })

        if (sortConfig.key !== null) {
            processedItems.sort((a, b) => {
                const valA = a[sortConfig.key]
                const valB = b[sortConfig.key]
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
        }

        return processedItems
    }

    async function refetchReview(id, fallback) {
        try {
            return await getReviewById(id)
        } catch {
            return fallback
        }
    }

    const handleReviewReplied = async (updated) => {
        const fresh = await refetchReview(updated.id, updated)
        setReviews(prev => prev.map(row => row.id === fresh.id ? fresh : row))
        setSelectedReview(fresh)
    }

    if (loading) {
        return (
            <div className="sci-page sci-loading-state">
                <p>Đang tải danh sách đánh giá...</p>
            </div>
        )
    }

    if (loadError) {
        return (
            <div className="sci-table-card">
                <div className="sci-table-header">
                    <h2 className="sci-table-title">Quản Lý Đánh Giá</h2>
                </div>
                <p className="sci-form-error">{loadError}</p>
            </div>
        )
    }

    const filteredData = getFilteredAndSortedData()

    return (
        <div className="sci-table-card">
            <div className="sci-table-header">
                <h2 className="sci-table-title">Quản Lý Đánh Giá</h2>
                <div className="sci-search-wrapper" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        className="sci-search-input"
                        placeholder="Tìm kiếm ID, người đánh giá..."
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
                        <option value="id-asc">ID tăng dần</option>
                        <option value="id-desc">ID giảm dần</option>
                    </select>
                </div>
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
                            <th>Số Sao</th>
                            <th>Người Đánh Giá</th>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'createdAt' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('createdAt')}
                            >
                                Thời Gian Tạo
                            </th>
                            <th>Trạng Thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="sci-text-muted">Chưa có đánh giá nào.</td>
                            </tr>
                        ) : filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="sci-text-muted">Không tìm thấy dữ liệu phù hợp.</td>
                            </tr>
                        ) : (
                            filteredData.map((row) => (
                                <tr key={row.id} className="sci-row-clickable" onClick={() => setSelectedReview(row)}>
                                    <td className="sci-text-muted">#{row.id}</td>
                                    <td><StarRating value={row.rating} /></td>
                                    <td className="sci-font-medium">{row.reviewerName || 'Không xác định'}</td>
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
                <ReviewDetailPopup
                    review={selectedReview}
                    onClose={() => setSelectedReview(null)}
                    onReplied={handleReviewReplied}
                />
            )}
        </div>
    )
}

function ReviewDetailPopup({ review, onClose, onReplied }) {
    const [replyText, setReplyText] = useState('')
    const [submitting, setSubmitting] = useState(false)

    async function submitReply() {
        const trimmed = replyText.trim()
        if (!trimmed) return
        setSubmitting(true)
        try {
            const updated = await replyReview(review.id, { reply: trimmed })
            await onReplied(updated)
            setReplyText('')
        } catch (err) {
            alert(err.message || 'Không thể gửi phản hồi, vui lòng thử lại!')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="sci-incident-modal-overlay" onClick={onClose}>
            <div className="sci-incident-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sci-incident-modal-header">
                    <h3>Đánh Giá #{review.id}</h3>
                    <button className="sci-incident-modal-close" onClick={onClose}>×</button>
                </div>
                <div className="sci-incident-modal-body">
                    <div className="sci-incident-section" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                        <p className="sci-incident-section-title">Thông Tin Đánh Giá</p>
                        <div className="sci-incident-detail-grid">
                            <div className="sci-incident-detail-item">
                                <span className="sci-incident-detail-label">Người Đánh Giá</span>
                                <span className="sci-incident-detail-value">{review.reviewerName || 'Không xác định'}</span>
                            </div>
                            <div className="sci-incident-detail-item">
                                <span className="sci-incident-detail-label">Số Sao</span>
                                <span className="sci-incident-detail-value"><StarRating value={review.rating} /></span>
                            </div>
                            <div className="sci-incident-detail-item">
                                <span className="sci-incident-detail-label">Thời Gian Tạo</span>
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
                        <p className="sci-incident-section-title">Phản Hồi Quản Lý</p>
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
                            <div className="sci-inline-action" style={{ marginTop: 0 }}>
                                <label className="sci-form-label">Nhập nội dung phản hồi...</label>
                                <textarea
                                    className="sci-form-textarea"
                                    rows={3}
                                    style={{ width: '100%', boxSizing: 'border-box' }}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                />
                                <div className="sci-inline-action-actions">
                                    <button
                                        className="sci-btn sci-btn-primary"
                                        onClick={submitReply}
                                        disabled={submitting || !replyText.trim()}
                                    >
                                        {submitting ? 'Đang gửi...' : 'Phản hồi'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TableReview
