import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Navbar from '../components/common/Navbar'
import '../styles/Home.css'
import '../styles/UserProfile.css'

// ─── SVG Icons ───────────────────────────────────────────────
function IconProfile() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 10.0002C11.8409 10.0002 13.3333 8.50779 13.3333 6.66683C13.3333 4.82587 11.8409 3.3335 10 3.3335C8.15905 3.3335 6.66667 4.82587 6.66667 6.66683C6.66667 8.50779 8.15905 10.0002 10 10.0002Z" stroke="#1B5EF7" strokeWidth="1.5"/>
      <path d="M3.33333 16.6668C3.33333 13.3335 6.31667 10.8335 10 10.8335C13.6833 10.8335 16.6667 13.3335 16.6667 16.6668" stroke="#1B5EF7" strokeWidth="1.5"/>
    </svg>
  )
}

function IconHistory() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="#374151" strokeWidth="1.5"/>
      <path d="M9 4.5V9L12 10.5" stroke="#374151" strokeWidth="1.5"/>
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5 6C13.5 4.80653 13.0259 3.66193 12.182 2.81802C11.3381 1.97411 10.1935 1.5 9 1.5C7.80653 1.5 6.66193 1.97411 5.81802 2.81802C4.97411 3.66193 4.5 4.80653 4.5 6C4.5 11.25 2.25 12.75 2.25 12.75H15.75C15.75 12.75 13.5 11.25 13.5 6Z" stroke="#374151" strokeWidth="1.5"/>
      <path d="M10.2976 15.75C10.1658 15.9773 9.97652 16.166 9.74881 16.2971C9.52109 16.4283 9.26292 16.4973 9.00014 16.4973C8.73735 16.4973 8.47918 16.4283 8.25147 16.2971C8.02375 16.166 7.83449 15.9773 7.70264 15.75" stroke="#374151" strokeWidth="1.5"/>
    </svg>
  )
}

function IconSecurity() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 16.5C9 16.5 15 13.5 15 9V3.75L9 1.5L3 3.75V9C3 13.5 9 16.5 9 16.5Z" stroke="#374151" strokeWidth="1.5"/>
    </svg>
  )
}

function IconGuide() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 18.3333C14.6024 18.3333 18.3333 14.6024 18.3333 10C18.3333 5.39763 14.6024 1.66667 10 1.66667C5.39763 1.66667 1.66667 5.39763 1.66667 10C1.66667 14.6024 5.39763 18.3333 10 18.3333Z" stroke="#374151" strokeWidth="1.5"/>
      <path d="M10 13.3333V10M10 6.66667H10.0083" stroke="#374151" strokeWidth="1.5"/>
    </svg>
  )
}

function IconContact() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.5 12.5C17.5 12.942 17.3244 13.3659 17.0118 13.6785C16.6993 13.991 16.2754 14.1667 15.8333 14.1667H5.83333L2.5 17.5V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H15.8333C16.2754 2.5 16.6993 2.67559 17.0118 2.98816C17.3244 3.30072 17.5 3.72464 17.5 4.16667V12.5Z" stroke="#374151" strokeWidth="1.5"/>
    </svg>
  )
}

function IconCar() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.16667 14.1666H2.5V9.99992L4.16667 5.83325H15.8333L17.5 9.99992V14.1666H15.8333" stroke="#1B5EF7" strokeWidth="1.66667"/>
      <path d="M6.25 15.8333C6.94036 15.8333 7.5 15.2736 7.5 14.5833C7.5 13.8929 6.94036 13.3333 6.25 13.3333C5.55964 13.3333 5 13.8929 5 14.5833C5 15.2736 5.55964 15.8333 6.25 15.8333Z" stroke="#1B5EF7" strokeWidth="1.66667"/>
      <path d="M13.75 15.8333C14.4404 15.8333 15 15.2736 15 14.5833C15 13.8929 14.4404 13.3333 13.75 13.3333C13.0596 13.3333 12.5 13.8929 12.5 14.5833C12.5 15.2736 13.0596 15.8333 13.75 15.8333Z" stroke="#1B5EF7" strokeWidth="1.66667"/>
    </svg>
  )
}

