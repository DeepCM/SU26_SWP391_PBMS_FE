import { useState, useEffect } from 'react'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'
import { IconCar, IconMotorbike, IconEbike } from '../components/svg/Icons'
import '../styles/CheckIn.css'
import '../styles/Dashboard.css'
import TableFloor from '../components/common/TableFloor.jsx'
import TablePricing from '../components/common/TablePricing.jsx'
import TableIncident from '../components/common/TableIncident.jsx'
{/*service import
import { , } from '../services/'
*/}
export default function Dashboard() {
  // ── STATE MANAGEMENT ──────────────────────────────────────────────────────
  // const [timePeriod, setTimePeriod] = useState('ngày') // 'day' | 'week' | 'month'
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ── DATA DISPATCHER & LIFECYCLE ───────────────────────────────────────────
  useEffect(() => {
    // Simulated ghost service execution cycle
    const loadDashboardData = async () => {
      setLoading(true)
      try {
        setLoading(false)
      } catch (err) {
        setError(err.message || 'Không thể tải thông tin tổng quan.')
        setLoading(false)
      }
    }

    loadDashboardData() //}, [timePeriod])
  }, []);

  if (loading) {
    return (
      <div className="sci-page sci-loading-state">
        <p>Đang tải dữ liệu phân tích...</p>
      </div>
    )
  }

  return (
    <div className="sci-page">
      <Navbar isLoggedIn={true} />

      <main className="sci-main sci-dashboard-container">
        <Sidebar /> {/* Column 1 */}

        {/* Column 2: New wrapper containing everything else */}
        <div className="sci-dashboard-content">
          <div className="sci-header-container">
            <h1 className="sci-header-title">Tổng Quan Hệ Thống PBMS</h1>
            <p className="sci-header-subtitle">Giám sát mật độ bãi đỗ, bảng giá chính sách và báo cáo doanh thu tài chính.</p>
          </div>
        </div>
        {error && <div className="sci-confirm-error">{error}</div>}

        {/* Analytics Dashboard Grid Framework */}
        <div className="sci-dashboard-grid">

          {/* Card 1 */}
          <div className="sci-stat-card">
            <div className="sci-stat-header">
              <span className="sci-stat-title">Doanh Thu Thu Về</span>
              <span className="sci-badge-finance">Tài chính</span>
            </div>
            <div className="sci-period-filters">
              <button className={`sci-period-pill ${timePeriod === 'ngày' ? 'sci-period-pill--active' : ''}`} onClick={() => setTimePeriod('ngày')}>Hôm nay</button>
              <button className={`sci-period-pill ${timePeriod === 'tuần' ? 'sci-period-pill--active' : ''}`} onClick={() => setTimePeriod('tuần')}>Tuần này</button>
              <button className={`sci-period-pill ${timePeriod === 'tháng' ? 'sci-period-pill--active' : ''}`} onClick={() => setTimePeriod('tháng')}>Tháng này</button>
            </div>
            <div className="sci-stat-value">{analyticsData?.revenue?.totalAmount?.toLocaleString('vi-VN')} VNĐ</div>
            <div className="sci-stat-footer">Tổng số lượt giao dịch: <strong>{analyticsData?.revenue?.transactionCount}</strong></div>
          </div>

          {/* Card 2: Occupancy (Now uses helper class for span) */}
          <div className="sci-stat-card sci-span-2">
            <div className="sci-stat-header">
              <span className="sci-stat-title">Mật Độ Các Tầng</span>
              <span className="sci-badge-status">Trạng Thái</span>
              
                <div className="sci-legend">
                  <span><span className="sci-indicator-dot sci-dot--available"></span>Trống</span>
                  <span><span className="sci-indicator-dot sci-dot--occupied"></span>Đầy</span>
                  <span><span className="sci-indicator-dot sci-dot--total"></span>Tổng</span>
                </div>
                
            </div>
            {analyticsData?.occupancy?.map((floor, idx) => (
              <div key={idx} className="sci-floor-detail-row">
                <div className="sci-floor-info">
                  {floor.floorName} ({floor.type})
                </div>
                <div className="sci-price-group">
                  <span className="sci-period-pill text-green">{floor.available} trống</span>
                  <span className="sci-period-pill text-red">{floor.occupied} đỗ</span>
                  <span className="sci-period-pill text-blue">{floor.total} tổng</span>
                </div>
              </div>
            ))}
          </div>

          {/* Card 3 */}
          <div className="sci-stat-card">
            <div className="sci-stat-header">
              <span className="sci-stat-title">Phân Giá Phương Tiện</span>
              <span className="sci-badge-policy">Cấu Hình</span>
            </div>

            {analyticsData?.policies?.map((item, idx) => (
              <div key={idx} className="sci-price-row">
                <span className="sci-vehicle-label">
                  {item.type === 'Xe máy' && <IconMotorbike />}
                  {item.type === 'Xe máy điện' && <IconEbike />}
                  {item.type === 'Ô tô' && <IconCar />}
                  {item.type}:</span>
                <div className="sci-price-group">
                  <span className="sci-price-pill sci-pill--hourly">
                    {item.hourlyRate} / giờ
                  </span>
                  <span className="sci-price-pill sci-pill--deposit">
                    {item.depositRate} / đặt chỗ
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
            
        
      </main>
    </div>
  )
}