import { useState } from 'react';
import { createPricing, updatePricing } from '../../services/pricingService';

const PricingPopup = ({ pricingData, floorsList = [], vehicleTypesList = [], onClose, onRefresh }) => {
    const isEditMode = !!pricingData;

    const [vehicleTypeId, setVehicleTypeId] = useState(pricingData?.vehicleTypeId || '');
    const [floorId, setFloorId] = useState(pricingData?.floorId || '');
    const [pricePerHour, setPricePerHour] = useState(pricingData?.pricePerHour || '');
    const [depositAmount, setDepositAmount] = useState(pricingData?.depositAmount || '');
    
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        return dateString.substring(0, 10);
    };

    const [effectiveFrom, setEffectiveFrom] = useState(formatDateForInput(pricingData?.effectiveFrom));
    const [effectiveTo, setEffectiveTo] = useState(formatDateForInput(pricingData?.effectiveTo));

    const [submitting, setSubmitting] = useState(false);
    const [popupError, setPopupError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!vehicleTypeId) {
            setPopupError("Vui lòng chọn Loại Phương Tiện.");
            return;
        }
        if (!floorId) {
            setPopupError("Vui lòng chọn Tầng áp dụng.");
            return;
        }
        if (pricePerHour === '' || pricePerHour < 0) {
            setPopupError("Giá theo giờ phải lớn hơn hoặc bằng 0.");
            return;
        }
        if (depositAmount === '' || depositAmount < 0) {
            setPopupError("Tiền đặt cọc phải lớn hơn hoặc bằng 0.");
            return;
        }
        if (!effectiveFrom || !effectiveTo) {
            setPopupError("Vui lòng điền đầy đủ mốc thời gian hiệu lực.");
            return;
        }
        if (new Date(effectiveFrom) > new Date(effectiveTo)) {
            setPopupError("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
            return;
        }

        setSubmitting(true);
        setPopupError(null);

        const payload = {
            vehicleTypeId: Number(vehicleTypeId),
            floorId: Number(floorId),
            pricePerHour: Number(pricePerHour),
            depositAmount: Number(depositAmount),
            effectiveFrom,
            effectiveTo
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
                        {isEditMode ? 'Chỉnh Sửa Bảng Giá' : 'Thêm Mới Cấu Hiện Giá'}
                    </h3>
                    <button className="sci-btn-close-modal" onClick={onClose} disabled={submitting}>
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="sci-modal-form">
                    <div className="sci-modal-body">
                        {popupError && <div className="sci-modal-error-banner">{popupError}</div>}

                        {/* ROW 1: Floor ID & Vehicle Type ID */}
                        <div className="sci-form-grid-2col">
                            <div className="sci-form-group">
                                <label className="sci-form-label">Chọn Tầng <span className="sci-required">*</span></label>
                                <select
                                    className="sci-form-input"
                                    value={floorId}
                                    onChange={(e) => setFloorId(e.target.value)}
                                    disabled={submitting}
                                >
                                    <option value="">-- Chọn tầng áp dụng --</option>
                                    {floorsList.map(floor => (
                                        <option key={floor.id} value={floor.id}>
                                            {floor.floorName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="sci-form-group">
                                <label className="sci-form-label">Loại Phương Tiện <span className="sci-required">*</span></label>
                                <select
                                    className="sci-form-input"
                                    value={vehicleTypeId}
                                    onChange={(e) => setVehicleTypeId(e.target.value)}
                                    disabled={submitting}
                                >
                                    <option value="">-- Chọn loại phương tiện --</option>
                                    {vehicleTypesList.map(type => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* ROW 2: Price Per Hour & Deposit Amount */}
                        <div className="sci-form-grid-2col">
                            <div className="sci-form-group">
                                <label className="sci-form-label">Giá Theo Giờ (VNĐ) <span className="sci-required">*</span></label>
                                <input
                                    type="number"
                                    className="sci-form-input"
                                    value={pricePerHour}
                                    onChange={(e) => setPricePerHour(e.target.value)}
                                    placeholder="Ví dụ: 10000"
                                    min="0"
                                    disabled={submitting}
                                />
                            </div>

                            <div className="sci-form-group">
                                <label className="sci-form-label">Tiền Đặt Cọc (VNĐ) <span className="sci-required">*</span></label>
                                <input
                                    type="number"
                                    className="sci-form-input"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    placeholder="Ví dụ: 50000"
                                    min="0"
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        {/* ROW 3: Effective From & Effective To */}
                        <div className="sci-form-grid-2col">
                            <div className="sci-form-group">
                                <label className="sci-form-label">Áp Dụng Từ <span className="sci-required">*</span></label>
                                <input
                                    type="date"
                                    className="sci-form-input"
                                    value={effectiveFrom}
                                    onChange={(e) => setEffectiveFrom(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>

                            <div className="sci-form-group">
                                <label className="sci-form-label">Áp Dụng Đến <span className="sci-required">*</span></label>
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