function IconMotorbike() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.58333 16.6667C5.73393 16.6667 6.66667 15.7339 6.66667 14.5833C6.66667 13.4327 5.73393 12.5 4.58333 12.5C3.43274 12.5 2.5 13.4327 2.5 14.5833C2.5 15.7339 3.43274 16.6667 4.58333 16.6667Z" stroke="#1B5EF7" strokeWidth="1.66667"/>
      <path d="M15.4168 16.6667C16.5674 16.6667 17.5002 15.7339 17.5002 14.5833C17.5002 13.4327 16.5674 12.5 15.4168 12.5C14.2662 12.5 13.3335 13.4327 13.3335 14.5833C13.3335 15.7339 14.2662 16.6667 15.4168 16.6667Z" stroke="#1B5EF7" strokeWidth="1.66667"/>
      <path d="M6.6665 14.1667H12.4998M8.33317 6.66675H11.6665L13.3332 10.8334H6.6665L8.33317 6.66675Z" stroke="#1B5EF7" strokeWidth="1.66667"/>
      <path d="M8.3335 6.66675V4.16675H11.6668V6.66675" stroke="#1B5EF7" strokeWidth="1.66667"/>
    </svg>
  )
}

// ─── Toggle Switch ────────────────────────────────────────────
function ToggleSwitch({ checked, onChange }) {
  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle-track" />
    </label>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { key: 'profile', label: 'Hồ sơ chung', icon: <IconProfile /> },
  { key: 'history', label: 'Lịch sử', icon: <IconHistory /> },
  //{ key: 'settings', label: 'Cài đặt', icon: <IconSettings /> },
  //{ key: 'security', label: 'Bảo mật', icon: <IconSecurity /> },
]

const SIDEBAR_SUPPORT = [
  { key: 'guide', label: 'Hướng dẫn', icon: <IconGuide /> },
  { key: 'contact', label: 'Liên hệ', icon: <IconContact /> },
]

function ProfileSidebar({ activeKey, onSelect }) {
  return (
    <aside className="profile-sidebar">
      <span className="sidebar-section-label">Danh mục</span>
      <ul className="sidebar-nav">
        {SIDEBAR_ITEMS.map(item => (
          <li
            key={item.key}
            className={`sidebar-nav-item${activeKey === item.key ? ' active' : ''}`}
            onClick={() => onSelect(item.key)}
          >
            {item.icon}
            {item.label}
          </li>
        ))}
      </ul>
      <hr className="sidebar-divider" />
      <span className="sidebar-section-label">Hỗ trợ</span>
      <ul className="sidebar-nav">
        {SIDEBAR_SUPPORT.map(item => (
          <li
            key={item.key}
            className="sidebar-nav-item"
            onClick={() => onSelect(item.key)}
          >
            {item.icon}
            {item.label}
          </li>
        ))}
      </ul>
    </aside>
  )
}

// ─── Vehicle icon selector ────────────────────────────────────
function HistoryVehicleIcon({ type }) {
  if (type === 'motorbike') return <IconMotorbike />
  return <IconCar />
}

