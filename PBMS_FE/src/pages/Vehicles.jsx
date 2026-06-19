import { useState, useEffect } from 'react'
import { getMyVehicles, cancelVehicle, updateVehicle } from '../services/vehicleService'
import { getVehicleTypes } from '../services/vehicleTypeService'
import VehiclePopup from '../components/common/VehiclePopup'
import Navbar from '../components/common/Navbar'
import '../styles/Home.css'
import '../styles/Bookings.css'
import '../styles/BookingPopup.css'
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
  none: {
    label: 'Chưa đăng kí',
    badgeClass: 'badge--upcoming',
    stripClass: 'strip--upcoming',
    dot: '#1B5EF7',
  },
  active: {
    label: 'Đang đặt chỗ',
    badgeClass: 'badge--active',
    stripClass: 'strip--active',
    dot: '#22C55E',
  },

}


// ─── Tab config ────────────────────────────────────────────────
const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang đặt chỗ' },
  { key: 'none', label: 'Chưa đặt chỗ' },
]

// ─── Main Page ─────────────────────────────────────────────────
export default function Vehicles() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  )
  const [showVehiclePopup, setShowVehiclePopup] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicles, setVehicles] = useState([])
  const refreshVehicleList = async () => {
    try {
      const data = await getMyVehicles();

      // Crucial: Re-apply the transformation here so the UI state remains consistent
      const formattedData = data.map(item => ({
        id: item.id,
        status: item.hasActiveBooking ? 'active' : 'none',
        vehicleType: getVehicleIconKey(item.vehicleTypeName), // Keeps icon logic
        vehicleLabel: item.vehicleTypeName,
        vehicleTypeId: item.vehicleTypeId,
        licensePlate: item.licensePlate,
        vehicleImgUrl: item.vehicleImgUrl
      }));

      setVehicles(formattedData);
    } catch (err) {
      console.error("Refresh failed:", err);
    }
  };
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const [vehiclesData, vehicleTypesData] = await Promise.all([
          getMyVehicles(),
          getVehicleTypes()
        ]);
        setVehicleTypes(vehicleTypesData);
        // TRANSFORM the API data to match your component
        const formattedData = vehiclesData.map(item => ({
          id: item.id,
          status: item.hasActiveBooking ? 'active' : 'none',
          vehicleType: getVehicleIconKey(item.vehicleTypeName),
          vehicleLabel: item.vehicleTypeName,
          vehicleTypeId: item.vehicleTypeId,
          licensePlate: item.licensePlate,
          vehicleImgUrl: item.vehicleImgUrl
        }));

        setVehicles(formattedData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching vehicles:", err);
      }
    };

    fetchVehicles();
  }, []);

  const handleCreate = () => {
    setSelectedVehicle(null);
    setShowVehiclePopup(true);
  };
  const handleCancel = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa phương tiện này không?')) return
    try {
      await cancelVehicle(id)
      setVehicles(prev =>
        prev.filter(v => v.id !== id)
      )
    } catch (err) {
      alert(err.message)
    }
  }
  const handleUpdate = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowVehiclePopup(true);
  };

  const counts = {
    all: vehicles.length,
    active: vehicles.filter(v => v.status === 'active').length,
    none: vehicles.filter(v => v.status === 'none').length,
  }

  const filtered = activeTab === 'all'
    ? vehicles
    : vehicles.filter(v => v.status === activeTab)

  // ─── Vehicle Card ──────────────────────────────────────────────
  function ImgModal({ Url, onClose }) {
    return (
      <div className="qr-modal-overlay" onClick={onClose}>
        <div className="vehicle-modal-box" onClick={e => e.stopPropagation()}>
          <button className="qr-modal-close" onClick={onClose}>✕</button>
          <p className="qr-modal-title">Ảnh phương tiện</p>
          <img src={Url} alt="QR phóng to" className="vehicle-modal-image" />
        </div>
      </div>
    )
  }

  function VehicleCard({ vehicle, onCancel }) {
    const status = STATUS_CONFIG[vehicle.status] || STATUS_CONFIG['none'];
    const vehicleIcon = VEHICLE_ICON[vehicle.vehicleType] || VEHICLE_ICON['car'];
    const VEHICLE_NAME_MAP = {
      "Xe máy": "Xe máy",
      "Ô tô": "Ô tô",
      "Xe máy điện": "Xe máy điện"
    };
    return (
      <div className="booking-card">
        <div className={`card-top-strip ${status.stripClass}`} />

        {/* Header */}
        <div className="card-header">
          <span className="booking-id">#{vehicle.id}</span>
          <span className={`status-badge ${status.badgeClass}`}>
            <span className="status-dot" style={{ background: status.dot }} />
            {status.label}
          </span>
        </div>

        {/* Vehicle */}
        <div className="card-vehicle">
          <div className="vehicle-icon-wrap" style={{ background: vehicleIcon.bg }}>
            {vehicleIcon.icon}
          </div>
          <div className="vehicle-info">
            <span className="vehicle-plate">{vehicle.licensePlate}</span>
            <span className="vehicle-type">{VEHICLE_NAME_MAP[vehicle.vehicleLabel] || vehicle.vehicleLabel}</span>
          </div>
        </div>
        {/* Divider */}
        <div className="card-divider" />

        {/* Should display vehicle Img instead */}
        <div className="card-qr">
          <div className="qr-wrap">
            {vehicle.vehicleImgUrl
              ? <img src={vehicle.vehicleImgUrl} alt="Vehicle" className="qr-image" />
              : null
            }
          </div>
          <div className="qr-info">
            <span className="qr-title">Ảnh phương tiện</span>
            <p className="qr-desc">
              Hình ảnh phương tiện đã đăng ký trong hệ thống.
            </p>
            <button
              className="qr-expand-btn"
              onClick={() => vehicle.vehicleImgUrl && setSelectedImageUrl(vehicle.vehicleImgUrl)}
            >
              <IconExpand />
              Phóng to hình ảnh
            </button>
          </div>
        </div>

        {/* Footer actions */}
        <div className="card-footer">
          <button
            className={`btn-action btn-action--outline ${vehicle.status === 'active' ? 'btn-disabled' : ''}`}
            onClick={() => vehicle.status !== 'active' && handleUpdate(vehicle)}
            disabled={vehicle.status === 'active'}
          >
            Chỉnh sửa
          </button>

          <button
            className={`btn-action btn-action--danger ${vehicle.status === 'active' ? 'btn-disabled' : ''}`}
            onClick={() => vehicle.status !== 'active' && onCancel(vehicle.id)}
            disabled={vehicle.status === 'active'}
          >
            Xóa
          </button>
        </div>
      </div>

    )
  }

  return (
    <div className="bookings-page">
      <Navbar isLoggedIn={isLoggedIn} />

      <main className="bookings-main">
        {/* Page header */}
        <div className="bookings-page-header">
          <div className="bookings-title-group">
            <h1 className="bookings-title">Phương tiện của tôi</h1>
            <p className="bookings-subtitle">Quản lý và theo dõi tất cả các phương tiện đã đăng kí</p>
          </div>
          {/* a button to add new vehicle, leading to a VehiclePopup.jsx (not implemented yet) */}
          <button className="booking-submit-btn" onClick={handleCreate}>
            Thêm phương tiện
          </button>
        </div>

        {/* Summary strip */}
        <div className="summary-strip">
          <div className="summary-box">
            <div className="summary-icon summary-icon--green">
              <SummaryActiveIcon />
            </div>
            <div className="summary-text">
              <span className="summary-count summary-count--green">{counts.active}</span>
              <span className="summary-label">Đang đặt chỗ</span>
            </div>
          </div>

          <div className="summary-box">
            <div className="summary-icon summary-icon--gray">
              <SummaryDoneIcon />
            </div>
            <div className="summary-text">
              <span className="summary-count summary-count--gray">{counts.none}</span>
              <span className="summary-label">Chưa đặt chỗ</span>
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
          {filtered.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} onCancel={handleCancel} onUpdate={handleUpdate} />
          ))}
        </div>
      </main>
      {/* --- SINGLE SOURCE OF TRUTH FOR POPUPS --- */}

      {/* 1. Only one Modal for images */}
      {selectedImageUrl && (
        <ImgModal
          Url={selectedImageUrl}
          onClose={() => setSelectedImageUrl(null)}
        />
      )}

      {showVehiclePopup && (
        <VehiclePopup
          vehicle={selectedVehicle}
          vehicleTypes={vehicleTypes}
          onClose={() => setShowVehiclePopup(false)}
          onSave={() => {
            refreshVehicleList();
            setShowVehiclePopup(false);
          }}
        />
      )}
    </div>
  )
}
