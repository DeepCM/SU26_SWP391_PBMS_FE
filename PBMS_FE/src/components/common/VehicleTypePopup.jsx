import { useState } from 'react';
import { createVehicleType, updateVehicleType } from '../../services/adminService';

const VehicleTypePopup = ({ policyData, onClose, onRefresh }) => {
    // Tái sử dụng prop 'policyData' để đại diện cho dữ liệu loại xe cũ khi chỉnh sửa
    const isEditMode = !!policyData;

    const [name, setName] = useState(policyData?.name || '');
    const [description, setDescription] = useState(policyData?.description || '');
    
    const [submitting, setSubmitting] = useState(false);
    const [popupError, setPopupError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation phía client
        if (!name.trim()) {
            setPopupError("Vui lòng nhập tên loại xe.");
            return;
        }

        setSubmitting(true);
        setPopupError(null);

        try {
            const payload = {
                name: name.trim(),
                description: description.trim()
            };

            if (isEditMode) {
                await updateVehicleType(policyData.id, payload);
            } else {
                await createVehicleType(payload);
            }

            onRefresh();
            onClose();
        } catch (err) {
            console.error("Vehicle Type transaction failed:", err);
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
                        {isEditMode ? `Chỉnh Sửa: ${name || 'Loại Xe'}` : 'Thêm Mới Loại Xe'}
                    </h3>
                    <button className="sci-btn-close-modal" onClick={onClose} disabled={submitting}>
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="sci-modal-form">
                    <div className="sci-modal-body">
                        {popupError && <div className="sci-modal-error-banner">{popupError}</div>}

                        <div className="sci-form-group">
                            <label className="sci-form-label">Tên Loại Xe <span className="sci-required">*</span></label>
                            <input
                                type="text"
                                className="sci-form-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ví dụ: Xe máy, Ô tô 4 chỗ, Xe tải..."
                                disabled={submitting}
                            />
                        </div>

                        <div className="sci-form-group" style={{ marginTop: '15px' }}>
                            <label className="sci-form-label">Mô Tả Chi Tiết</label>
                            <textarea
                                className="sci-form-textarea"
                                rows="5"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Nhập các mô tả ngắn hoặc điều kiện kích thước cho loại xe này..."
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

export default VehicleTypePopup;