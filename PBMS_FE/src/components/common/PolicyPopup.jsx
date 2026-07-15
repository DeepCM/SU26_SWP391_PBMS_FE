import { useState } from 'react';
import { createPolicy, updatePolicy } from '../../services/adminService';

const PolicyPopup = ({ policyData, onClose, onRefresh }) => {
    const isEditMode = !!policyData;

    const [policyTitle, setPolicyTitle] = useState(policyData?.title || '');

    // Default to empty string or the existing policyType
    const [policyType, setPolicyType] = useState(policyData?.policyType || '');
    const [content, setContent] = useState(policyData?.content || '');

    const [submitting, setSubmitting] = useState(false);
    const [popupError, setPopupError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!policyTitle.trim()) {
            setPopupError("Vui lòng nhập tiêu đề chính sách.");
            return;
        }
        if (!policyType) {
            setPopupError("Vui lòng chọn loại chính sách hợp lệ.");
            return;
        }
        if (!content.trim()) {
            setPopupError("Vui lòng điền nội dung chính sách.");
            return;
        }

        setSubmitting(true);
        setPopupError(null);

        try {
            const payload = {
                title: policyTitle.trim(),
                policyType: policyType, // Already strictly mapped from dropdown
                content: content.trim(),
                isActive: policyData ? policyData.isActive : true
            };

            if (isEditMode) {
                await updatePolicy(policyData.id, payload);
            } else {
                await createPolicy(payload);
            }

            onRefresh();
            onClose();
        } catch (err) {
            console.error("Policy transaction failed:", err);
            setPopupError(err.message || "Xảy ra lỗi trong quá trình xử lý.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="sci-modal-overlay">
            <div className="sci-modal-container">
                <div className="sci-modal-header">
                    <h3 className="sci-modal-title">
                        {isEditMode ? `Chỉnh Sửa: ${policyTitle || 'Chính Sách'}` : 'Thêm Mới Chính Sách'}
                    </h3>
                    <button className="sci-btn-close-modal" onClick={onClose} disabled={submitting}>
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="sci-modal-form">
                    <div className="sci-modal-body">
                        {popupError && <div className="sci-modal-error-banner">{popupError}</div>}

                        <div className="sci-form-grid-2col">
                            <div className="sci-form-group">
                                <label className="sci-form-label">Tiêu Đề <span className="sci-required">*</span></label>
                                <input
                                    type="text"
                                    className="sci-form-input"
                                    value={policyTitle}
                                    onChange={(e) => setPolicyTitle(e.target.value)}
                                    placeholder="Ví dụ: Phí gửi xe theo giờ"
                                    disabled={submitting}
                                />
                            </div>

                            <div className="sci-form-group">
                                <label className="sci-form-label">Loại Chính Sách <span className="sci-required">*</span></label>
                                <select
                                    className="sci-form-input"
                                    value={policyType}
                                    onChange={(e) => setPolicyType(e.target.value)}
                                    disabled={submitting}
                                >
                                    <option value="">-- Chọn loại chính sách --</option>
                                    <option value="parking_rules">Quy định giữ xe (parking_rules)</option>
                                    <option value="deposit_refund">Chính sách hoàn tiền cọc (deposit_refund)</option>
                                    <option value="fine">Quy định xử phạt vi phạm (fine)</option>
                                    <option value="operating_hours">Giờ hoạt động (operating_hours)</option>
                                </select>
                            </div>
                        </div>

                        <div className="sci-form-group">
                            <label className="sci-form-label">Nội Dung Chính Sách <span className="sci-required">*</span></label>
                            <textarea
                                className="sci-form-textarea"
                                rows="5"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Nhập đầy đủ nội dung hoặc quy định chi tiết ở đây..."
                                disabled={submitting}
                            ></textarea>
                        </div>
                    </div>

                    <div className="sci-modal-footer">
                        <button
                            type="button"
                            className="sci-btn-cancel"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Hủy Bỏ
                        </button>
                        <button
                            type="submit"
                            className="sci-btn-submit"
                            disabled={submitting}
                        >
                            {submitting ? 'Đang Xử Lý...' : 'Lưu Thay Đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PolicyPopup;