import { useState } from 'react';
import { createUser, updateUser, resetUserPassword } from '../../services/adminService';

const UserPopup = ({ userData, onClose, onRefresh }) => {
    const isEditMode = !!userData;

    const [fullName, setFullName] = useState(userData?.fullName || '');
    const [email, setEmail] = useState(userData?.email || '');
    
    // Safely default to lowercase 'user'
    const [role, setRole] = useState(userData?.role?.toLowerCase() || 'user');
    
    const isActive = userData?.isActive ?? true; 

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [popupError, setPopupError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!fullName.trim()) {
            setPopupError("Vui lòng nhập họ và tên.");
            return;
        }
        if (!email.trim()) {
            setPopupError("Vui lòng nhập email.");
            return;
        }

        if (!isEditMode) {
            if (!password.trim()) {
                setPopupError("Mật khẩu là bắt buộc khi tạo tài khoản mới.");
                return;
            }
            if (password !== confirmPassword) {
                setPopupError("Mật khẩu xác nhận không khớp.");
                return;
            }
        } else {
            if ((password.trim() || confirmPassword.trim()) && password !== confirmPassword) {
                setPopupError("Mật khẩu xác nhận không khớp.");
                return;
            }
        }

        setSubmitting(true);
        setPopupError(null);

        try {
            if (isEditMode) {
                const updatePayload = {
                    fullName: fullName.trim(),
                    email: email.trim(),
                    role: role, // Now safely lowercase
                    isActive: isActive
                };
                await updateUser(userData.id, updatePayload);

                if (password.trim()) {
                    await resetUserPassword(userData.id, {
                        password: password.trim(),
                        confirmPassword: confirmPassword.trim()
                    });
                }
            } else {
                const createPayload = {
                    fullName: fullName.trim(),
                    email: email.trim(),
                    password: password,
                    confirmPassword: confirmPassword,
                    role: role, // Now safely lowercase
                    isActive: false
                };
                await createUser(createPayload);
            }

            onRefresh();
            onClose();
        } catch (err) {
            console.error("User transaction failed:", err);
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
                        {isEditMode ? `Tài Khoản: ${userData?.fullName}` : 'Thêm Mới Tài Khoản'}
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
                                <label className="sci-form-label">Họ và Tên <span className="sci-required">*</span></label>
                                <input
                                    type="text"
                                    className="sci-form-input"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Ví dụ: Nguyễn Văn An"
                                    disabled={submitting}
                                />
                            </div>

                            <div className="sci-form-group">
                                <label className="sci-form-label">Email <span className="sci-required">*</span></label>
                                <input
                                    type="email"
                                    className="sci-form-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="an.nguyen@example.com"
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        <div className="sci-form-grid-2col">
                            <div className="sci-form-group">
                                <label className="sci-form-label">Vai Trò (Role) <span className="sci-required">*</span></label>
                                <select
                                    className="sci-form-input"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    disabled={submitting}
                                >
                                    {/* All lowercase values matching backend */}
                                    <option value="user">Người Dùng (User)</option>
                                    <option value="staff">Nhân Viên (Staff)</option>
                                    <option value="manager">Quản Lý (Manager)</option>
                                    <option value="admin">Quản Trị Viên (Admin)</option>
                                </select>
                            </div>

                            <div className="sci-form-group">
                                <label className="sci-form-label">
                                    {isEditMode ? "Mật Khẩu Mới" : "Mật Khẩu"} 
                                    {!isEditMode && <span className="sci-required"> *</span>}
                                </label>
                                <input
                                    type="password"
                                    className="sci-form-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={isEditMode ? "Để trống nếu không đổi" : "Nhập mật khẩu khởi tạo"}
                                    disabled={submitting}
                                />
                            </div>
                        </div>

                        <div className="sci-form-grid-2col">
                            <div className="sci-form-group">
                                {/* Layout balancing spacer */}
                            </div>

                            <div className="sci-form-group">
                                <label className="sci-form-label">
                                    Xác Nhận Mật Khẩu 
                                    {!isEditMode && <span className="sci-required"> *</span>}
                                </label>
                                <input
                                    type="password"
                                    className="sci-form-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder={isEditMode ? "Để trống nếu không đổi" : "Nhập lại mật khẩu"}
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

export default UserPopup;