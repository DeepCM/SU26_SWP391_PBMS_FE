import { useState, useEffect } from 'react'
import { getMyVehicles, deactivateVehicle, activateVehicle, updateVehicle } from '../services/vehicleService'
import { getVehicleTypes } from '../services/vehicleTypeService'
import VehiclePopup from '../components/common/VehiclePopup'
import Navbar from '../components/common/Navbar'
import '../styles/Home.css'
import '../styles/Bookings.css'
import '../styles/BookingPopup.css'
import '../styles/Table.css'
import {
  IconCar,
  IconMotorbike,
  IconEbike,
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
  if (!vehicleTypeName) return 'car'
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
    label: 'Chưa đặt chỗ',
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
  deactive: {
    label: 'Ngưng hoạt động',
    badgeClass: 'badge--disabled',
    stripClass: 'strip--disabled',
    dot: '#9CA3AF',
  }
}

// ─── Tab config ────────────────────────────────────────────────
const TABS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'active', label: 'Đang đặt chỗ' },
  { key: 'none', label: 'Chưa đặt chỗ' },
  { key: 'deactive', label: 'Ngưng hoạt động' },
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

  // Helper chuyển đổi dữ liệu từ API
  const formatVehicles = (data) => data.map(item => ({
    id: item.id,
    status: item.hasActiveBooking ? 'active' : 'none',
    vehicleType: getVehicleIconKey(item.vehicleTypeName),
    vehicleLabel: item.vehicleTypeName,
    vehicleTypeId: item.vehicleTypeId,
    licensePlate: item.licensePlate,
    vehicleImgUrl: item.vehicleImgUrl,
    isActive: item.isActive ?? true,
    hasActiveBooking: item.hasActiveBooking ?? false
  }));

  const refreshVehicleList = async () => {
    try {
      const data = await getMyVehicles();
      const formattedData = formatVehicles(data);
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
        const formattedData = formatVehicles(vehiclesData);
        setVehicles(formattedData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching vehicles:", err);
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  const handleCreate = () => {
    setSelectedVehicle(null);
    setShowVehiclePopup(true);
  };

  const handleUpdate = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowVehiclePopup(true);
  };

  // Xử lý Ngưng hoạt động / Kích hoạt lại
  const handleToggleActive = async (vehicle) => {
    if (vehicle.isActive) {
      if (vehicle.hasActiveBooking || vehicle.status === 'active') {
        alert('Xe đang có booking hoặc lượt đỗ chưa hoàn tất, không thể ngưng hoạt động!');
        return;
      }

      if (!window.confirm(`Bạn có chắc muốn ngưng hoạt động xe ${vehicle.licensePlate} không?`)) return;

      try {
        await deactivateVehicle(vehicle.id);
        await refreshVehicleList();
      } catch (err) {
        alert(err.message || 'Không thể ngưng hoạt động xe. Vui lòng kiểm tra lại!');
      }
    } else {
      if (!window.confirm(`Bạn có chắc muốn kích hoạt lại xe ${vehicle.licensePlate} không?`)) return;

      try {
        await activateVehicle(vehicle.id);
        await refreshVehicleList();
      } catch (err) {
        alert(err.message || 'Không thể kích hoạt lại xe!');
      }
    }
  };

  // Thống kê số lượng từng loại
  const counts = {
    all: vehicles.length,
    active: vehicles.filter(v => v.isActive && v.status === 'active').length,
    none: vehicles.filter(v => v.isActive && v.status === 'none').length,
    deactive: vehicles.filter(v => !v.isActive).length,
  }

  // Lọc theo Tab & Sắp xếp: Xe ngưng hoạt động luôn nằm ở cuối cùng
  const getFilteredAndSortedVehicles = () => {
    let list = [];
    if (activeTab === 'all') {
      list = vehicles;
    } else if (activeTab === 'active') {
      list = vehicles.filter(v => v.isActive && v.status === 'active');
    } else if (activeTab === 'none') {
      list = vehicles.filter(v => v.isActive && v.status === 'none');
    } else if (activeTab === 'deactive') {
      list = vehicles.filter(v => !v.isActive);
    }

    // Ưu tiên xe isActive === true lên trước, isActive === false xuống cuối
    return [...list].sort((a, b) => {
      if (a.isActive === b.isActive) return 0;
      return a.isActive ? -1 : 1;
    });
  };

  const filtered = getFilteredAndSortedVehicles();

  // ─── Modal phóng to ảnh ────────────────────────────────────────
  function ImgModal({ Url, onClose }) {
    return (
      <div className="qr-modal-overlay" onClick={onClose}>
        <div className="vehicle-modal-box" onClick={e => e.stopPropagation()}>
          <button className="qr-modal-close" onClick={onClose}>✕</button>
          <p className="qr-modal-title">Ảnh phương tiện</p>
          <img src={Url} alt="Ảnh phương tiện" className="vehicle-modal-image" />
        </div>
      </div>
    )
  }

  // ─── Vehicle Card Component ───────────────────────────────────
  function VehicleCard({ vehicle, onToggleActive, onUpdate }) {
    const isDeactive = !vehicle.isActive;
    const statusKey = isDeactive ? 'deactive' : vehicle.status;
    const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG['none'];
    const vehicleIcon = VEHICLE_ICON[vehicle.vehicleType] || VEHICLE_ICON['car'];

    const VEHICLE_NAME_MAP = {
      "Xe máy": "Xe máy",
      "Ô tô": "Ô tô",
      "Xe máy điện": "Xe máy điện"
    };

    return (
      <div 
        className={`booking-card ${isDeactive ? 'booking-card--deactive' : ''}`}
        style={isDeactive ? { opacity: 0.65, backgroundColor: '#f8fafc', filter: 'grayscale(35%)' } : {}}
      >
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

        {/* Vehicle Image */}
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
            className={`btn-action btn-action--outline ${(vehicle.status === 'active' || isDeactive) ? 'btn-disabled' : ''}`}
            onClick={() => vehicle.status !== 'active' && !isDeactive && onUpdate(vehicle)}
            disabled={vehicle.status === 'active' || isDeactive}
          >
            Chỉnh sửa
          </button>

          {vehicle.isActive ? (
            <button
              className={`btn-action btn-action--danger ${vehicle.hasActiveBooking ? 'btn-disabled' : ''}`}
              onClick={() => !vehicle.hasActiveBooking && onToggleActive(vehicle)}
              disabled={vehicle.hasActiveBooking}
              title={vehicle.hasActiveBooking ? 'Xe đang có booking không thể ngưng hoạt động' : ''}
            >
              Ngưng hoạt động
            </button>
          ) : (
            <button
              className="btn-action btn-action--outline"
              onClick={() => onToggleActive(vehicle)}
              style={{ color: '#22C55E', borderColor: '#22C55E' }}
            >
              Kích hoạt lại
            </button>
          )}
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

          <div className="summary-box">
            <div className="summary-icon" style={{ background: '#F3F4F6', color: '#6B7280' }}>
              <SummaryUpcomingIcon />
            </div>
            <div className="summary-text">
              <span className="summary-count" style={{ color: '#6B7280' }}>{counts.deactive}</span>
              <span className="summary-label">Ngưng hoạt động</span>
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
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Đang tải danh sách phương tiện...</div>
        ) : (
          <div className="bookings-grid">
            {filtered.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
                Không tìm thấy phương tiện nào.
              </div>
            ) : (
              filtered.map(vehicle => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onToggleActive={handleToggleActive}
                  onUpdate={handleUpdate}
                />
              ))
            )}
          </div>
        )}
      </main>

      {/* Popups */}
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