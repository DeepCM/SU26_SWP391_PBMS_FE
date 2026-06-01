import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyBookings } from '../services/bookingService'
import Navbar from '../components/common/Navbar'
import '../styles/Home.css'
import '../styles/Bookings.css'

// ─── SVG Icons ────────────────────────────────────────────────
function IconCar() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.16667 14.1667H2.5V10L4.16667 5.83337H15.8333L17.5 10V14.1667H15.8333" stroke="#1B5EF7" strokeWidth="1.66667" />
      <path d="M6.25 15.8334C6.94036 15.8334 7.5 15.2737 7.5 14.5834C7.5 13.893 6.94036 13.3334 6.25 13.3334C5.55964 13.3334 5 13.893 5 14.5834C5 15.2737 5.55964 15.8334 6.25 15.8334Z" stroke="#1B5EF7" strokeWidth="1.66667" />
      <path d="M13.75 15.8334C14.4404 15.8334 15 15.2737 15 14.5834C15 13.893 14.4404 13.3334 13.75 13.3334C13.0596 13.3334 12.5 13.893 12.5 14.5834C12.5 15.2737 13.0596 15.8334 13.75 15.8334Z" stroke="#1B5EF7" strokeWidth="1.66667" />
    </svg>
  )
}

function IconMotorbike() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.58333 16.6667C5.73393 16.6667 6.66667 15.7339 6.66667 14.5833C6.66667 13.4327 5.73393 12.5 4.58333 12.5C3.43274 12.5 2.5 13.4327 2.5 14.5833C2.5 15.7339 3.43274 16.6667 4.58333 16.6667Z" stroke="#F97316" strokeWidth="1.66667" />
      <path d="M15.4168 16.6667C16.5674 16.6667 17.5002 15.7339 17.5002 14.5833C17.5002 13.4327 16.5674 12.5 15.4168 12.5C14.2662 12.5 13.3335 13.4327 13.3335 14.5833C13.3335 15.7339 14.2662 16.6667 15.4168 16.6667Z" stroke="#F97316" strokeWidth="1.66667" />
      <path d="M6.6665 14.1666H12.4998M8.33317 6.66663H11.6665L13.3332 10.8333H6.6665L8.33317 6.66663Z" stroke="#F97316" strokeWidth="1.66667" />
      <path d="M8.3335 6.66663V4.16663H11.6668V6.66663" stroke="#F97316" strokeWidth="1.66667" />
    </svg>
  )
}

function IconEbike() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.00016 16.6666C5.92064 16.6666 6.66683 15.9204 6.66683 14.9999C6.66683 14.0794 5.92064 13.3333 5.00016 13.3333C4.07969 13.3333 3.3335 14.0794 3.3335 14.9999C3.3335 15.9204 4.07969 16.6666 5.00016 16.6666Z" stroke="#22C55E" strokeWidth="1.66667" />
      <path d="M15.0002 16.6666C15.9206 16.6666 16.6668 15.9204 16.6668 14.9999C16.6668 14.0794 15.9206 13.3333 15.0002 13.3333C14.0797 13.3333 13.3335 14.0794 13.3335 14.9999C13.3335 15.9204 14.0797 16.6666 15.0002 16.6666Z" stroke="#22C55E" strokeWidth="1.66667" />
      <path d="M5 15H15M6.66667 10L8.33333 5H11.6667L13.3333 10" stroke="#22C55E" strokeWidth="1.66667" />
      <path d="M10 5V2.5" stroke="#22C55E" strokeWidth="1.66667" />
    </svg>
  )
}

function IconEye() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0.541504 6.50008C0.541504 6.50008 2.70817 2.16675 6.49984 2.16675C10.2915 2.16675 12.4582 6.50008 12.4582 6.50008C12.4582 6.50008 10.2915 10.8334 6.49984 10.8334C2.70817 10.8334 0.541504 6.50008 0.541504 6.50008Z" stroke="white" strokeWidth="1.35417" />
      <path d="M6.5 8.125C7.39746 8.125 8.125 7.39746 8.125 6.5C8.125 5.60254 7.39746 4.875 6.5 4.875C5.60254 4.875 4.875 5.60254 4.875 6.5C4.875 7.39746 5.60254 8.125 6.5 8.125Z" stroke="white" strokeWidth="1.35417" />
    </svg>
  )
}

function IconExpand() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.5 4.5V1.5H7.5M10.5 1.5L7 5M1.5 7.5V10.5H4.5M1.5 10.5L5 7" stroke="#1B5EF7" strokeWidth="1.25" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z" stroke="#6B7280" />
      <path d="M6 3V6L8 7" stroke="#6B7280" />
    </svg>
  )
}

function IconPin() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7.5 1.25C5 1.25 3.125 3.125 3.125 5.625C3.125 8.90625 7.5 13.75 7.5 13.75C7.5 13.75 11.875 8.90625 11.875 5.625C11.875 3.125 10 1.25 7.5 1.25Z" stroke="#1B5EF7" strokeWidth="1.25" />
      <path d="M7.5 7.1875C8.36294 7.1875 9.0625 6.48794 9.0625 5.625C9.0625 4.76206 8.36294 4.0625 7.5 4.0625C6.63706 4.0625 5.9375 4.76206 5.9375 5.625C5.9375 6.48794 6.63706 7.1875 7.5 7.1875Z" stroke="#1B5EF7" strokeWidth="1.25" />
    </svg>
  )
}

function IconArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.1665 10H15.8332" stroke="#6B7280" strokeWidth="1.5" />
      <path d="M10.8335 5L15.8335 10L10.8335 15" stroke="#6B7280" strokeWidth="1.5" />
    </svg>
  )
}

// ─── QR Placeholder ───────────────────────────────────────────
function QRPlaceholder() {
  return (
    <div className="qr-placeholder">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="16" height="16" rx="2" stroke="#d1d5db" strokeWidth="2" fill="none" />
        <rect x="8" y="8" width="8" height="8" rx="1" fill="#d1d5db" />
        <rect x="28" y="4" width="16" height="16" rx="2" stroke="#d1d5db" strokeWidth="2" fill="none" />
        <rect x="32" y="8" width="8" height="8" rx="1" fill="#d1d5db" />
        <rect x="4" y="28" width="16" height="16" rx="2" stroke="#d1d5db" strokeWidth="2" fill="none" />
        <rect x="8" y="32" width="8" height="8" rx="1" fill="#d1d5db" />
        <rect x="28" y="28" width="4" height="4" fill="#d1d5db" />
        <rect x="36" y="28" width="4" height="4" fill="#d1d5db" />
        <rect x="28" y="36" width="4" height="4" fill="#d1d5db" />
        <rect x="36" y="36" width="4" height="4" fill="#d1d5db" />
        <rect x="32" y="32" width="4" height="4" fill="#d1d5db" />
      </svg>
    </div>
  )
}

// ─── Vehicle icon mapper ───────────────────────────────────────
const VEHICLE_ICON = {
  car: { icon: <IconCar />, bg: '#EAF0FF' },
  motorbike: { icon: <IconMotorbike />, bg: '#FFEDD5' },
  ebike: { icon: <IconEbike />, bg: '#DCFCE7' },
}

// ─── Status config ─────────────────────────────────────────────
const STATUS_CONFIG = {
  active: {
    label: 'Đang diễn ra',
    badgeClass: 'badge--active',
    stripClass: 'strip--active',
    dot: '#22C55E',
  },
  upcoming: {
    label: 'Sắp diễn ra',
    badgeClass: 'badge--upcoming',
    stripClass: 'strip--upcoming',
    dot: '#1B5EF7',
  },
  done: {
    label: 'Hoàn tất',
    badgeClass: 'badge--done',
    stripClass: 'strip--done',
    dot: '#9CA3AF',
  },
}

