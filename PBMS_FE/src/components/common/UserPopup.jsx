import { useState } from 'react';
import {
    createUser,
    updateUser,
    resetUserPassword,
    updateUserRole,
    activateUser,
    deactivateUser
} from '../../services/adminService';
import {
    IconEye
} from '../../components/svg/Icons'
import { formatAuditActor, formatAuditDate } from '../../utils/auditFormatters';

const UserPopup = ({ userData, onClose, onRefresh }) => {
    const isEditMode = !!userData;
    const [showPassword, setShowPassword] = useState(false);

    // Giả lập lấy thông tin Admin đang đăng nhập từ hệ thống (thường lưu ở localStorage hoặc Redux/AuthContext)
    const getCurrentAdminId = () => {
        try {
            const auth = JSON.parse(localStorage.getItem('auth') || '{}');
            return auth?.user?.id || null; // Trả về ID của admin đang thao tác
        } catch (e) {
            return null;
        }
    };

    const currentAdminId = getCurrentAdminId();

    const getInitialRole = () => {
        const rawRole = userData?.role?.name || userData?.role || 'user';
        return rawRole.toLowerCase();
    };

    const [fullName, setFullName] = useState(userData?.fullName || '');
    const [email, setEmail] = useState(userData?.email || '');
    const [role, setRole] = useState(getInitialRole());
    const [isActive, setIsActive] = useState(userData?.isActive ?? true);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [popupError, setPopupError] = useState(null);

    const ROLE_MAP = {
        admin: 'Quản trị viên',
        manager: 'Quản lý',
        staff: 'Nhân viên',
        driver: 'Người dùng',
    };

    // Regex kiểm tra định dạng email tiêu chuẩn
    const validateEmail = (emailStr) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(emailStr);
    };

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
        
        // 1. KIỂM TRA ĐỊNH DẠNG EMAIL
        if (!validateEmail(email.trim())) {
            setPopupError("Định dạng email không hợp lệ (Ví dụ đúng: ten@domain.com).");
            return;
        }

        // 2. NGĂN CẢN ADMIN TỰ VÔ HIỆU HÓA HOẶC ĐỔI TRẠNG THÁI SANG INACTIVE
        if (isEditMode && String(userData.id) === String(currentAdminId) && !isActive) {
            setPopupError("Bạn không thể tự vô hiệu hóa tài khoản quản trị của chính mình.");
            return;
        }

        if (!isEditMode) {
            if (!password.trim()) {
                setPopupError("Mật khẩu là bắt buộc khi tạo tài khoản mới.");
                return;
            }
            if (password.trim().length < 8) {
                setPopupError("Mật khẩu phải có ít nhất 8 ký tự.");
                return;
            }
            if (password !== confirmPassword) {
                setPopupError("Mật khẩu xác nhận không khớp.");
                return;
            }
        } else {
            const hasPasswordInput = password.trim() !== '';
            const hasConfirmInput = confirmPassword.trim() !== '';

            if (hasPasswordInput || hasConfirmInput) {
                if (password !== confirmPassword) {
                    setPopupError("Mật khẩu xác nhận không khớp.");
                    return;
                }
                if (password.trim().length < 8) {
                    setPopupError("Mật khẩu mới phải có ít nhất 8 ký tự.");
                    return;
                }
            }
        }

        setSubmitting(true);
        setPopupError(null);

        try {
            if (isEditMode) {
                const updatePayload = {
                    fullName: fullName.trim(),
                    email: email.trim(),
                    role: role,
                    isActive: isActive
                };
                await updateUser(userData.id, updatePayload);

                if (role !== userData.role?.toLowerCase()) {
                    await updateUserRole(userData.id, { role: role });
                }

                if (isActive !== userData.isActive) {
                    if (isActive) {
                        await activateUser(userData.id);
                    } else {
                        await deactivateUser(userData.id);
                    }
                }

                if (password.trim()) {
                    await resetUserPassword(userData.id, {
                        newPassword: password.trim(),
                        confirmPassword: confirmPassword.trim()
                    });
                }
            } else {
                const createPayload = {
                    fullName: fullName.trim(),
                    email: email.trim(),
                    password: password,
                    confirmPassword: confirmPassword,
                    role: role,
                    isActive: true
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

                        {/* HÀNG 1: Họ tên và Vai trò */}
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
                                <label className="sci-form-label">Vai Trò (Role) <span className="sci-required">*</span></label>
                                <select
                                    className="sci-form-input"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    disabled={submitting}
                                >
                                    <option value="">-- Chọn vai trò --</option>
                                    {Object.entries(ROLE_MAP).map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* HÀNG 2: Email & Trạng Thái */}
                        <div className="sci-form-grid-2col">
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

                            {isEditMode && (
                                <div className="sci-form-group">
                                    <label className="sci-form-label">Trạng Thái Hoạt Động <span className="sci-required">*</span></label>
                                    <select
                                        className="sci-form-input"
                                        value={isActive ? "true" : "false"}
                                        onChange={(e) => setIsActive(e.target.value === "true")}
                                        disabled={submitting || String(userData.id) === String(currentAdminId)} // Disable không cho chuyển nếu là chính mình
                                    >
                                        <option value="true">Hoạt Động (Active)</option>
                                        <option value="false">Tạm Khóa (Inactive)</option>
                                    </select>
                                    {String(userData.id) === String(currentAdminId) && (
                                        <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>
                                            Bạn không thể tự khóa tài khoản của chính mình.
                                        </small>
                                    )}
                                </div>
                            )}
                        </div>

                        {isEditMode && (
                            <div className="sci-audit-summary">
                                <h4>Thông tin tài khoản</h4>
                                <div className="sci-audit-meta">
                                    <div><strong>Người tạo:</strong> {formatAuditActor(userData?.createdByName || (userData?.createdBy ? `#${userData.createdBy}` : null), 'Tự đăng ký')}</div>
                                    <div><strong>Ngày tạo:</strong> {formatAuditDate(userData?.createdAt, '—')}</div>
                                    <div><strong>Cập nhật cuối:</strong> {formatAuditActor(userData?.updatedByName || userData?.createdByName, 'Chưa có cập nhật')}</div>
                                    <div><strong>Thời gian sửa:</strong> {formatAuditDate(userData?.updatedAt || userData?.createdAt, '—')}</div>
                                </div>
                            </div>
                        )}

                        {/* HÀNG 3: Mật khẩu */}
                        <div className="sci-form-grid-2col">
                            <div className="sci-form-group">
                                <label className="sci-form-label">
                                    {isEditMode ? "Mật Khẩu Mới" : "Mật Khẩu"}
                                    {!isEditMode && <span className="sci-required"> *</span>}
                                </label>
                                <div className="sci-password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="sci-form-input"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={isEditMode ? "Để trống nếu không đổi" : "Nhập mật khẩu khởi tạo"}
                                        disabled={submitting}
                                    />
                                    <button
                                        type="button"
                                        className="login-eye-btn"
                                        onClick={() => setShowPassword(v => !v)}
                                        aria-label="Toggle password visibility"
                                    >
                                        <IconEye />
                                    </button>
                                </div>
                            </div>

                            <div className="sci-form-group">
                                <label className="sci-form-label">
                                    Xác Nhận Mật Khẩu
                                    {!isEditMode && <span className="sci-required"> *</span>}
                                </label>
                                <div className="sci-password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="sci-form-input"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder={isEditMode ? "Để trống nếu không đổi" : "Nhập lại mật khẩu"}
                                        disabled={submitting}
                                    />
                                    <button
                                        type="button"
                                        className="login-eye-btn"
                                        onClick={() => setShowPassword(v => !v)}
                                        aria-label="Toggle password visibility"
                                    >
                                        <IconEye />
                                    </button>
                                </div>
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