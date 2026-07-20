import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import '../styles/Home.css'
import Navbar from '../components/common/Navbar'
import BookingPopup from '../components/common/BookingPopup'
import { getVehicleTypes, getAvailableSlots, getPricingPreview } from '../services/vehicleTypeService'
import { getMyVehicles } from '../services/vehicleService'
import { getPolicies } from '../services/policyService';
import { getAllPricing } from '../services/pricingService';
import {
  IconCar,
  IconMotorbike,
  IconEbike,
} from '../components/svg/Icons'

function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get('payment');

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: {
      vehicleTypeID: '', // Sẽ được cập nhật động sau khi fetch API
      licensePlate: '',
      scheduledCheckin: ''
    }
  })

  const [loading, setLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [slotStatus, setSlotStatus] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [policies, setPolicies] = useState([]) // State lưu trữ danh sách chính sách vận hành từ API
  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"))

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

  // Khởi tạo dữ liệu trang Home
  useEffect(() => {
    async function initializeHome() {
      try {
        setLoading(true);
        const types = await getVehicleTypes();
        setVehicleTypes(types);

        // Gọi API lấy danh sách chính sách (Policies) để hiển thị động ở dưới trang
        try {
          const fetchedPolicies = await getPolicies();
          // Lọc chỉ lấy các chính sách đang được kích hoạt (isActive === true) nếu backend có trả về trường này
          const activePolicies = (fetchedPolicies || []).filter(p => p.isActive !== false);
          setPolicies(activePolicies);
        } catch (policyErr) {
          console.warn("Không thể tải danh sách chính sách vận hành:", policyErr);
        }

        if (localStorage.getItem("token")) {
          try {
            const myVehicles = await getMyVehicles();
            setVehicles(myVehicles);
          } catch (err) {
            console.error("Failed to load vehicles:", err);
          }
        }

        if (types.length > 0) {
          setSelectedVehicle(types[0].name);
          setValue('vehicleTypeID', types[0].id); // Gán giá trị ID thực tế vào form
        }

        const statusData = await Promise.all(
          types.map(async (type) => {
            // 1. Khởi tạo giá trị mặc định đề phòng API lỗi
            let slots = { totalAvailableSlots: 0, floors: [] };
            let pricing = { pricePerHour: 0, depositAmount: 0 };

            // 2. Gọi API lấy số chỗ trống (Có try/catch riêng)
            try {
              slots = await getAvailableSlots(type.id);
            } catch (slotErr) {
              console.warn(`Không thể tải sơ đồ chỗ cho loại xe ${type.name} (ID: ${type.id}):`, slotErr);
            }

            // 3. Gọi API lấy thông tin giá (Có try/catch riêng)
            try {
              pricing = await getPricingPreview(type.id);
              //pricing = await getAllPricing();
            } catch (pricingErr) {
              console.warn(`Không thể tải bảng giá cho loại xe ${type.name} (ID: ${type.id}):`, pricingErr);
            }

            // Tính tổng số slot trên các tầng dựa trên dữ liệu an toàn thu được
            const totalSlots = (slots.floors || []).reduce((sum, floor) => sum + (floor.totalSlots || 0), 0);

            return {
              ...type,
              available: slots.totalAvailableSlots || 0,
              total: totalSlots,
              floors: slots.floors || [],
              pricePerHour: pricing.pricePerHour || 0,
              deposit: pricing.depositAmount || 0
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

  // Lắng nghe trạng thái đăng nhập
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"))
  }, [])

  // Xử lý phản hồi từ cổng thanh toán (URL query parameters)
  useEffect(() => {
    if (paymentStatus === 'success') {
      alert("Thanh toán thành công!");
      navigate('/bookings');
    } else if (paymentStatus === 'cancel') {
      alert("Giao dịch đã bị hủy.");
      navigate('/', { replace: true });
    }
  }, [paymentStatus, navigate]);

  // Lọc thông tin của tầng dựa trên loại xe đang chọn
  const selectedSlotStatus = slotStatus.find(type => type.name === selectedVehicle)
  const allFloors = (selectedSlotStatus?.floors || []).map(floor => ({
    id: floor.floorId,
    name: floor.floorName,
    badge: floor.hasAvailability ? "Còn chỗ" : "Hết chỗ",
    badgeType: floor.hasAvailability ? "green" : "red",
    tags: [`Tầng ${floor.floorNumber}`],
    total: floor.totalSlots,
    inUse: Math.round(floor.occupiedSlots + floor.reservedSlots),
    available: Math.round(floor.totalSlots - (floor.occupiedSlots + floor.reservedSlots)),
    deposit: selectedSlotStatus?.deposit,
    pricePerHour: selectedSlotStatus?.pricePerHour,
    fillPercent: floor.totalSlots > 0
      ? Math.round((floor.availableSlots / floor.totalSlots) * 100)
      : 0,
    fillColor: floor.availableSlots > 0 ? "#22C55E" : "#EF4444"
  }));

  const selectedType = vehicleTypes.find(x => x.name === selectedVehicle)

  const onSubmit = (data) => {
    console.log("Form Submitted: ", data)
  }

  const handleBookingClick = () => {
    if (!localStorage.getItem("token")) {
      alert("Vui lòng đăng nhập để đặt chỗ.");
      return;
    }

    if (!selectedSlotStatus) {
      alert("Không tìm thấy loại phương tiện")
      return
    }

    if (selectedSlotStatus.available <= 0) {
      alert("Không còn chỗ trống")
      return
    }

    const hasMatchingVehicle = vehicles.some((v) => {
      const typeMatches = v.vehicleTypeName === selectedType.name;
      const isAvailable = v.hasActiveBooking === 'false' || v.hasActiveBooking === false;
      return typeMatches && isAvailable;
    });

    if (!hasMatchingVehicle) {
      alert("Bạn chưa đăng ký phương tiện nào thuộc loại này hoặc phương tiện đã có lịch đặt.");
      return;
    }

    setShowBookingPopup(true)
  }

  if (loading) {
    return <div className="loading-container">Loading...</div>
  }

  return (
    <div className="page-wrapper">
      <Navbar isLoggedIn={isLoggedIn} />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-left">
            <h1 className="hero-title">Đặt chỗ đỗ xe nhanh, tiện lợi</h1>
            <form className="search-card" onSubmit={handleSubmit(onSubmit)}>
              <div className="vehicle-tabs">
                {vehicleTypes.map(vehicle => (
                  <button
                    type="button"
                    key={vehicle.id}
                    className={`vtab ${selectedVehicle === vehicle.name ? 'vtab--active' : ''}`}
                    onClick={() => {
                      setSelectedVehicle(vehicle.name)
                      setValue('vehicleTypeID', vehicle.id) // SỬA: Gán chính xác 'vehicleTypeID' bằng ID của xe
                    }}
                  >
                    {VEHICLE_NAME_MAP[vehicle.name]?.icon}
                    {VEHICLE_NAME_MAP[vehicle.name]?.label || vehicle.name}
                  </button>
                ))}
              </div>

              {/* input ẩn đồng bộ giá trị với React Hook Form */}
              <input type="hidden" {...register('vehicleTypeID')} />

              <button
                type="submit"
                className="btn-book"
                onClick={handleBookingClick}
              >
                Đặt chỗ ngay
              </button>
            </form>
          </div>

          {/* Status Card (Hôm nay) */}
          <div className="status-card">
            <p className="status-card-title">TÌNH TRẠNG HÔM NAY</p>

            {slotStatus.map((type, index) => (
              <div key={type.id}>
                <div className="status-row">
                  <span className="status-vehicle">
                    {VEHICLE_NAME_MAP[type.name]?.icon} {VEHICLE_NAME_MAP[type.name]?.label || type.name}
                  </span>

                  <div className="status-count-group">
                    <span className="status-count">
                      {type.available}/{type.total}
                    </span>
                    <span className="status-unit">chỗ trống</span>
                  </div>
                </div>

                {index < slotStatus.length - 1 && (
                  <div className="status-divider" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floor Status */}
      <section className="floors-section">
        <h2 className="section-title">Tình trạng các tầng đỗ {selectedVehicle}</h2>
        <div className="floor-grid">
          {/* .slice(0, 4) đảm bảo render tối đa 4 card */}
          {allFloors.slice(0, 4).map(floor => (
            <FloorCard
              key={floor.id}
              name={floor.name}
              badge={floor.badge}
              badgeType={floor.badgeType}
              tags={floor.tags}
              available={floor.available}
              inUse={floor.inUse}
              total={floor.total}
              fillPercent={floor.fillPercent}
              fillColor={floor.fillColor}
              FLOOR_TO_VEHICLE_MAP={FLOOR_TO_VEHICLE_MAP}
            />
          ))}
        </div>
      </section>

      {/* Pricing & Operation Policies */}
      <section className="bottom-section">
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

        {/* Khối chính sách vận hành được mở và render data động */}
        <div className="announcements-card">
          <h3 className="card-heading">Chính sách &amp; Quy định vận hành</h3>
          <ul className="announcement-list">
            {policies.length === 0 ? (
              <li className="announcement-item announcement-item--blue">
                <span className="announcement-text">Hệ thống đang cập nhật các quy định vận hành mới nhất.</span>
              </li>
            ) : (
              policies.map((policy) => {
                // Xác định class CSS tương ứng dựa theo độ ưu tiên hoặc loại chính sách nếu có
                // Ở đây mặc định dùng 'announcement-item--blue' hoặc 'announcement-item--yellow' tùy theo nội dung bắt buộc
                const isUrgent = policy.title?.toLowerCase().includes("bảo trì") || policy.title?.toLowerCase().includes("khẩn cấp");
                const itemClass = isUrgent ? "announcement-item--yellow" : "announcement-item--blue";

                return (
                  <li key={policy.id} className={`announcement-item ${itemClass}`}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <strong className="announcement-title" style={{ fontSize: '14px', color: '#1E293B' }}>
                        {policy.title}
                      </strong>
                      <span className="announcement-text">
                        {policy.description || policy.content}
                      </span>
                    </div>
                    <span className="announcement-date">
                      {policy.createdAt ? new Date(policy.createdAt).toLocaleDateString('vi-VN') : ''}
                    </span>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </section>
      {showBookingPopup && (
        <BookingPopup
          selectedVehicle={selectedVehicle}
          vehicleTypes={slotStatus}
          onClose={() => setShowBookingPopup(false)}
        />
      )}
    </div>

  )
}

function FloorCard({ name, badge, badgeType, tags, available, inUse, total, fillPercent, fillColor, FLOOR_TO_VEHICLE_MAP }) {
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
      </div>

      <div className="floor-bar-bg">
        <div className="floor-bar-fill" style={{ width: `${fillPercent}%`, background: fillColor }} />
      </div>
    </div>
  )
}

export default Home