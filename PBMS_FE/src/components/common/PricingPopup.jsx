import { useState, useEffect } from 'react';
import { createPricing } from '../../services/pricingService';
import { formatAuditActor, formatAuditDate } from '../../utils/auditFormatters';
import { getFloors } from '../../services/adminService';

const PricingPopup = ({ pricingData, vehicleTypesList = [], onClose, onRefresh }) => {
    // If pricingData is passed, we are deriving a new version from an existing entry
    const isDerivingNewVersion = !!pricingData;

    const [vehicleTypeId, setVehicleTypeId] = useState('');
    const [pricePerHour, setPricePerHour] = useState('');
    const [depositAmount, setDepositAmount] = useState('');
    const [effectiveFrom, setEffectiveFrom] = useState('');
    const [floorsList, setFloorsList] = useState([]);

    const [submitting, setSubmitting] = useState(false);
    const [popupError, setPopupError] = useState(null);

    // Fetch floors on component mount to map vehicle type to a valid floorId
    useEffect(() => {
        const fetchFloors = async () => {
            try {
                const response = await getFloors();
                setFloorsList(response || []);
            } catch (err) {
                console.error("Failed to load floors:", err);
            }
        };
        fetchFloors();
    }, []);

    useEffect(() => {
        if (pricingData) {
            setVehicleTypeId(pricingData.vehicleTypeId || '');
            setPricePerHour(pricingData.pricePerHour ?? '');
            setDepositAmount(pricingData.depositAmount ?? '');
            // Default effectiveFrom to today's date for new version creation
            const today = new Date().toISOString().substring(0, 10);
            setEffectiveFrom(today);
        } else {
            setVehicleTypeId('');
            setPricePerHour('');
            setDepositAmount('');
            setEffectiveFrom('');
        }
    }, [pricingData]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Fallback checks
        const finalVehicleTypeId = vehicleTypeId || (isDerivingNewVersion ? pricingData?.vehicleTypeId : '');
        const finalPricePerHour = pricePerHour !== '' ? pricePerHour : (isDerivingNewVersion ? pricingData?.pricePerHour : '');
        const finalDepositAmount = depositAmount !== '' ? depositAmount : (isDerivingNewVersion ? pricingData?.depositAmount : '');
        const finalEffectiveFrom = effectiveFrom;

        // Validation Rules
        if (!finalVehicleTypeId) {
            setPopupError("Vui lòng chọn loại phương tiện.");
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
        if (!finalEffectiveFrom) {
            setPopupError("Vui lòng chọn ngày bắt đầu áp dụng giá mới.");
            return;
        }

        // Determine floorId: Use existing floorId if available, otherwise find the first floor matching the vehicle type
        let finalFloorId = pricingData?.floorId;
        if (!finalFloorId || finalFloorId === 0) {
            const matchedFloor = floorsList.find(floor =>
                floor.vehicleTypes?.some(vt => Number(vt.id) === Number(finalVehicleTypeId))
            );
            finalFloorId = matchedFloor ? matchedFloor.id : null;
        }

        if (!finalFloorId) {
            setPopupError("Không tìm thấy tầng phù hợp hỗ trợ loại phương tiện này.");
            return;
        }

        setSubmitting(true);
        setPopupError(null);

        // PAYLOAD: Always creates a new pricing record
        const payload = {
            vehicleTypeId: Number(finalVehicleTypeId),
            floorId: Number(finalFloorId),
            pricePerHour: Number(finalPricePerHour),
            depositAmount: Number(finalDepositAmount),
            effectiveFrom: finalEffectiveFrom
        };

        try {
            // ALWAYS call createPricing to preserve append-only history
            await createPricing(payload);
            onRefresh();
            onClose();
        } catch (err) {
            console.error("Pricing creation failed:", err);
            setPopupError(err.message || "Không thể tạo cấu hình giá mới. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="sci-modal-overlay">
            <div className="sci-modal-container">
                <div className="sci-modal-header">
                    <h3 className="sci-modal-title">
                        {isDerivingNewVersion ? 'Cập Nhật Giá (Tạo Phiên Bản Mới)' : 'Thêm Mới Cấu Hình Giá'}
                    </h3>
                    <button className="sci-btn-close-modal" onClick={onClose} disabled={submitting}>
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="sci-modal-form">
                    <div className="sci-modal-body">
                        {/* ERROR BANNER */}
                        {popupError && (
                            <div className="sci-modal-error-banner" role="alert">
                                <strong>Lỗi:</strong> {popupError}
                            </div>
                        )}

                        {/* INFO NOTICE FOR APPEND-ONLY MODEL */}
                        {isDerivingNewVersion && (
                            <div className="sci-info-banner">
                                ℹ️ <strong>Lưu ý:</strong> Hệ thống lưu trữ lịch sử giá dạng nhật ký. 
                                Việc chỉnh sửa sẽ **tạo một bản ghi giá mới** áp dụng từ ngày bạn chọn. Bản ghi cũ sẽ giữ nguyên để phục vụ tra cứu.
                            </div>
                        )}

                        {/* AUDIT SUMMARY OF SOURCE RECORD */}
                        {isDerivingNewVersion && (
                            <div className="sci-audit-summary">
                                <h4>Thông tin bản ghi nguồn</h4>
                                <div className="sci-audit-meta">
                                    <div><strong>Người tạo:</strong> {formatAuditActor(pricingData?.createdByName)}</div>
                                    <div><strong>Ngày tạo:</strong> {formatAuditDate(pricingData?.createdAt)}</div>
                                    <div><strong>Áp dụng từ:</strong> {formatAuditDate(pricingData?.effectiveFrom)}</div>
                                </div>
                            </div>
                        )}

                        {/* ROW 1: Vehicle Type */}
                        <div className="sci-form-group">
                            <label className="sci-form-label">
                                Loại Phương Tiện <span className="sci-required">*</span>
                            </label>
                            <select
                                className="sci-form-input"
                                value={vehicleTypeId}
                                onChange={(e) => setVehicleTypeId(e.target.value)}
                                disabled={submitting || isDerivingNewVersion}
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
                                    Giá Theo Giờ Mới (VNĐ) <span className="sci-required">*</span>
                                </label>
                                <input
                                    type="number"
                                    className="sci-form-input"
                                    value={pricePerHour}
                                    onChange={(e) => setPricePerHour(e.target.value)}
                                    placeholder="Nhập giá mới..."
                                    min="0"
                                    disabled={submitting}
                                />
                            </div>

                            <div className="sci-form-group">
                                <label className="sci-form-label">
                                    Tiền Đặt Cọc Mới (VNĐ) <span className="sci-required">*</span>
                                </label>
                                <input
                                    type="number"
                                    className="sci-form-input"
                                    value={depositAmount}
                                    onChange={(e) => setDepositAmount(e.target.value)}
                                    placeholder="Nhập tiền cọc mới..."
                                    min="0"
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        {/* ROW 3: Effective From */}
                        <div className="sci-form-group">
                            <label className="sci-form-label">
                                Áp Dụng Từ Ngày <span className="sci-required">*</span>
                            </label>
                            <input
                                type="date"
                                className="sci-form-input"
                                value={effectiveFrom}
                                onChange={(e) => setEffectiveFrom(e.target.value)}
                                disabled={submitting}
                            />
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
                            {submitting ? 'Đang Lưu...' : 'Xác Nhận Tạo Giá Mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PricingPopup;