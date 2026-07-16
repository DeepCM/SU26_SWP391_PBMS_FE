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

const UserPopup = ({ userData, onClose, onRefresh }) => {
    const isEditMode = !!userData;
    const [showPassword, setShowPassword] = useState(false);

    // SỬA LỖI 1: Đồng bộ hóa kiểu chữ thường (lowercase) để khớp hoàn toàn với select option
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
            // KHI TẠO MỚI: Bắt buộc nhập mật khẩu đủ mạnh
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
            // SỬA LỖI 2: KHI CHỈNH SỬA - Chỉ kiểm tra độ dài và trùng khớp NẾU người dùng nhập mật khẩu mới
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
                // HÀNH ĐỘNG 1: Cập nhật thông tin cơ bản
                const updatePayload = {
                    fullName: fullName.trim(),
                    email: email.trim(),
                    role: role,
                    isActive: isActive
                };
                await updateUser(userData.id, updatePayload);

                // HÀNH ĐỘNG 2: Đồng bộ vai trò hệ thống nếu có thay đổi công tác
                if (role !== userData.role?.toLowerCase()) {
                    await updateUserRole(userData.id, { role: role });
                }

                // HÀNH ĐỘNG 3: Đồng bộ trạng thái hoạt động qua endpoint chuyên biệt
                if (isActive !== userData.isActive) {
                    if (isActive) {
                        await activateUser(userData.id);
                    } else {
                        await deactivateUser(userData.id);
                    }
                }

                // HÀNH ĐỘNG 4: Xử lý thay đổi mật khẩu (Chỉ gửi API reset khi có nhập mật khẩu mới)
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
                                        disabled={submitting}
                                    >
                                        <option value="true">Hoạt Động (Active)</option>
                                        <option value="false">Tạm Khóa (Inactive)</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* HÀNG 3: Mật khẩu mới và Xác nhận mật khẩu */}
                        <div className="sci-form-grid-2col">
                            <div className="sci-form-group">
                                <label className="sci-form-label">
                                    {isEditMode ? "Mật Khẩu Mới" : "Mật Khẩu"}
                                    {!isEditMode && <span className="sci-required"> *</span>}
                                </label>

                                {/* Cấu trúc cực kỳ sạch sẽ, không có inline-style */}
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

                                {/* Cấu trúc cực kỳ sạch sẽ, không có inline-style */}
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