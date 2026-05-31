import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import '../styles/Home.css'
import Navbar from '../components/common/Navbar'
import BookingPopup from '../components/common/BookingPopup'

function Home({ onNavigateToLogin }) {

  const navigate = useNavigate();
  const [parkingData, setParkingData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState('Ô tô')
  const [showBookingPopup, setShowBookingPopup] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      vehicleType: 'Ô tô',
      entryTime: ''
    }
  })
  const onSubmit = (data) => {
    console.log(data)
  }

  useEffect(() => {
    async function fetchHomeData() {
      try {
        const response = await fetch('') //need API
        const data = await response.json()

        setParkingData(data)
      } catch (error) {
        console.error('Failed to fetch home data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHomeData()
  }, [])
  if (loading) {
    return <div>Loading...</div>
  }
  return (
    <div className="page-wrapper">
      {/* Navbar */}
      <Navbar
        isLoggedIn={false}
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
                {['Ô tô', 'Xe máy', 'Xe đạp điện'].map(vehicle => (
                  <button
                    type="button"
                    key={vehicle}
                    className={`vtab ${selectedVehicle === vehicle
                      ? 'vtab--active'
                      : ''
                      }`}
                    onClick={() => {
                      setSelectedVehicle(vehicle)
                      setValue('vehicleType', vehicle)
                    }}
                  >
                    {vehicle}
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
                onClick={() => setShowBookingPopup(true)}
              >
                Đặt chỗ ngay
              </button>
            </form>
            {showBookingPopup && (
              <BookingPopup
                selectedVehicle={selectedVehicle}
                onClose={() => setShowBookingPopup(false)}
              />
            )}
          </div>

          <div className="status-card">
            <p className="status-card-title">TÌNH TRẠNG HÔM NAY</p>
            <div className="status-row">
              <span className="status-vehicle">Ô tô</span>
              <div className="status-count-group">
                <span className="status-count">
                  {parkingData?.carStatus?.available}/
                  {parkingData?.carStatus?.total}
                </span>
                <span className="status-unit">chỗ trống</span>
              </div>
            </div>
            <div className="status-divider" />
            <div className="status-row">
              <span className="status-vehicle">Xe máy/<br />đạp điện</span>
              <div className="status-count-group">
                <span className="status-count">
                  {parkingData?.bikeStatus?.available}/
                  {parkingData?.bikeStatus?.total}
                </span>
                <span className="status-unit">chỗ trống</span>
              </div>
            </div>
          </div>
        </div>
      </section >

      {/* Floor Status */}
      < section className="floors-section" >
        <h2 className="section-title">Tình trạng các tầng đỗ xe</h2>
        <div className="floor-grid">
          {parkingData?.floors?.map(floor => (
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
                <th>2 giờ đầu</th>
                <th>Mỗi giờ thêm</th>
              </tr>
            </thead>
            <tbody>
              {parkingData?.pricing?.map((item, index) => (
                <tr key={index}>
                  <td>{item.vehicle}</td>
                  <td>{item.firstHours}</td>
                  <td>{item.extraHours}</td>
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

function FloorCard({ name, badge, badgeType, tags, available, inUse, total, fillPercent, fillColor }) {
  return (
    <div className="floor-card">
      <div className="floor-card-header">
        <span className="floor-name">{name}</span>
        <span className={`floor-badge floor-badge--${badgeType}`}>{badge}</span>
      </div>
      <div className="floor-tags">
        {tags.map(t => <span key={t} className="floor-tag">{t}</span>)}
      </div>
      <div className="floor-stats">
        <div className="floor-stat">
          <span className="floor-stat-number">{available}</span>
          <span className="floor-stat-label">Còn trống</span>
        </div>
        <div className="floor-stat">
          <span className="floor-stat-number">{inUse}</span>
          <span className="floor-stat-label">Đang dùng</span>
        </div>
        <div className="floor-stat">
          <span className="floor-stat-number">{total}</span>
          <span className="floor-stat-label">Tổng chỗ</span>
        </div>
      </div>
      <div className="floor-bar-bg">
        <div className="floor-bar-fill" style={{ width: `${fillPercent}%`, background: fillColor }} />
      </div>
    </div>
  )
}

export default Home