// ─── Booking Card ──────────────────────────────────────────────
function BookingCard({ booking }) {
  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG['active'];
  const vehicle = VEHICLE_ICON[booking.vehicleType] || VEHICLE_ICON['car'];

  return (
    <div className="booking-card">
      <div className={`card-top-strip ${status.stripClass}`} />

      {/* Header */}
      <div className="card-header">
        <span className="booking-id">#{booking.id}</span>
        <span className={`status-badge ${status.badgeClass}`}>
          <span className="status-dot" style={{ background: status.dot }} />
          {status.label}
        </span>
      </div>

      {/* Vehicle */}
      <div className="card-vehicle">
        <div className="vehicle-icon-wrap" style={{ background: vehicle.bg }}>
          {vehicle.icon}
        </div>
        <div className="vehicle-info">
          <span className="vehicle-plate">{booking.licensePlate}</span>
          <span className="vehicle-type">{booking.vehicleLabel}</span>
        </div>
      </div>

      {/* Times */}
      <div className="card-times">
        <div className="time-block">
          <span className="time-label">Giờ vào</span>
          <span className="time-value">{booking.entryTime}</span>
          <span className="time-date">{booking.entryDate}</span>
        </div>
        <div className="time-arrow">
          <IconArrow />
        </div>

      </div>

      {/* Location */}
      <div className="card-location">
        <IconPin />
        <span>{booking.location}</span>
      </div>

      {/* Divider */}
      <div className="card-divider" />

      {/* QR */}
      <div className="card-qr">
        <div className="qr-wrap">
          {booking.qrUrl
            ? <img src={booking.qrUrl} alt="QR" className="qr-image" />
            : <QRPlaceholder />
          }
        </div>
        <div className="qr-info">
          <span className="qr-title">Mã QR Check-in</span>
          <p className="qr-desc">Xuất trình mã này tại cổng vào bãi để check-in tự động.</p>
          <button className="qr-expand-btn">
            <IconExpand />
            Phóng to mã QR
          </button>
        </div>
      </div>

      {/* Footer actions */}
      <div className="card-footer">
        {booking.status === 'active' && (
          <>
            <button className="btn-action btn-action--blue">
              <IconEye /> Xem QR
            </button>
            <button className="btn-action btn-action--outline">⏱ Gia hạn</button>
            <button className="btn-action btn-action--danger">Hủy</button>
          </>
        )}
        {booking.status === 'upcoming' && (
          <>
            <button className="btn-action btn-action--blue">
              <IconEye /> Xem QR
            </button>
            <button className="btn-action btn-action--outline">✏️ Sửa</button>
            <button className="btn-action btn-action--danger">Hủy</button>
          </>
        )}
        {booking.status === 'done' && (
          <>
            <button className="btn-action btn-action--outline">🔄 Đặt lại</button>
            <button className="btn-action btn-action--outline">🧾 Hóa đơn</button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Tab config ────────────────────────────────────────────────
const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang diễn ra' },
  { key: 'upcoming', label: 'Sắp tới' },
  { key: 'done', label: 'Đã xong' },
]

// ─── Main Page ─────────────────────────────────────────────────
export default function Bookings() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  )
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true) // Add loading state
  // Replace with API call when available
  const [bookings, setBookings] = useState([])
  useEffect(() => {
    const fetchBookings = async () => {
      try { // <--- Added missing opening brace here
        const data = await getMyBookings();

        // TRANSFORM the API data to match your component
        const formattedData = data.map(item => ({
          id: item.id,
          status: item.status.toLowerCase(),
          vehicleType: item.vehicleTypeName.toLowerCase(),
          vehicleLabel: item.vehicleTypeName,
          licensePlate: item.licensePlate,
          // Only keep entry information
          entryTime: new Date(item.scheduledCheckin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          entryDate: new Date(item.scheduledCheckin).toLocaleDateString(),
          location: `Tầng ${item.floorNumber}`,
          qrUrl: item.qrCodeImage
        }));

        setBookings(formattedData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      }
    };

    fetchBookings();
  }, []);
  const counts = {
    all: bookings.length,
    active: bookings.filter(b => b.status === 'active').length,
    upcoming: bookings.filter(b => b.status === 'upcoming').length,
    done: bookings.filter(b => b.status === 'done').length,
  }

  const filtered = activeTab === 'all'
    ? bookings
    : bookings.filter(b => b.status === activeTab)

  return (
    <div className="bookings-page">
      <Navbar isLoggedIn={isLoggedIn} />

      <main className="bookings-main">
        {/* Page header */}
        <div className="bookings-page-header">
          <div className="bookings-title-group">
            <h1 className="bookings-title">Đặt chỗ của tôi</h1>
            <p className="bookings-subtitle">Quản lý và theo dõi tất cả các lượt đặt chỗ đỗ xe</p>
          </div>
          {/*
          <button className="btn-new-booking" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3.33337V12.6667" stroke="white" strokeWidth="1.66667" />
              <path d="M3.3335 8H12.6668" stroke="white" strokeWidth="1.66667" />
            </svg>
            Đặt chỗ mới
          </button>
          */}
        </div>

        {/* Summary strip */}
        <div className="summary-strip">
          <div className="summary-box">
            <div className="summary-icon summary-icon--green">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.75 9L8.25 10.5L11.25 7.5" stroke="#22C55E" strokeWidth="1.65" />
                <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="#22C55E" strokeWidth="1.65" />
              </svg>
            </div>
            <div className="summary-text">
              <span className="summary-count summary-count--green">{counts.active}</span>
              <span className="summary-label">Đang diễn ra</span>
            </div>
          </div>

          <div className="summary-box">
            <div className="summary-icon summary-icon--blue">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z" stroke="#1B5EF7" strokeWidth="1.65" />
                <path d="M9 4.5V9L12 10.5" stroke="#1B5EF7" strokeWidth="1.65" />
              </svg>
            </div>
            <div className="summary-text">
              <span className="summary-count summary-count--blue">{counts.upcoming}</span>
              <span className="summary-label">Sắp tới</span>
            </div>
          </div>

          <div className="summary-box">
            <div className="summary-icon summary-icon--gray">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.5 8.31002V9.00002C16.4991 10.6173 15.9754 12.191 15.007 13.4864C14.0386 14.7818 12.6775 15.7294 11.1265 16.1879C9.57557 16.6465 7.91794 16.5914 6.40085 16.031C4.88376 15.4705 3.58849 14.4346 2.70822 13.0778C1.82795 11.721 1.40984 10.1161 1.51626 8.50226C1.62267 6.88844 2.24791 5.35227 3.29871 4.12283C4.34951 2.89338 5.76959 2.03656 7.34714 1.68013C8.92469 1.3237 10.5752 1.48677 12.0525 2.14502" stroke="#6B7280" strokeWidth="1.65" />
                <path d="M16.5 3L9 10.5075L6.75 8.2575" stroke="#6B7280" strokeWidth="1.65" />
              </svg>
            </div>
            <div className="summary-text">
              <span className="summary-count summary-count--gray">{counts.done}</span>
              <span className="summary-label">Đã hoàn tất</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="booking-tabs">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`booking-tab ${activeTab === tab.key ? 'booking-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className={`tab-count ${activeTab === tab.key ? 'tab-count--active' : ''}`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Cards grid */}
        <div className="bookings-grid">
          {filtered.map(booking => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      </main>
    </div>
  )
}
