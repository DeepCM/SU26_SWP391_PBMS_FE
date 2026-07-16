import { useState } from 'react';
import { createPolicy, updatePolicy } from '../../services/adminService';

const PolicyPopup = ({ policyData, onClose, onRefresh }) => {
    const isEditMode = !!policyData;

    const [policyTitle, setPolicyTitle] = useState(policyData?.title || '');

    // Default to empty string or the existing policyType
    const [policyType, setPolicyType] = useState(policyData?.policyType || '');
    const [content, setContent] = useState(policyData?.content || '');
    const isActive = policyData?.isActive ?? true;
    const [submitting, setSubmitting] = useState(false);
    const [popupError, setPopupError] = useState(null);
    const POLICY_TYPE_MAP = {
        parking_rules: 'Quy định giữ xe',
        deposit_refund: 'Chính sách hoàn tiền cọc',
        fine: 'Quy định xử phạt vi phạm',
        operating_hours: 'Giờ hoạt động'
    };
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
            // Khôi phục payload chuẩn 4 trường theo Swagger của bạn
            const payload = {
                policyType: policyType, // Sẽ truyền giá trị Enum đã khớp ở Bước 2
                title: policyTitle.trim(),
                content: content.trim(),
                isActive: isActive
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

            // BỘ CÀO LỖI: Đảm bảo mọi loại mã lỗi (kể cả lỗi validation) sẽ hiển thị lên UI banner
            const errorBody = err.response?.data || err.data || err;
            const serverValidationError = errorBody?.errors;

            if (serverValidationError) {
                const extractedMessages = Object.values(serverValidationError).flat().join(" ");
                setPopupError(extractedMessages);
            } else {
                setPopupError(errorBody?.message || err.message || "Xảy ra lỗi trong quá trình xử lý.");
            }
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
                                    {Object.entries(POLICY_TYPE_MAP).map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
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