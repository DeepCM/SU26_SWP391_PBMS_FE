import { useState, useEffect } from 'react';
import { updateBookingSettings } from '../../services/adminService';

export default function BookingSettingsPopup({ isOpen, onClose, currentSettings, onSaveSuccess }) {
    const [formData, setFormData] = useState({
        checkinGraceMinutes: 180,
        earlyCheckinAllowanceMinutes: 180,
        maxBookingHoursAhead: 168
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Đồng bộ cấu hình hiện tại vào form khi mở Modal
    useEffect(() => {
        if (currentSettings) {
            setFormData({
                checkinGraceMinutes: currentSettings.checkinGraceMinutes ?? 180,
                earlyCheckinAllowanceMinutes: currentSettings.earlyCheckinAllowanceMinutes ?? 180,
                maxBookingHoursAhead: currentSettings.maxBookingHoursAhead ?? 168
            });
        }
    }, [currentSettings, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value === '' ? '' : Number(value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const payload = {
            checkinGraceMinutes: Number(formData.checkinGraceMinutes),
            earlyCheckinAllowanceMinutes: Number(formData.earlyCheckinAllowanceMinutes),
            maxBookingHoursAhead: Number(formData.maxBookingHoursAhead)
        };

        try {
            await updateBookingSettings(payload);
            if (onSaveSuccess) onSaveSuccess();
            onClose();
        } catch (err) {
            console.error('Update Booking Settings Error:', err);
            setError(err.message || 'Không thể cập nhật cấu hình đặt chỗ.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="sci-modal-overlay">
            <div className="sci-modal-container">
                {/* HEADER */}
                <div className="sci-modal-header">
                    <h3 className="sci-modal-title">Cấu Hình Quy Định Đặt Chỗ</h3>
                    <button
                        type="button"
                        className="sci-btn-close-modal"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        &times;
                    </button>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="sci-modal-form">
                    <div className="sci-modal-body">
                        {error && <div className="sci-modal-error-banner">{error}</div>}

                        <div className="sci-form-group">
                            <label className="sci-form-label">
                                Thời gian gia hạn check-in trễ (Phút) <span className="sci-required">*</span>
                            </label>
                            <input
                                type="number"
                                name="checkinGraceMinutes"
                                value={formData.checkinGraceMinutes}
                                onChange={handleChange}
                                min="0"
                                required
                                disabled={submitting}
                                className="sci-form-input"
                            />
                        </div>

                        <div className="sci-form-group">
                            <label className="sci-form-label">
                                Thời gian cho phép check-in sớm (Phút) <span className="sci-required">*</span>
                            </label>
                            <input
                                type="number"
                                name="earlyCheckinAllowanceMinutes"
                                value={formData.earlyCheckinAllowanceMinutes}
                                onChange={handleChange}
                                min="0"
                                required
                                disabled={submitting}
                                className="sci-form-input"
                            />
                        </div>

                        <div className="sci-form-group">
                            <label className="sci-form-label">
                                Thời gian đặt chỗ trước tối đa (Giờ) <span className="sci-required">*</span>
                            </label>
                            <input
                                type="number"
                                name="maxBookingHoursAhead"
                                value={formData.maxBookingHoursAhead}
                                onChange={handleChange}
                                min="1"
                                max="168"
                                required
                                disabled={submitting}
                                className="sci-form-input"
                            />
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
}