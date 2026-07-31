import { useState } from 'react';
import {
    createFloor,
    updateFloor,
    updateFloorCapacity,
    updateFloorVehicleTypes
} from '../../services/adminService';
import { formatAuditActor, formatAuditDate } from '../../utils/auditFormatters';

const FloorPopup = ({ floorData, vehicleTypes = [], onClose, onRefresh }) => {
    const isEditMode = !!floorData;
    
    // Core Form Fields initialized directly from the passed floorData object
    const [floorName, setFloorName] = useState(floorData?.name || '');
    const [floorNumber, setFloorNumber] = useState(floorData?.floorNumber ?? 1);
    const [description, setDescription] = useState(floorData?.description || '');
    const [totalSlots, setTotalSlots] = useState(floorData?.capacity ?? 50);
    const [selectedVehicleTypeIds, setSelectedVehicleTypeIds] = useState(floorData?.vehicleTypeIds || []);

    // Operation UI States
    const [submitting, setSubmitting] = useState(false);
    const [popupError, setPopupError] = useState(null);

    const handleVehicleCheckboxChange = (typeId) => {
        setSelectedVehicleTypeIds((prev) =>
            prev.includes(typeId)
                ? prev.filter((id) => id !== typeId)
                : [...prev, typeId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!floorName.trim()) {
            setPopupError("Vui lòng điền tên tầng đỗ xe.");
            return;
        }
        if (totalSlots <= 0) {
            setPopupError("Sức chứa chỗ trống phải lớn hơn 0.");
            return;
        }
        if (selectedVehicleTypeIds.length === 0) {
            setPopupError("Vui lòng gán ít nhất một loại phương tiện được hỗ trợ.");
            return;
        }

        setSubmitting(true);
        setPopupError(null);

        try {
            if (isEditMode) {
                // Update basic text data, slot size, and vehicles concurrently
                await Promise.all([
                    updateFloor(floorData.id, { 
                        floorNumber: Number(floorNumber),
                        name: floorName.trim(), 
                        description: description.trim() 
                    }),
                    updateFloorCapacity(floorData.id, { 
                        totalSlots: Number(totalSlots) 
                    }),
                    updateFloorVehicleTypes(floorData.id, { 
                        vehicleTypeIds: selectedVehicleTypeIds 
                    })
                ]);
            } else {
                // Create a completely new floor
                await createFloor({
                    name: floorName.trim(),
                    floorNumber: Number(floorNumber),
                    totalSlots: Number(totalSlots),
                    description: description.trim(),
                    vehicleTypeIds: selectedVehicleTypeIds
                });
            }

            onRefresh(); // Refresh the main dashboard table rows
            onClose(); // Shut down popup modal
        } catch (err) {
            console.error("Floor payload transaction failure:", err);
            setPopupError(err.message || "Xảy ra lỗi trong quá trình lưu trữ thông tin.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="sci-modal-overlay">
            <div className="sci-modal-container">
                <div className="sci-modal-header">
                    <h3 className="sci-modal-title">
                        {isEditMode ? `Chỉnh Sửa: ${floorName || 'Cấu Hình Tầng'}` : 'Thêm Mới Tầng Đỗ Xe'}
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
                                <label className="sci-form-label">Tên Tầng <span className="sci-required">*</span></label>
                                <input
                                    type="text"
                                    className="sci-form-input"
                                    value={floorName}
                                    onChange={(e) => setFloorName(e.target.value)}
                                    placeholder="Ví dụ: Tầng B1, Tầng G..."
                                    disabled={submitting}
                                />
                            </div>

                            <div className="sci-form-group">
                                <label className="sci-form-label">Số Thứ Tự Tầng <span className="sci-required">*</span></label>
                                <input
                                    type="number"
                                    className="sci-form-input"
                                    value={floorNumber}
                                    onChange={(e) => setFloorNumber(e.target.value)}
                                    min="-5"
                                    max="100"
                                    disabled={isEditMode || submitting} // Lock numeric sequence assignment on update
                                />
                            </div>
                        </div>

                        <div className="sci-form-group">
                            <label className="sci-form-label">Sức Chứa Chỗ Đỗ <span className="sci-required">*</span></label>
                            <input
                                type="number"
                                className="sci-form-input"
                                value={totalSlots}
                                onChange={(e) => setTotalSlots(e.target.value)}
                                min="1"
                                disabled={submitting}
                            />
                        </div>

                        <div className="sci-form-group">
                            <label className="sci-form-label">Loại Xe Cho Phép Đỗ <span className="sci-required">*</span></label>
                            <div className="sci-form-checkbox-group">
                                {vehicleTypes?.map((type) => (
                                    <label key={type.id} className="sci-form-checkbox-label">
                                        <input
                                            type="checkbox"
                                            className="sci-form-checkbox"
                                            checked={selectedVehicleTypeIds.includes(type.id)}
                                            onChange={() => handleVehicleCheckboxChange(type.id)}
                                            disabled={submitting}
                                        />
                                        <span className="sci-form-checkbox-text">{type.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="sci-form-group">
                            <label className="sci-form-label">Mô Tả Chi Tiết</label>
                            <textarea
                                className="sci-form-textarea"
                                rows="3"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ví dụ: Khu vực phân làn xe con tự động..."
                                disabled={submitting}
                            ></textarea>
                        </div>

                        {isEditMode && (
                            <div className="sci-audit-summary">
                                <h4>Thông tin cập nhật</h4>
                                <div className="sci-audit-meta">
                                    <div><strong>Người tạo:</strong> {formatAuditActor(floorData?.createdByName)}</div>
                                    <div><strong>Ngày tạo:</strong> {formatAuditDate(floorData?.createdAt)}</div>
                                    <div><strong>Cập nhật cuối:</strong> {formatAuditActor(floorData?.updatedByName || floorData?.createdByName)}</div>
                                    <div><strong>Thời gian sửa:</strong> {formatAuditDate(floorData?.updatedAt || floorData?.createdAt)}</div>
                                </div>
                            </div>
                        )}
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

export default FloorPopup;