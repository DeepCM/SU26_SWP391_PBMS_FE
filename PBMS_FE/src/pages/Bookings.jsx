import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyBookings, cancelBooking } from '../services/bookingService'
import Navbar from '../components/common/Navbar'
import '../styles/Home.css'
import '../styles/Bookings.css'
import {
  IconCar,
  IconMotorbike,
  IconEbike,
  IconEye,
  IconExpand,
  IconClock,
  IconPin,
  IconArrow,
  QRPlaceholder,
  SummaryActiveIcon,
  SummaryUpcomingIcon,
  SummaryDoneIcon
} from '../components/svg/Icons'

// ─── Helpers ──────────────────────────────────────────────────
function mapBookingStatus(status) {
  switch (status) {
    case 'pending_payment': return 'upcoming'
    case 'pending':
    case 'confirmed': return 'active'
    case 'cancelled':
    case 'expired': return 'done'
    default: return 'upcoming'
  }
}

function getVehicleIconKey(vehicleTypeName) {
  const name = vehicleTypeName.toLowerCase()
  if (name.includes('ô tô') || name.includes('car') || name.includes('xe hơi')) return 'car'
  if (name.includes('điện') || name.includes('ebike') || name.includes('electric')) return 'ebike'
  if (name.includes('máy') || name.includes('motorbike') || name.includes('motor')) return 'motorbike'
  return 'car'
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

// ─── QR Modal ─────────────────────────────────────────────────
function QRModal({ qrUrl, onClose }) {
  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-box" onClick={e => e.stopPropagation()}>
        <button className="qr-modal-close" onClick={onClose}>✕</button>
        <p className="qr-modal-title">Mã QR Check-in</p>
        <img src={qrUrl} alt="QR phóng to" className="qr-modal-image" />
        <p className="qr-modal-hint">Xuất trình mã này tại cổng vào để check-in</p>
      </div>
    </div>
  )
}

// ─── Booking Card ──────────────────────────────────────────────
function BookingCard({ booking, onCancel }) {
  const [showQR, setShowQR] = useState(false)
  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG['active'];
  const vehicle = VEHICLE_ICON[booking.vehicleType] || VEHICLE_ICON['car'];
  const VEHICLE_NAME_MAP = {
    "Xe máy": "Xe máy",
    "Ô tô": "Ô tô",
    "Xe đạp": "Xe máy điện"
    
  };
  return (
    <div className="booking-card">
      {showQR && booking.qrUrl && <QRModal qrUrl={booking.qrUrl} onClose={() => setShowQR(false)} />}
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
          <span className="vehicle-type">{VEHICLE_NAME_MAP[booking.vehicleLabel] || booking.vehicleLabel}</span>
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
          <button className="qr-expand-btn" onClick={() => booking.qrUrl && setShowQR(true)}>
            <IconExpand />
            Phóng to mã QR
          </button>
        </div>
      </div>

      {/* Footer actions */}
      <div className="card-footer">
        {booking.status === 'active' && (
          <>
            <button className="btn-action btn-action--blue" onClick={() => booking.qrUrl && setShowQR(true)}>
              <IconEye /> Xem QR
            </button>
            <button className="btn-action btn-action--outline">⏱ Gia hạn</button>
            <button className="btn-action btn-action--danger" onClick={() => onCancel(booking.id)}>Hủy</button>
          </>
        )}
        {booking.status === 'upcoming' && (
          <>
            <button className="btn-action btn-action--blue" onClick={() => booking.qrUrl && setShowQR(true)}>
              <IconEye /> Xem QR
            </button>
            <button className="btn-action btn-action--outline">✏️ Sửa</button>
            <button className="btn-action btn-action--danger" onClick={() => onCancel(booking.id)}>Hủy</button>
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
          status: mapBookingStatus(item.status),
          vehicleType: getVehicleIconKey(item.vehicleTypeName),
          vehicleLabel: item.vehicleTypeName,
          licensePlate: item.licensePlate,
          // Only keep entry information
          entryTime: new Date(item.scheduledCheckin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          entryDate: new Date(item.scheduledCheckin).toLocaleDateString(),
          location: `Tầng ${item.floorNumber}`,
          qrUrl: item.qrCodeImage ? `data:image/png;base64,${item.qrCodeImage}` : null
        }));

        setBookings(formattedData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching bookings:", err);
      }
    };

    fetchBookings();
  }, []);
  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc muốn hủy đặt chỗ này không?')) return
    try {
      await cancelBooking(id)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'done' } : b))
    } catch (err) {
      alert(err.message)
    }
  }

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
          
        </div>

        {/* Summary strip */}
        <div className="summary-strip">
          <div className="summary-box">
            <div className="summary-icon summary-icon--green">
              <SummaryActiveIcon />
            </div>
            <div className="summary-text">
              <span className="summary-count summary-count--green">{counts.active}</span>
              <span className="summary-label">Đang diễn ra</span>
            </div>
          </div>

          <div className="summary-box">
            <div className="summary-icon summary-icon--blue">
              <SummaryUpcomingIcon />
            </div>
            <div className="summary-text">
              <span className="summary-count summary-count--blue">{counts.upcoming}</span>
              <span className="summary-label">Sắp tới</span>
            </div>
          </div>

          <div className="summary-box">
            <div className="summary-icon summary-icon--gray">
              <SummaryDoneIcon />
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
            <BookingCard key={booking.id} booking={booking} onCancel={handleCancel} />
          ))}
        </div>
      </main>
    </div>
  )
}
