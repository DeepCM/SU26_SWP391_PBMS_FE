import { useState } from 'react'
import { useForm } from 'react-hook-form'
import '../../styles/Table.css'
import '../../styles/Incident.css'
import '../../styles/Review.css'
import { createReview } from '../../services/reviewService'
import StarRating from '../common/StarRating'

function formatDateTime(value) {
    if (!value) return '—'
    const d = new Date(value)
    return d.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

function ReviewModal({ session, onClose, onSuccess }) {
    const { register, handleSubmit, reset } = useForm()
    const [rating, setRating] = useState(0)
    const [ratingError, setRatingError] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const handleRatingChange = (value) => {
        setRating(value)
        setRatingError(false)
    }

    const onSubmit = async (data) => {
        if (rating === 0) {
            setRatingError(true)
            return
        }
        setSubmitting(true)
        try {
            const payload = {
                sessionId: session.sessionId,
                rating,
                comment: data.comment?.trim() || undefined,
            }
            const created = await createReview(payload)
            onSuccess?.(created)
            reset()
            setRating(0)
            onClose()
        } catch (err) {
            alert(err.message || 'Không thể gửi đánh giá, vui lòng thử lại!')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="sci-incident-modal-overlay" onClick={onClose}>
            <div className="sci-incident-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sci-incident-modal-header">
                    <h3>Đánh Giá Lượt Gửi Xe</h3>
                    <button className="sci-incident-modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="sci-incident-modal-body">
                        <div className="sci-incident-detail-grid">
                            <div className="sci-incident-detail-item">
                                <span className="sci-incident-detail-label">Biển Số Xe</span>
                                <span className="sci-incident-detail-value">{session.licensePlateSnapshot || '—'}</span>
                            </div>
                            <div className="sci-incident-detail-item">
                                <span className="sci-incident-detail-label">Loại Phương Tiện</span>
                                <span className="sci-incident-detail-value">{session.vehicleTypeName || '—'}</span>
                            </div>
                            <div className="sci-incident-detail-item">
                                <span className="sci-incident-detail-label">Tầng</span>
                                <span className="sci-incident-detail-value">{session.floorName || '—'}</span>
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

                        <div className="sci-form-group">
                            <label className="sci-form-label">Số Sao Đánh Giá</label>
                            <StarRating value={rating} onChange={handleRatingChange} size="24px" />
                            {ratingError && <span className="sci-form-error">Vui lòng chọn số sao đánh giá</span>}
                        </div>

                        <div className="sci-form-group">
                            <label className="sci-form-label">Nhận Xét (không bắt buộc)</label>
                            <textarea className="sci-form-textarea" rows={4} {...register('comment')} />
                        </div>
                    </div>
                    <div className="sci-incident-modal-footer">
                        <button type="button" className="sci-btn sci-btn-secondary" onClick={onClose} disabled={submitting}>Hủy</button>
                        <button type="submit" className="sci-btn sci-btn-primary" disabled={submitting}>
                            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default ReviewModal
