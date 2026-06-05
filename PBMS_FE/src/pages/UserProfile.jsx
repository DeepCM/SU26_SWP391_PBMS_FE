import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { getUser } from "../services/authService"
import Navbar from '../components/common/Navbar'
import '../styles/Home.css'
import '../styles/UserProfile.css'
import { IconProfile, IconHistory, IconEdit, IconGuide, IconContact, IconCar, IconMotorbike } from '../components/svg/Icons'

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
export default function UserProfile({ onLogout, userAvatar, stats, recentHistory, notificationSettings, onSaveProfile, onNotifChange, onChangePassword, onActivate2FA, onManageDevices, onDeleteAccount }) {
  const [activeNav, setActiveNav] = useState('profile')
  const userData = getUser()
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
      fullName: '',
      email: '',
      phone: '',
    },
  })
  
  useEffect(() => {
    if (userData) {
      reset({
        fullName: userData.fullName ?? '',
        email: userData.email ?? '',
        phone: userData.phone ?? '',
      })
    }
  }, [userData, reset])


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
                <IconEdit />
              </span>
            </div>
            <p className="profile-page-subtitle">Quản lý thông tin cá nhân, phương tiện và cài đặt tài khoản</p>
          </div>

          {/* Stats bar */}
          <div className="profile-stats-bar">
            <div className="stat-card">
              <span className="stat-card-label">Tổng lượt đỗ</span>
              <span className="stat-card-value stat-card-value--blue">
                {stats?.totalVisits ?? '0'}
              </span>
              <span className="stat-card-sub">
                {stats?.monthlyVisits != null ? `Tháng này: ${stats.monthlyVisits} lượt` : ''}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Chi tiêu tháng này</span>
              <span className="stat-card-value stat-card-value--green">
                {stats?.monthlySpending ?? '0'}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-card-label">Thời gian đỗ tháng này</span>
              <span className="stat-card-value stat-card-value--teal">
                {stats?.monthlyHours ?? '0'}
              </span>
            </div>
          </div>

          {/* Personal info card */}
          <div className="profile-card">
            <h2 className="card-section-title">
              <img
                src="./src/assets/userAvatar.png"
                alt="avatar"
                className="navbar-avatar"
              />
              Thông tin cá nhân
            </h2>
            {/*
            <div className="profile-hero">

              <div>
                <p className="profile-display-name">{user?.fullName || ''}</p>
                <p className="profile-display-email">{user?.email || ''}</p>
              </div>
            </div>
            */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="profile-form-row">
                <div className="form-group">
                  <label className="form-label">
                    Họ và tên,
                    <span className="form-label-required">(*)</span>
                  </label>

                  <input
                    className={`form-input${errors.fullName ? ' input-error' : ''}`}
                    type="text"
                    placeholder={userData?.fullName || ''}
                    {...register('fullName', { required: 'Vui lòng nhập họ và tên' })}
                  />
                  {errors.fullName && <span className="form-error-msg">{errors.fullName.message}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email
                    <span className="form-label-required">(*)</span>
                  </label>
                  <input
                    placeholder={userData?.email || ''}
                    className={`form-input${errors.email ? ' input-error' : ''}`}
                    {...register('email', {
                      required: 'Vui lòng nhập email',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Email không hợp lệ'
                      }
                    })}
                  />
                  {errors.email && <span className="form-error-msg">{errors.email.message}</span>}
                </div>
              </div>

              <div className="profile-form-row">
                {/* 
                <div className="form-group">
                  <label className="form-label">Ngày sinh</label>
                  <input
                    className="form-input"
                    type="date"
                    {...register('dateOfBirth')}
                  />
                </div>
                */}

                <div className="form-group">
                  <label className="form-label">
                    Số điện thoại
                  </label>
                  <input
                    placeholder={userData?.phone || ''}
                    className={`form-input${errors.phone ? ' input-error' : ''}`}
                    type="tel"
                    {...register('phone', {
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: 'Số điện thoại không hợp lệ'
                      }
                    })}
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
              <IconHistory />
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
