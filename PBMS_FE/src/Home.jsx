import './Home.css'

function Home({ onNavigateToLogin }) {
  return (
    <div className="page-wrapper">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <span className="nav-logo">PBMS</span>
          <ul className="nav-links">
            <li><a href="#">Tổng quan</a></li>
            <li><a href="#">Đặt chỗ</a></li>
            <li><a href="#">Hỗ trợ</a></li>
            <li><a href="#">Hướng dẫn</a></li>
            <li><a href="#">Liên hệ</a></li>
            <li><a href="#">Giới thiệu</a></li>
          </ul>
          <button className="btn-login" onClick={onNavigateToLogin}>Đăng nhập</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-left">
            <h1 className="hero-title">Đặt chỗ đỗ xe nhanh, tiện lợi</h1>

            <div className="search-card">
              <div className="vehicle-tabs">
                <button className="vtab vtab--active">Ô tô</button>
                <button className="vtab">Xe máy</button>
                <button className="vtab">Xe đạp điện</button>
              </div>

              <div className="time-row">
                <div className="time-field">
                  <span className="time-label">Giờ vào</span>
                  <span className="time-value">Hôm nay, 7:30 AM</span>
                </div>
                <div className="time-field">
                  <span className="time-label">Giờ ra (dự kiến)</span>
                  <span className="time-value">Hôm nay, 10:30 AM</span>
                </div>
              </div>

              <button className="btn-book">Đặt chỗ đỗ xe</button>
            </div>
          </div>

          <div className="status-card">
            <p className="status-card-title">TÌNH TRẠNG HÔM NAY</p>
            <div className="status-row">
              <span className="status-vehicle">Ô tô</span>
              <div className="status-count-group">
                <span className="status-count">92/150</span>
                <span className="status-unit">chỗ trống</span>
              </div>
            </div>
            <div className="status-divider" />
            <div className="status-row">
              <span className="status-vehicle">Xe máy/<br />đạp điện</span>
              <div className="status-count-group">
                <span className="status-count">253/600</span>
                <span className="status-unit">chỗ trống</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floor Status */}
      <section className="floors-section">
        <h2 className="section-title">Tình trạng các tầng đỗ xe</h2>
        <div className="floor-grid">
          <FloorCard
            name="Tầng 1"
            badge="Còn chỗ"
            badgeType="available"
            tags={['Ô tô']}
            available={92}
            inUse={58}
            total={150}
            fillPercent={39}
            fillColor="#22c55e"
          />
          <FloorCard
            name="Tầng 2"
            badge="Gần đầy"
            badgeType="almost-full"
            tags={['Xe máy', 'Xe đạp điện']}
            available={48}
            inUse={252}
            total={300}
            fillPercent={84}
            fillColor="#f59e0b"
          />
          <FloorCard
            name="Tầng 3"
            badge="Còn chỗ"
            badgeType="available"
            tags={['Xe máy', 'Xe đạp điện']}
            available={205}
            inUse={95}
            total={300}
            fillPercent={32}
            fillColor="#22c55e"
          />
        </div>
      </section>

      {/* Bottom Row */}
      <section className="bottom-section">
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
              <tr>
                <td>Ô tô</td>
                <td>15.000 đ/h</td>
                <td>8.000 đ/h</td>
              </tr>
              <tr>
                <td>Xe máy</td>
                <td>5.000 đ/h</td>
                <td>3.000 đ/h</td>
              </tr>
              <tr>
                <td>Xe đạp điện</td>
                <td>3.000 đ/h</td>
                <td>2.000 đ/h</td>
              </tr>
              <tr>
                <td>Qua đêm (xe máy)</td>
                <td>–</td>
                <td>20.000 đ/h</td>
              </tr>
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
      </section>
    </div>
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