// ─── Main Page ────────────────────────────────────────────────
export default function UserProfile({ onLogout, userAvatar, userData, stats, recentHistory, notificationSettings, onSaveProfile, onNotifChange, onChangePassword, onActivate2FA, onManageDevices, onDeleteAccount }) {
  const [activeNav, setActiveNav] = useState('profile')

  const [notifState, setNotifState] = useState(
    notificationSettings ?? {
      reminderBooking: false,
      paymentConfirm: false,
      promotions: false,
      securityAlert: false,
    }
  )

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      fullName: userData?.fullName ?? '',
      dateOfBirth: userData?.dateOfBirth ?? '',
      email: userData?.email ?? '',
      phone: userData?.phone ?? '',
    },
  })

  const historyList = recentHistory ?? []

  const handleNotifToggle = (key) => {
    const updated = { ...notifState, [key]: !notifState[key] }
    setNotifState(updated)
    onNotifChange?.(updated)
  }

  const onSubmit = (data) => {
    onSaveProfile?.(data)
  }

  const handleCancel = () => {
    reset()
  }

  return (
    <div className="profile-page">
      <Navbar isLoggedIn userAvatar={userAvatar} onLogout={onLogout} />

      <div className="profile-layout">
        <ProfileSidebar activeKey={activeNav} onSelect={setActiveNav} />

        <main className="profile-main">
          {/* Page heading */}
          <div>
            <div className="profile-page-header">
              <h1 className="profile-page-title">Hồ Sơ Người Dùng</h1>
              <span className="profile-page-edit-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14.1667 2.49993C14.3856 2.28106 14.6455 2.10744 14.9314 1.98899C15.2173 1.87054 15.5238 1.80957 15.8333 1.80957C16.1429 1.80957 16.4494 1.87054 16.7352 1.98899C17.0211 2.10744 17.281 2.28106 17.5 2.49993C17.7189 2.7188 17.8925 2.97872 18.0109 3.26461C18.1294 3.5505 18.1904 3.85701 18.1904 4.16659C18.1904 4.47618 18.1294 4.78269 18.0109 5.06858C17.8925 5.35447 17.7189 5.61439 17.5 5.83326L6.25 17.0833L1.66667 18.3333L2.91667 13.7499L14.1667 2.49993Z" stroke="#1B5EF7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
            <p className="profile-page-subtitle">Quản lý thông tin cá nhân, phương tiện và cài đặt tài khoản</p>
          </div>

          {/* Stats bar */}
          <div className="profile-stats-bar">
            <div className="stat-card">
              <span className="stat-card-label">Tổng lượt đỗ</span>
              <span className="stat-card-value stat-card-value--blue">
                {stats?.totalVisits ?? '—'}
              </span>
              <span className="stat-card-sub">
                {stats?.monthlyVisits != null ? `Tháng này: ${stats.monthlyVisits} lượt` : ''}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Chi tiêu tháng này</span>
              <span className="stat-card-value stat-card-value--green">
                {stats?.monthlySpending ?? '—'}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Thời gian đỗ tháng này</span>
              <span className="stat-card-value stat-card-value--teal">
                {stats?.monthlyHours ?? '—'}
              </span>
            </div>
          </div>

          {/* Personal info card */}
          <div className="profile-card">
            <h2 className="card-section-title">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 9C10.6569 9 12 7.65685 12 6C12 4.34315 10.6569 3 9 3C7.34315 3 6 4.34315 6 6C6 7.65685 7.34315 9 9 9Z" stroke="#1B5EF7" strokeWidth="1.5"/>
                <path d="M3 15C3 12 5.7 9.75 9 9.75C12.3 9.75 15 12 15 15" stroke="#1B5EF7" strokeWidth="1.5"/>
              </svg>
              Thông tin cá nhân
            </h2>

            <div className="profile-hero">
              {userAvatar ? (
                <img src={userAvatar} alt="avatar" className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 18C20.5 18 22.5 16 22.5 13.5C22.5 11 20.5 9 18 9C15.5 9 13.5 11 13.5 13.5C13.5 16 15.5 18 18 18Z" stroke="#1B5EF7" strokeWidth="2"/>
                    <path d="M6 27C6 22.5 11.4 18.75 18 18.75C24.6 18.75 30 22.5 30 27" stroke="#1B5EF7" strokeWidth="2"/>
                  </svg>
                </div>
              )}
              <div>
                <p className="profile-display-name">{userData?.fullName || ''}</p>
                <p className="profile-display-email">{userData?.email || ''}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="profile-form-row">
                <div className="form-group">
                  <label className="form-label">
                    Họ và tên
                    <span className="form-label-required">(*)</span>
                  </label>
                  <input
                    className={`form-input${errors.fullName ? ' input-error' : ''}`}
                    type="text"
                    {...register('fullName', { required: 'Vui lòng nhập họ và tên' })}
                  />
                  {errors.fullName && <span className="form-error-msg">{errors.fullName.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Ngày sinh</label>
                  <input
                    className="form-input"
                    type="date"
                    {...register('dateOfBirth')}
                  />
                </div>
              </div>

              <div className="profile-form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className={`form-input${errors.email ? ' input-error' : ''}`}
                    type="email"
                    {...register('email', {
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ' },
                    })}
                  />
                  {errors.email && <span className="form-error-msg">{errors.email.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Số điện thoại
                    <span className="form-label-required">(*)</span>
                  </label>
                  <input
                    className={`form-input${errors.phone ? ' input-error' : ''}`}
                    type="tel"
                    {...register('phone', { required: 'Vui lòng nhập số điện thoại' })}
                  />
                  {errors.phone && <span className="form-error-msg">{errors.phone.message}</span>}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save">Lưu thay đổi</button>
                <button type="button" className="btn-cancel" onClick={handleCancel} disabled={!isDirty}>Hủy</button>
                <span className="form-required-note">(*): Trường thông tin bắt buộc điền</span>
              </div>
            </form>
          </div>

          {/* Recent parking history */}
          <div className="profile-card">
            <h2 className="card-section-title">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="#1B5EF7" strokeWidth="1.5"/>
                <path d="M9 4.5V9L12 10.5" stroke="#1B5EF7" strokeWidth="1.5"/>
              </svg>
              Lịch sử đỗ xe gần đây
            </h2>

            {historyList.length === 0 ? (
              <p className="history-empty">Chưa có lịch sử đỗ xe.</p>
            ) : (
              historyList.map((item, idx) => (
                <div key={item.id ?? idx} className="history-item">
                  <div className="hist-icon">
                    <HistoryVehicleIcon type={item.vehicleType} />
                  </div>
                  <div className="hist-info">
                    <p className="hist-floor">{item.floorName}</p>
                    <p className="hist-time">{item.timeLabel}</p>
                  </div>
                  <div className="hist-right">
                    <span className="hist-amount">{item.amount}</span>
                    <span className="badge-done">{item.status}</span>
                  </div>
                </div>
              ))
            )}

            <a href="#" className="history-view-all">Xem toàn bộ lịch sử →</a>
          </div>
            
          {/* Notification settings  Unused?
          <div className="profile-card">
            <h2 className="card-section-title">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.5 6C13.5 4.80653 13.0259 3.66193 12.182 2.81802C11.3381 1.97411 10.1935 1.5 9 1.5C7.80653 1.5 6.66193 1.97411 5.81802 2.81802C4.97411 3.66193 4.5 4.80653 4.5 6C4.5 11.25 2.25 12.75 2.25 12.75H15.75C15.75 12.75 13.5 11.25 13.5 6Z" stroke="#1B5EF7" strokeWidth="1.5"/>
                <path d="M10.2976 15.75C10.1658 15.9773 9.97652 16.166 9.74881 16.2971C9.52109 16.4283 9.26292 16.4973 9.00014 16.4973C8.73735 16.4973 8.47918 16.4283 8.25147 16.2971C8.02375 16.166 7.83449 15.9773 7.70264 15.75" stroke="#1B5EF7" strokeWidth="1.5"/>
              </svg>
              Cài đặt thông báo
            </h2>

            <div className="notif-row">
              <div>
                <p className="notif-label-title">Nhắc nhở đặt chỗ</p>
                <p className="notif-label-desc">Thông báo trước 30 phút khi chỗ đặt sắp hết hạn</p>
              </div>
              <ToggleSwitch
                checked={notifState.reminderBooking}
                onChange={() => handleNotifToggle('reminderBooking')}
              />
            </div>

            <div className="notif-row">
              <div>
                <p className="notif-label-title">Xác nhận thanh toán</p>
                <p className="notif-label-desc">Nhận thông báo sau mỗi giao dịch thành công</p>
              </div>
              <ToggleSwitch
                checked={notifState.paymentConfirm}
                onChange={() => handleNotifToggle('paymentConfirm')}
              />
            </div>

            <div className="notif-row">
              <div>
                <p className="notif-label-title">Thông báo khuyến mãi</p>
                <p className="notif-label-desc">Nhận tin tức ưu đãi và giảm giá mới nhất</p>
              </div>
              <ToggleSwitch
                checked={notifState.promotions}
                onChange={() => handleNotifToggle('promotions')}
              />
            </div>

            <div className="notif-row">
              <div>
                <p className="notif-label-title">Cảnh báo an ninh</p>
                <p className="notif-label-desc">Nhận cảnh báo khi phát hiện hoạt động bất thường</p>
              </div>
              <ToggleSwitch
                checked={notifState.securityAlert}
                onChange={() => handleNotifToggle('securityAlert')}
              />
            </div>
          </div>

          {/* Account security 
          <div className="profile-card">
            <h2 className="card-section-title">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.5C9 16.5 15 13.5 15 9V3.75L9 1.5L3 3.75V9C3 13.5 9 16.5 9 16.5Z" stroke="#1B5EF7" strokeWidth="1.5"/>
              </svg>
              Bảo mật tài khoản
            </h2>

            <div className="security-row">
              <div>
                <p className="security-label-title">Mật khẩu</p>
                <p className="security-label-desc">
                  {userData?.passwordLastUpdated ? `Cập nhật lần cuối: ${userData.passwordLastUpdated}` : ''}
                </p>
              </div>
              <button className="btn-outline-primary" onClick={onChangePassword}>Đổi mật khẩu</button>
            </div>

            <div className="security-row">
              <div>
                <p className="security-label-title">Xác thực 2 bước (2FA)</p>
                <p className="security-label-desc">Bảo vệ tài khoản bằng mã OTP qua SMS hoặc app</p>
              </div>
              <button className="btn-outline-primary" onClick={onActivate2FA}>Kích hoạt</button>
            </div>

            <div className="security-row">
              <div>
                <p className="security-label-title">Thiết bị đã đăng nhập</p>
                <p className="security-label-desc">
                  {userData?.activeDevices != null ? `Đang đăng nhập trên ${userData.activeDevices} thiết bị` : ''}
                </p>
              </div>
              <button className="btn-outline-primary" onClick={onManageDevices}>Quản lý</button>
            </div>

            <div className="security-row">
              <div>
                <p className="security-label-title">Xóa tài khoản</p>
                <p className="security-label-desc">Xóa vĩnh viễn toàn bộ dữ liệu của bạn</p>
              </div>
              <button className="btn-outline-danger" onClick={onDeleteAccount}>Xóa tài khoản</button>
            </div>
          </div>
          */}
        </main>
      </div>
    </div>
  )
}
