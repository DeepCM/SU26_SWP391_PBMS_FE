import { useState } from 'react'
import { useForm } from 'react-hook-form'
import '../../styles/Table.css'
import '../../styles/Incident.css'
import { createIncident } from '../../services/incidentService'
import { INCIDENT_TYPE_LABELS } from '../../utils/incidentLabels'

function CreateIncidentPopup({ onClose, onCreated, defaultSessionId }) {
    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: { sessionId: defaultSessionId ?? '' }
    })
    const [submitting, setSubmitting] = useState(false)

    const onSubmit = async (data) => {
        setSubmitting(true)
        try {
            const payload = {
                title: data.title.trim(),
                description: data.description.trim(),
                incidentType: data.incidentType,
            }
            if (data.sessionId) {
                payload.sessionId = Number(data.sessionId)
            }
            const created = await createIncident(payload)
            onCreated?.(created)
            reset()
            onClose()
        } catch (err) {
            alert(err.message || 'Không thể tạo sự cố, vui lòng thử lại!')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="sci-incident-modal-overlay" onClick={onClose}>
            <div className="sci-incident-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sci-incident-modal-header">
                    <h3>Báo Cáo Sự Cố Mới</h3>
                    <button className="sci-incident-modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="sci-incident-modal-body">
                        <div className="sci-form-group">
                            <label className="sci-form-label">Mã Phiên (tuỳ chọn)</label>
                            <input className="sci-form-input" type="number" {...register('sessionId')} />
                        </div>
                        <div className="sci-form-group">
                            <label className="sci-form-label">Tiêu Đề</label>
                            <input className="sci-form-input" {...register('title', { required: 'Vui lòng nhập tiêu đề' })} />
                            {errors.title && <span className="sci-form-error">{errors.title.message}</span>}
                        </div>
                        <div className="sci-form-group">
                            <label className="sci-form-label">Loại Sự Cố</label>
                            <select className="sci-form-select" defaultValue="" {...register('incidentType', { required: 'Vui lòng chọn loại sự cố' })}>
                                <option value="" disabled>-- Chọn loại --</option>
                                {Object.entries(INCIDENT_TYPE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label}</option>
                                ))}
                            </select>
                            {errors.incidentType && <span className="sci-form-error">{errors.incidentType.message}</span>}
                        </div>
                        <div className="sci-form-group">
                            <label className="sci-form-label">Mô Tả</label>
                            <textarea className="sci-form-textarea" rows={4} {...register('description', { required: 'Vui lòng nhập mô tả' })} />
                            {errors.description && <span className="sci-form-error">{errors.description.message}</span>}
                        </div>
                    </div>
                    <div className="sci-incident-modal-footer">
                        <button type="button" className="sci-btn sci-btn-secondary" onClick={onClose} disabled={submitting}>Huỷ</button>
                        <button type="submit" className="sci-btn sci-btn-primary" disabled={submitting}>
                            {submitting ? 'Đang gửi...' : 'Tạo sự cố'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateIncidentPopup
