import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getUser } from '../../services/authService'
import {
  CarIcon,
  AlertIcon,
  BookIcon,
  PhoneIcon,
  ChartIcon,
  UsersIcon,
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../svg/SidebarIcons'
import '../../styles/CheckIn.css'

const STAFF_ITEMS = [
  { path: '/checkin', label: 'Check-in', Icon: CarIcon },
  { path: '/checkout', label: 'Check-out', Icon: CarIcon },
  { path: '/incidents', label: 'Xử lý sự cố', Icon: AlertIcon },
  { path: '/parking-history', label: 'Lịch sử', Icon: ClockIcon },
]

const STAFF_SUPPORT_ITEMS = [
  { path: '/guide', label: 'Hướng dẫn', Icon: BookIcon },
  { path: '/contact-manager', label: 'Liên hệ quản lý', Icon: PhoneIcon },
]

const MANAGER_ITEMS = [
  { path: '/dashboard', label: 'Thống kê', Icon: ChartIcon },
  { path: '/manager?tab=pricing', label: 'Bảng giá', Icon: BookIcon }, // Chuyển hướng thẳng tới tab bảng giá
  { path: '/manager?tab=incidents', label: 'Sự cố', Icon: AlertIcon },  // Chuyển hướng thẳng tới tab sự cố
  { path: '/reviews', label: 'Nhận phản hồi', Icon: AlertIcon },
  { path: '/parking-history', label: 'Lịch sử', Icon: ClockIcon },
]

// Định nghĩa menu Admin tương ứng với từng bảng
const ADMIN_ITEMS = [
  { path: '/admin?tab=users', label: 'Người dùng', Icon: UsersIcon },
  { path: '/admin?tab=policies', label: 'Chính sách', Icon: BookIcon },
  { path: '/admin?tab=floors', label: 'Sơ đồ tầng', Icon: SettingsIcon },
  { path: '/admin?tab=vehicle-types', label: 'Loại xe', Icon: CarIcon },
]

const STORAGE_KEY = 'sidebar-collapsed'

function SidebarSection({ title, items, currentPath, onNavigate, collapsed }) {
  return (
    <>
      {title && !collapsed && <p className="sci-section-label">{title}</p>}
      <ul className="sci-sidebar-list">
        {items.map((item) => {
          const { Icon } = item
          return (
            <li
              key={item.path + item.label}
              className={`sci-sidebar-item ${currentPath === item.path ? 'sci-sidebar-item--active' : ''} ${collapsed ? 'sci-sidebar-item--collapsed' : ''}`}
              onClick={() => onNavigate(item.path)}
              title={collapsed ? item.label : undefined}
            >
              <span className="sci-sidebar-icon-wrap">
                <span className="sci-sidebar-icon">
                  <Icon />
                </span>
                {collapsed && item.badge != null && (
                  <span className="sci-incident-badge--dot" />
                )}
              </span>
              {!collapsed && <span className="sci-sidebar-label">{item.label}</span>}
              {!collapsed && item.badge != null && (
                <span className="sci-incident-badge">{item.badge}</span>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getUser()

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  const role = user?.role?.toLowerCase()
  const isAdmin = role === 'admin'
  const isManager = role === 'manager'
  const isStaff = role === 'staff'

  const handleNavigate = (path) => navigate(path)

  const items = isAdmin ? ADMIN_ITEMS : isManager ? MANAGER_ITEMS : isStaff ? STAFF_ITEMS : null

  if (!items) return null

  // Đọc đầy đủ cả Pathname và Search Query (ví dụ: "/admin?tab=users") để làm nổi bật menu tương ứng
  const currentFullUrl = location.pathname + location.search

  // Nếu người dùng chỉ vào "/admin" trống không, tự động làm sáng tab "Người dùng" làm mặc định
  const activeHighlightPath = currentFullUrl === '/admin' ? '/admin?tab=users' : currentFullUrl

  return (
    <aside className={`sci-sidebar ${collapsed ? 'sci-sidebar--collapsed' : ''}`}>
      <button
        type="button"
        className="sci-sidebar-toggle"
        onClick={toggleCollapsed}
        title={collapsed ? 'Mở rộng' : 'Thu gọn'}
      >
        {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </button>

      <SidebarSection
        title="CHỨC NĂNG"
        items={items}
        currentPath={activeHighlightPath}
        onNavigate={handleNavigate}
        collapsed={collapsed}
      />

      {isStaff && (
        <SidebarSection
          title="HỖ TRỢ"
          items={STAFF_SUPPORT_ITEMS}
          currentPath={activeHighlightPath}
          onNavigate={handleNavigate}
          collapsed={collapsed}
        />
      )}
    </aside>
  )
}

export default Sidebar