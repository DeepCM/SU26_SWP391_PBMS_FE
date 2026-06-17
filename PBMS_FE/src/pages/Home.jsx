import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import '../styles/Home.css'
import Navbar from '../components/common/Navbar'
import BookingPopup from '../components/common/BookingPopup'
import { getVehicleTypes, getAvailableSlots, getPricingPreview } from '../services/vehicleTypeService'
import { getMyBookings } from '../services/bookingService'
import { getMyVehicles } from '../services/vehicleService'
import { } from '../services/paymentService'
import {
  IconCar,
  IconMotorbike,
  IconEbike,
  IconEye,
  IconExpand,
  IconClock,
  IconPin,
  IconArrow,
} from '../components/svg/Icons'
function Home({ }) {

  const navigate = useNavigate();
  const { register, handleSubmit, setValue, watch
  } = useForm({
    defaultValues: {
      vehicleTypeID: 'Xe máy',
      licensePlate: '',
      scheduledCheckin: ''
    }
  })

  const [loading, setLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [vehicleTypes, setVehicleTypes] = useState([])
  const VEHICLE_NAME_MAP = {
    "Xe máy": {
      icon: <IconMotorbike />,
      label: " Xe máy"
    },
    "Xe máy điện": {
      icon: <IconEbike />,
      label: " Xe máy điện"
    },
    "Ô tô": {
      icon: <IconCar />,
      label: " Ô tô"
    }

  };

  const FLOOR_TO_VEHICLE_MAP = {
    "Tầng B1": " - Xe máy",
    "Tầng B2": " - Xe máy điện",
    "Tầng B3": " - Ô tô"
  };
  const [slotStatus, setSlotStatus] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [parkingData, setParkingData] = useState(true)
  useEffect(() => {
    async function initializeHome() {
      try {
        setLoading(true);
        const types = await getVehicleTypes();
        setVehicleTypes(types);

        if (localStorage.getItem("token")) {
          try {
            const vehicles = await getMyVehicles();
            setVehicles(vehicles);
          } catch (err) {
            console.error("Failed to load vehicles:", err);
          }
        }
        if (types.length > 0) {
          setSelectedVehicle(types[0].name);
          setValue('vehicleTypeID', types[0].id);
        }

        const statusData = await Promise.all(
          types.map(async (type) => {
            const slots = await getAvailableSlots(type.id);
            const pricing = await getPricingPreview(type.id);

            // Calculate the total across all floors
            const totalSlots = slots.floors.reduce((sum, floor) => sum + floor.totalSlots, 0);

            return {
              ...type,
              available: slots.totalAvailableSlots,
              total: totalSlots, // Use the calculated sum
              floors: slots.floors,
              pricePerHour: pricing.pricePerHour,
              deposit: pricing.depositAmount
            };
          })
        );
        setSlotStatus(statusData);
      } catch (err) {
        console.error("Failed to load init data:", err);
      } finally {
        setLoading(false);
      }
    }
    initializeHome();
  }, [setValue]);

  const selectedSlotStatus = slotStatus.find(type => type.name === selectedVehicle)
  const allFloors = (selectedSlotStatus?.floors || []).map(floor => ({
    id: floor.floorId,
    name: floor.floorName,
    badge: floor.hasAvailability ? "Còn chỗ" : "Hết chỗ",
    badgeType: floor.hasAvailability ? "green" : "red",
    tags: [`Tầng ${floor.floorNumber}`],
    available: floor.availableSlots,
    inUse: Math.round(((floor.occupiedSlots) + (floor.reservedSlots))),
    total: floor.totalSlots,
    deposit: selectedSlotStatus?.deposit,
    pricePerHour: selectedSlotStatus?.pricePerHour,
    fillPercent: floor.totalSlots > 0
      ? Math.round(
        ((floor.availableSlots) / floor.totalSlots) * 100
      )
      : 0,
    fillColor: floor.availableSlots > 0 ? "#22C55E" : "#EF4444"
  }));

  const selectedType = vehicleTypes.find(
    x => x.name === selectedVehicle
  )
  const [pendingBooking, setPendingBooking] = useState(null);
  const [showBookingPopup, setShowBookingPopup] = useState(false);

  const handleProceedToPayment = (bookingData) => {
    setPendingBooking(bookingData); // Save the data collected from BookingPopup
    setShowBookingPopup(false);
  };
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  )

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"))
  }, [])

  const onSubmit = (data) => {
    console.log(data)
  }
  const handleBookingClick = () => {
    if (!selectedSlotStatus) {
      alert("Không tìm thấy loại phương tiện")
      return
    }

    if (selectedSlotStatus.available <= 0) {
      alert("Không còn chỗ trống")
      return
    }

    if (!localStorage.getItem("token")) {
      alert("Vui lòng đăng nhập để đặt chỗ.");
      return;
    }
    const hasMatchingVehicle = vehicles.some((v) => {
      const typeMatches = v.vehicleTypeName === selectedType.name;
      const isAvailable = v.hasActiveBooking === 'false' || v.hasActiveBooking === false;
      return typeMatches && isAvailable;
    });
    
    if (!hasMatchingVehicle) {
      alert("Bạn chưa có phương tiện nào thuộc loại này hoặc phương tiện đã có lịch đặt.");
      return;
    }

    setShowBookingPopup(true)
  }

  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get('payment');

  useEffect(() => {
    if (paymentStatus === 'success') {
      // 1. Show success alert/popup
      alert("Thanh toán thành công!");
      // 2. Redirect to bookings page
      navigate('/bookings');
    } else if (paymentStatus === 'cancel') {
      // Show local state alert instead of redirecting
      alert("Giao dịch đã bị hủy.");
      // Optional: Clean the URL
      navigate('/', { replace: true });
    }
  }, [paymentStatus, navigate]);

  if (loading) {
    return <div>Loading...</div>
  }
  return (
    <div className="page-wrapper">
      {/* Navbar */}
      <Navbar
        isLoggedIn={isLoggedIn}
      />

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-left">
            <h1 className="hero-title">Đặt chỗ đỗ xe nhanh, tiện lợi</h1>
            <form
              className="search-card"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="vehicle-tabs">
                {vehicleTypes.map(vehicle => (
                  <button
                    type="button"
                    key={vehicle.id}
                    className={`vtab ${selectedVehicle === vehicle.name
                      ? 'vtab--active'
                      : ''
                      }`}
                    onClick={() => {
                      setSelectedVehicle(vehicle.name)
                      setValue('vehicleType', vehicle.name)
                    }}
                  >
                    {VEHICLE_NAME_MAP[vehicle.name].icon}
                    {VEHICLE_NAME_MAP[vehicle.name].label || vehicle.name}

                    <input
                      type="hidden"
                      {...register('vehicleType')}
                    />
                  </button>
                ))}
              </div>
              {/*
              <div className="time-row">
                <div className="time-field">
                  <span className="time-label">Giờ vào</span>
                  <span className="time-value">
                    {parkingData?.entryTime || ''}
                  </span>
                </div>
              </div>
                  */}
              <button
                type="submit"
                className="btn-book"
                onClick={handleBookingClick}
              >
                Đặt chỗ ngay
              </button>
            </form>
            {showBookingPopup && (
              <BookingPopup
                selectedVehicle={selectedVehicle}
                vehicleTypes={slotStatus}
                onClose={() => setShowBookingPopup(false)}
              />
            )}
          </div>

          <div className="status-card">
            <p className="status-card-title">TÌNH TRẠNG HÔM NAY</p>

            {slotStatus.map((type, index) => (
              <div key={type.id}>
                <div className="status-row">
                  <span className="status-vehicle">
                    {VEHICLE_NAME_MAP[type.name].icon} {VEHICLE_NAME_MAP[type.name].label || type.vehicleType}
                  </span>

                  <div className="status-count-group">
                    <span className="status-count">
                      {type.available}/{type.total}
                    </span>

                    <span className="status-unit">
                      chỗ trống
                    </span>
                  </div>
                </div>

                {index < slotStatus.length - 1 && (
                  <div className="status-divider" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* Floor Status */}
      < section className="floors-section" >
        <h2 className="section-title">Tình trạng các tầng đỗ xe</h2>
        <div className="floor-grid">
          {allFloors.map(floor => (
            <FloorCard
              key={floor.id}
              name={floor.name}
              badge={floor.badge}
              badgeType={floor.badgeType}
              tags={floor.tags}
              available={floor.available}
              inUse={floor.inUse}
              total={floor.total}
              deposit={floor.deposit}
              pricePerHour={floor.pricePerHour}
              fillPercent={floor.fillPercent}
              fillColor={floor.fillColor}
              FLOOR_TO_VEHICLE_MAP={FLOOR_TO_VEHICLE_MAP}
            />
          ))}
        </div>
      </section >

      {/* Bottom Row */}
      < section className="bottom-section" >
        <div className="pricing-card">
          <h3 className="card-heading">Bảng giá vé lượt</h3>
          <table className="pricing-table">
            <thead>
              <tr>
                <th>Phương tiện</th>
                <th>Giá cọc</th>
                <th>Mỗi giờ</th>
              </tr>
            </thead>
            <tbody>
              {slotStatus.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.deposit?.toLocaleString()} VNĐ</td>
                  <td>{item.pricePerHour?.toLocaleString()} VNĐ</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="announcements-card">
          <h3 className="card-heading">Thông báo &amp; vận hành</h3>
          <ul className="announcement-list">
            <li className="announcement-item announcement-item--blue">
              <span className="announcement-text">Tầng 1 mở cửa 24/7, có camera an ninh toàn bộ khu vực.</span>
              <span className="announcement-date">12/05/2026</span>
            </li>
            <li className="announcement-item announcement-item--blue">
              <span className="announcement-text">Đang phát triển vé tháng giảm giá 10% trong tháng 6.</span>
              <span className="announcement-date">08/05/2026</span>
            </li>
            <li className="announcement-item announcement-item--yellow">
              <span className="announcement-text">Bảo trì hệ thống đặt chỗ, quý khách thông cảm cho sự bất tiện.</span>
              <span className="announcement-date">01/05/2026</span>
            </li>
          </ul>
        </div>
      </section >
    </div >
  )
}

function FloorCard({ name, badge, badgeType, tags, available, inUse, total, deposit, pricePerHour, fillPercent, fillColor, FLOOR_TO_VEHICLE_MAP }) {

  return (
    <div className="floor-card">
      <div className="floor-card-header">
        <span className="floor-name">{name}{FLOOR_TO_VEHICLE_MAP[name] || ''}</span>
        <span className={`floor-badge floor-badge--${badgeType}`}>{badge}</span>
      </div>
      <div className="floor-tags">
        {tags.map(t => <span key={t} className="floor-tag">{t}</span>)}
      </div>
      <div className="floor-stats">
        <div className="floor-stat">
          <span className="floor-stat-number">{total}</span>
          <span className="floor-stat-label">Tổng chỗ</span>
        </div>
        <div className="floor-stat">
          <span className="floor-stat-number">{available}</span>
          <span className="floor-stat-label">Còn trống</span>
        </div>
        <div className="floor-stat">
          <span className="floor-stat-number">{inUse}</span>
          <span className="floor-stat-label">Đang dùng</span>
        </div>

        <div className="floor-stat">
          <span className="floor-stat-number">{deposit?.toLocaleString()} VNĐ</span>
          <span className="floor-stat-label">Giá cọc</span>
        </div>
        <div className="floor-stat">
          <span className="floor-stat-number">{pricePerHour?.toLocaleString()} VNĐ</span>
          <span className="floor-stat-label">Giá mỗi giờ</span>
        </div>
      </div>
      <div className="floor-bar-bg">
        <div className="floor-bar-fill" style={{ width: `${fillPercent}%`, background: fillColor }} />
      </div>
    </div>
  )
}

export default Home
