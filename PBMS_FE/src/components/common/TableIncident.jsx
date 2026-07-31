import { useState, useEffect, useRef } from 'react'
import '../../styles/Table.css'
import '../../styles/Incident.css'
import '../../styles/ParkingHistory.css'
import { getIncidents, getIncidentById, addIncidentAttachments } from '../../services/incidentService'
import { parseIncidentDescription } from '../../utils/incidentDescriptionParser'
import { INCIDENT_TYPE_LABELS, INCIDENT_STATUS_LABELS } from '../../utils/incidentLabels'
import { MANAGER_ACTIONS_CONFIG, getManagerAvailableActions } from '../../utils/incidentActions'
import CreateIncidentPopup from './CreateIncidentPopup'

const HISTORY_TYPE_LABELS = {
    'manager-request': 'Yêu cầu từ quản lý',
    'additional-info': 'Thông tin bổ sung',
    'handling-note': 'Ghi chú xử lý',
}

function formatDateTime(value) {
    if (!value) return '—'
    const d = new Date(value)
    return d.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

const TableIncident = ({
    fetchIncidents = getIncidents,
    fetchIncidentById = getIncidentById,
    title = 'Quản Lý Sự Cố',
    actionsConfig = MANAGER_ACTIONS_CONFIG,
    getAvailableActions = getManagerAvailableActions,
}) => {
    const [incidents, setIncidents] = useState([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' })
    const [showCreatePopup, setShowCreatePopup] = useState(false)
    const [selectedIncident, setSelectedIncident] = useState(null)

    useEffect(() => {
        async function loadIncidents() {
            setLoading(true)
            setLoadError(null)
            try {
                const data = await fetchIncidents()
                setIncidents(data)
            } catch (err) {
                setLoadError(err.message || 'Không thể tải danh sách sự cố.')
            } finally {
                setLoading(false)
            }
        }

        loadIncidents()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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

        const processedItems = incidents.filter((row) => {
            if (statusFilter && row.status !== statusFilter) return false
            if (typeFilter && row.incidentType !== typeFilter) return false
            if (!searchLower) return true
            return (
                row.title?.toLowerCase().includes(searchLower) ||
                row.reporterName?.toLowerCase().includes(searchLower) ||
                row.id?.toString().includes(searchLower)
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

    // Response của POST /incidents và /handle, /request-more-info, /resolve,
    // /provide-additional-info không kèm đúng reporterName/handlerName (BE chưa
    // nạp lại navigation property sau khi đổi FK) — gọi lại GET theo id để lấy
    // bản ghi đầy đủ, tránh hiện "Không xác định"/"Chưa có" cho tới khi refresh trang.
    async function refetchIncident(id, fallback) {
        try {
            return await fetchIncidentById(id)
        } catch {
            return fallback
        }
    }

    const handleIncidentCreated = async (created) => {
        const fresh = await refetchIncident(created.id, created)
        setIncidents(prev => [fresh, ...prev])
    }

    const handleIncidentUpdated = async (updated) => {
        const fresh = await refetchIncident(updated.id, updated)
        setIncidents(prev => prev.map(row => row.id === fresh.id ? fresh : row))
        setSelectedIncident(fresh)
    }

    if (loading) {
        return (
            <div className="sci-page sci-loading-state">
                <p>Đang tải danh sách sự cố...</p>
            </div>
        )
    }

    if (loadError) {
        return (
            <div className="sci-table-card">
                <div className="sci-table-header">
                    <h2 className="sci-table-title">{title}</h2>
                </div>
                <p className="sci-form-error">{loadError}</p>
            </div>
        )
    }

    const filteredData = getFilteredAndSortedData()

    return (
        <div className="sci-table-card">
            <div className="sci-table-header">
                <h2 className="sci-table-title">{title}</h2>
                <div className="sci-search-wrapper" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        className="sci-search-input"
                        placeholder="Tìm kiếm ID, tiêu đề, người báo cáo..."
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
                    <select className="sci-filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="">Tất cả trạng thái</option>
                        {Object.entries(INCIDENT_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                    <select className="sci-filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                        <option value="">Tất cả loại</option>
                        {Object.entries(INCIDENT_TYPE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                    <select className="sci-filter-select" defaultValue="newest" onChange={(e) => applySortPreset(e.target.value)}>
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="id-asc">ID tăng dần</option>
                        <option value="id-desc">ID giảm dần</option>
                    </select>
                    <button className="sci-btn sci-btn-primary" onClick={() => setShowCreatePopup(true)}>
                        + Thêm Mới
                    </button>
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
                            <th>Loại Sự Cố</th>
                            <th>Tiêu Đề</th>
                            <th>Người Báo Cáo</th>
                            <th
                                className={`sci-sortable ${sortConfig.key === 'createdAt' ? `sci-sortable-${sortConfig.direction}` : ''}`}
                                onClick={() => requestSort('createdAt')}
                            >
                                Thời Gian
                            </th>
                            <th>Trạng Thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {incidents.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="sci-text-muted">Chưa có sự cố nào được báo cáo.</td>
                            </tr>
                        ) : filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="sci-text-muted">Không tìm thấy sự cố phù hợp với bộ lọc.</td>
                            </tr>
                        ) : (
                            filteredData.map((row) => (
                                <tr key={row.id} className="sci-row-clickable" onClick={() => setSelectedIncident(row)}>
                                    <td className="sci-text-muted">#{row.id}</td>
                                    <td className="sci-font-medium">{INCIDENT_TYPE_LABELS[row.incidentType] || row.incidentType}</td>
                                    <td className="sci-font-medium">{row.title}</td>
                                    <td>{row.reporterName || 'Không xác định'}</td>
                                    <td className="sci-text-muted">{formatDateTime(row.createdAt)}</td>
                                    <td>
                                        <span className={`sci-status-pill sci-status-${row.status}`}>
                                            {INCIDENT_STATUS_LABELS[row.status] || row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showCreatePopup && (
                <CreateIncidentPopup
                    onClose={() => setShowCreatePopup(false)}
                    onCreated={handleIncidentCreated}
                />
            )}

            {selectedIncident && (
                <IncidentDetailPopup
                    incident={selectedIncident}
                    onClose={() => setSelectedIncident(null)}
                    onUpdated={handleIncidentUpdated}
                    actionsConfig={actionsConfig}
                    getAvailableActions={getAvailableActions}
                />
            )}
        </div>
    )
}

function IncidentDetailPopup({ incident, onClose, onUpdated, actionsConfig, getAvailableActions }) {
    const [activeAction, setActiveAction] = useState(null)
    const [actionInput, setActionInput] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [showHistory, setShowHistory] = useState(true)
    const [showAttachments, setShowAttachments] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [enlargedAttachment, setEnlargedAttachment] = useState(null)
    const fileInputRef = useRef(null)

    const { originalDescription, history } = parseIncidentDescription(incident.description)
    const availableActions = getAvailableActions(incident.status)
    const activeActionConfig = activeAction ? actionsConfig[activeAction] : null
    const attachments = incident.attachments || []
    const canAttach = incident.status !== 'resolved'

    function openAction(action) {
        setActiveAction(action)
        setActionInput('')
    }

    function cancelAction() {
        setActiveAction(null)
        setActionInput('')
    }

    async function handleFilesSelected(e) {
        const files = Array.from(e.target.files || [])
        e.target.value = ''
        if (files.length === 0) return
        setUploading(true)
        try {
            const uploaded = await addIncidentAttachments(incident.id, files)
            onUpdated({ id: incident.id, attachments: [...attachments, ...uploaded] })
        } catch (err) {
            alert(err.message || 'Không thể tải tệp lên, vui lòng thử lại!')
        } finally {
            setUploading(false)
        }
    }

    async function submitAction() {
        if (!activeActionConfig) return
        if (activeActionConfig.requiredInput && !actionInput.trim()) return
        setSubmitting(true)
        try {
            const updated = await activeActionConfig.call(incident.id, actionInput.trim())
            onUpdated(updated)
            setActiveAction(null)
            setActionInput('')
        } catch (err) {
            alert(err.message || 'Có lỗi xảy ra, vui lòng thử lại!')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="sci-incident-modal-overlay" onClick={onClose}>
            <div className="sci-incident-modal" onClick={(e) => e.stopPropagation()}>
                <div className="sci-incident-modal-header">
                    <h3>Sự Cố #{incident.id}</h3>
                    <button className="sci-incident-modal-close" onClick={onClose}>×</button>
                </div>
                <div className="sci-incident-modal-body">
                    <div className="sci-incident-detail-grid">
                        <div className="sci-incident-detail-item">
                            <span className="sci-incident-detail-label">Tiêu Đề</span>
                            <span className="sci-incident-detail-value">{incident.title}</span>
                        </div>
                        <div className="sci-incident-detail-item">
                            <span className="sci-incident-detail-label">Loại Sự Cố</span>
                            <span className="sci-incident-detail-value">{INCIDENT_TYPE_LABELS[incident.incidentType] || incident.incidentType}</span>
                        </div>
                        <div className="sci-incident-detail-item">
                            <span className="sci-incident-detail-label">Trạng Thái</span>
                            <span className={`sci-status-pill sci-status-${incident.status}`}>
                                {INCIDENT_STATUS_LABELS[incident.status] || incident.status}
                            </span>
                        </div>
                        <div className="sci-incident-detail-item">
                            <span className="sci-incident-detail-label">Người Báo Cáo</span>
                            <span className="sci-incident-detail-value">{incident.reporterName || `#${incident.reportedBy}`}</span>
                        </div>
                        <div className="sci-incident-detail-item">
                            <span className="sci-incident-detail-label">Người Xử Lý</span>
                            <span className="sci-incident-detail-value">{incident.handlerName || 'Chưa có'}</span>
                        </div>
                        <div className="sci-incident-detail-item">
                            <span className="sci-incident-detail-label">Thời Gian Tạo</span>
                            <span className="sci-incident-detail-value">{formatDateTime(incident.createdAt)}</span>
                        </div>
                        <div className="sci-incident-detail-item">
                            <span className="sci-incident-detail-label">Cập Nhật Lần Cuối</span>
                            <span className="sci-incident-detail-value">{formatDateTime(incident.updatedAt)}</span>
                        </div>
                        <div className="sci-incident-detail-item">
                            <span className="sci-incident-detail-label">Thời Gian Giải Quyết</span>
                            <span className="sci-incident-detail-value">{formatDateTime(incident.resolvedAt)}</span>
                        </div>
                    </div>

                    <div className="sci-incident-section">
                        <p className="sci-incident-section-title">Tham Chiếu</p>
                        {incident.bookingId == null && incident.sessionId == null ? (
                            <p className="sci-history-content">
                                Sự cố không gắn với Booking hoặc Parking Session.
                            </p>
                        ) : (
                            <div className="sci-incident-detail-grid">
                                {incident.bookingId != null && (
                                    <div className="sci-incident-detail-item">
                                        <span className="sci-incident-detail-label">Booking ID</span>
                                        <span className="sci-incident-detail-value">#{incident.bookingId}</span>
                                    </div>
                                )}
                                {incident.sessionId != null && (
                                    <div className="sci-incident-detail-item">
                                        <span className="sci-incident-detail-label">Parking ID</span>
                                        <span className="sci-incident-detail-value">#{incident.sessionId}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="sci-incident-section">
                        <p className="sci-incident-section-title">Mô Tả</p>
                        <p className="sci-history-content">{originalDescription || '—'}</p>
                    </div>

                    {history.length > 0 && (
                        <div className="sci-incident-section">
                            <div className="sci-incident-section-header">
                                <p className="sci-incident-section-title">Lịch Sử Trao Đổi</p>
                                <button
                                    type="button"
                                    className="sci-btn sci-btn-secondary sci-btn-sm"
                                    onClick={() => setShowHistory((prev) => !prev)}
                                >
                                    {showHistory ? 'Ẩn' : 'Hiện'}
                                </button>
                            </div>
                            {showHistory && (
                                <div className="sci-history-list">
                                    {history.map((item, index) => (
                                        <div key={index} className="sci-history-item">
                                            <span className={`sci-history-badge sci-history-badge--${item.type}`}>
                                                {HISTORY_TYPE_LABELS[item.type] || item.type}
                                            </span>
                                            <p className="sci-history-content">{item.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="sci-incident-section">
                        <div className="sci-incident-section-header">
                            <p className="sci-incident-section-title">
                                Tệp Đính Kèm{attachments.length > 0 ? ` (${attachments.length})` : ''}
                            </p>
                            <div className="sci-incident-section-actions">
                                {canAttach && (
                                    <>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*,video/*"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={handleFilesSelected}
                                        />
                                        <button
                                            type="button"
                                            className="sci-btn sci-btn-secondary sci-btn-sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                        >
                                            {uploading ? 'Đang tải...' : 'Đính kèm tệp'}
                                        </button>
                                    </>
                                )}
                                {attachments.length > 0 && (
                                    <button
                                        type="button"
                                        className="sci-btn sci-btn-secondary sci-btn-sm"
                                        onClick={() => setShowAttachments((prev) => !prev)}
                                    >
                                        {showAttachments ? 'Ẩn' : 'Hiện'}
                                    </button>
                                )}
                            </div>
                        </div>
                        {attachments.length === 0 ? (
                            <p className="sci-history-content">Chưa có tệp đính kèm.</p>
                        ) : showAttachments && (
                            <div className="sci-attachment-gallery">
                                {attachments.map((att) => (
                                    <div key={att.id} className="sci-attachment-item" onClick={() => setEnlargedAttachment(att)}>
                                        {att.resourceType === 'video' ? (
                                            <video src={att.fileUrl} className="sci-attachment-media" muted />
                                        ) : (
                                            <img
                                                src={att.fileUrl}
                                                alt={att.originalFileName || 'Tệp đính kèm'}
                                                className="sci-attachment-media"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="sci-incident-section">
                        <p className="sci-incident-section-title">Kết Quả Xử Lý</p>
                        <p className="sci-history-content">{incident.resolution || 'Chưa có kết quả xử lý.'}</p>
                    </div>

                    {availableActions.length > 0 && (
                        <div className="sci-incident-section">
                            <div className="sci-incident-action-buttons">
                                {availableActions.map((action) => (
                                    <button
                                        key={action}
                                        className="sci-btn sci-btn-primary"
                                        onClick={() => openAction(action)}
                                    >
                                        {actionsConfig[action].label}
                                    </button>
                                ))}
                            </div>

                            {activeActionConfig && (
                                <div className="sci-inline-action">
                                    <label className="sci-form-label">{activeActionConfig.formTitle}</label>
                                    <textarea
                                        className="sci-form-textarea"
                                        rows={3}
                                        style={{ width: '100%', boxSizing: 'border-box' }}
                                        value={actionInput}
                                        onChange={(e) => setActionInput(e.target.value)}
                                    />
                                    <div className="sci-inline-action-actions">
                                        <button className="sci-btn sci-btn-secondary" onClick={cancelAction} disabled={submitting}>Huỷ</button>
                                        <button
                                            className="sci-btn sci-btn-primary"
                                            onClick={submitAction}
                                            disabled={submitting || (activeActionConfig.requiredInput && !actionInput.trim())}
                                        >
                                            {submitting ? 'Đang xử lý...' : activeActionConfig.confirmLabel}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {enlargedAttachment && (
                <div className="sci-lightbox-overlay" onClick={(e) => { e.stopPropagation(); setEnlargedAttachment(null) }}>
                    <button className="sci-lightbox-close" onClick={() => setEnlargedAttachment(null)}>×</button>
                    {enlargedAttachment.resourceType === 'video' ? (
                        <video
                            src={enlargedAttachment.fileUrl}
                            className="sci-lightbox-image"
                            controls
                            autoPlay
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <img
                            src={enlargedAttachment.fileUrl}
                            alt={enlargedAttachment.originalFileName || 'Xem chi tiết'}
                            className="sci-lightbox-image"
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

export default TableIncident
