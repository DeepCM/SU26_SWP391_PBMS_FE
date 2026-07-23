import { useState, useEffect } from 'react';
import { createPricing, updatePricing } from '../../services/pricingService';

const PricingPopup = ({ pricingData, vehicleTypesList = [], onClose, onRefresh }) => {
    const isEditMode = !!pricingData;

    const [vehicleTypeId, setVehicleTypeId] = useState('');
    const [pricePerHour, setPricePerHour] = useState('');
    const [depositAmount, setDepositAmount] = useState('');

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        return dateString.substring(0, 10);
    };

    const [effectiveFrom, setEffectiveFrom] = useState('');
    const [effectiveTo, setEffectiveTo] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [popupError, setPopupError] = useState(null);

    useEffect(() => {
        if (pricingData) {
            setVehicleTypeId(pricingData.vehicleTypeId || '');
            setPricePerHour(pricingData.pricePerHour ?? '');
            setDepositAmount(pricingData.depositAmount ?? '');
            setEffectiveFrom(formatDateForInput(pricingData.effectiveFrom));
            setEffectiveTo(formatDateForInput(pricingData.effectiveTo));
        } else {
            setVehicleTypeId('');
            setPricePerHour('');
            setDepositAmount('');
            setEffectiveFrom('');
            setEffectiveTo('');
        }
    }, [pricingData]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // XỬ LÝ FALLBACK: Giữ nguyên giá trị cũ nếu rỗng ở chế độ Chỉnh sửa
        const finalVehicleTypeId = vehicleTypeId || (isEditMode ? pricingData?.vehicleTypeId : '');
        const finalPricePerHour = pricePerHour !== '' ? pricePerHour : (isEditMode ? pricingData?.pricePerHour : '');
        const finalDepositAmount = depositAmount !== '' ? depositAmount : (isEditMode ? pricingData?.depositAmount : '');
        const finalEffectiveFrom = effectiveFrom || (isEditMode ? formatDateForInput(pricingData?.effectiveFrom) : '');
        const finalEffectiveTo = effectiveTo || (isEditMode ? formatDateForInput(pricingData?.effectiveTo) : '');

        // VALIDATION
        if (!finalVehicleTypeId) {
            setPopupError("Vui lòng chọn Loại Phương Tiện.");
            return;
        }
        if (finalPricePerHour === '' || Number(finalPricePerHour) < 0) {
            setPopupError("Giá theo giờ phải lớn hơn hoặc bằng 0.");
            return;
        }
        if (finalDepositAmount === '' || Number(finalDepositAmount) < 0) {
            setPopupError("Tiền đặt cọc phải lớn hơn hoặc bằng 0.");
            return;
        }
        if (!finalEffectiveFrom || !finalEffectiveTo) {
            setPopupError("Vui lòng điền đầy đủ mốc thời gian hiệu lực.");
            return;
        }
        if (new Date(finalEffectiveFrom) > new Date(finalEffectiveTo)) {
            setPopupError("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
            return;
        }

        setSubmitting(true);
        setPopupError(null);

        // PAYLOAD: Tự động gửi floorId nhận được từ backend (hoặc mặc định là 0 khi thêm mới)
        const payload = {
            vehicleTypeId: Number(finalVehicleTypeId),
            floorId: pricingData?.floorId ?? 0,
            pricePerHour: Number(finalPricePerHour),
            depositAmount: Number(finalDepositAmount),
            effectiveFrom: finalEffectiveFrom,
            effectiveTo: finalEffectiveTo
        };

        try {
            if (isEditMode) {
                await updatePricing(pricingData.id, payload);
            } else {
                await createPricing(payload);
            }
            onRefresh();
            onClose();
        } catch (err) {
            console.error("Pricing submission failed:", err);
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
                        {isEditMode ? 'Chỉnh Sửa Bảng Giá' : 'Thêm Mới Cấu Hình Giá'}
                    </h3>
                    <button className="sci-btn-close-modal" onClick={onClose} disabled={submitting}>
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="sci-modal-form">
                    <div className="sci-modal-body">
                        {popupError && <div className="sci-modal-error-banner">{popupError}</div>}

                        {/* ROW 1: Vehicle Type ID */}
                        <div className="sci-form-group">
                            <label className="sci-form-label">
                                Loại Phương Tiện {!isEditMode && <span className="sci-required">*</span>}
                            </label>
                            <select
                                className="sci-form-input"
                                value={vehicleTypeId}
                                onChange={(e) => setVehicleTypeId(e.target.value)}
                                disabled={submitting}
                            >
                                <option value="">-- Chọn loại phương tiện --</option>
                                {vehicleTypesList.map(type => (
                                    <option key={type.id} value={type.id}>
                                        {type.name || type.typeName || `Loại xe ${type.id}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* ROW 2: Price Per Hour & Deposit Amount */}
                        <div className="sci-form-grid-2col">
                            <div className="sci-form-group">
                                <label className="sci-form-label">
                                    Giá Theo Giờ (VNĐ) {!isEditMode && <span className="sci-required">*</span>}
                                </label>
                                <input
                                    type="number"
                                    className="sci-form-input"
                                    value={pricePerHour}
                                    onChange={(e) => setPricePerHour(e.target.value)}
                                    placeholder={isEditMode ? `Hiện tại: ${pricingData?.pricePerHour}` : "Ví dụ: 10000"}
                                    min="0"
                                    disabled={submitting}
                                />
                            </div>

                            <div className="sci-form-group">
                                <label className="sci-form-label">
                                    Tiền Đặt Cọc (VNĐ) {!isEditMode && <span className="sci-required">*</span>}
                                </label>
                                <input
                                    type="number"
                                    className="sci-form-input"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    placeholder={isEditMode ? `Hiện tại: ${pricingData?.depositAmount}` : "Ví dụ: 50000"}
                                    min="0"
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        {/* ROW 3: Effective From & Effective To */}
                        <div className="sci-form-grid-2col">
                            <div className="sci-form-group">
                                <label className="sci-form-label">
                                    Áp Dụng Từ {!isEditMode && <span className="sci-required">*</span>}
                                </label>
                                <input
                                    type="date"
                                    className="sci-form-input"
                                    value={effectiveFrom}
                                    onChange={(e) => setEffectiveFrom(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>

                            <div className="sci-form-group">
                                <label className="sci-form-label">
                                    Áp Dụng Đến
                                </label>
                                <input
                                    type="date"
                                    className="sci-form-input"
                                    value={effectiveTo}
                                    onChange={(e) => setEffectiveTo(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>
                        </div>
                    </div>

                    {/* FOOTER ACTIONS */}
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

export default PricingPopup;