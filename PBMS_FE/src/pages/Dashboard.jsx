import { useState, useEffect } from 'react'
import Navbar from '../components/common/Navbar'
import { IconCar, IconMotorbike, IconEbike } from '../components/svg/Icons'
import '../styles/CheckIn.css'
import '../styles/Dashboard.css'
{/*service import
import { , } from '../services/'
*/}
export default function Dashboard() {
  // ── STATE MANAGEMENT ──────────────────────────────────────────────────────
  const [timePeriod, setTimePeriod] = useState('ngày') // 'day' | 'week' | 'month'
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ── GHOST SERVICE LAYER (ACTOR-AGNOSTIC TABLE INTERACTION) ────────────────
  /*
  // Note: Services are divided by database tables. Cross-table coordination 
  // is handled entirely here by the frontend state framework.
  
  import { getFloorOccupancy } from '../services/floorService'
  import { getRevenueMetrics } from '../services/revenueService'
  import { getPricingPolicies } from '../services/policyService'

  async function fetchDashboardAnalytics(period) {
    try {
      // Parallel table requests to compile analytical overview
      const [occupancy, revenue, policies] = await Promise.all([
        getFloorOccupancy(),
        getRevenueMetrics(period),
        getPricingPolicies()
      ])
      return { occupancy, revenue, policies }
    } catch (err) {
      throw new Error("Lỗi kết nối dữ liệu hệ thống.")
    }
  }
  */

  // ── DATA DISPATCHER & LIFECYCLE ───────────────────────────────────────────
  useEffect(() => {
    // Simulated ghost service execution cycle
    const loadDashboardData = async () => {
      setLoading(true)
      try {
        // Mock data matching backend entity schemas exactly
        setTimeout(() => {
          const mockOccupancy = [
            { floorName: 'Tầng B1', type: 'Xe máy', available: 45, occupied: 105, total: 150 },
            { floorName: 'Tầng B2', type: 'Xe máy điện', available: 20, occupied: 60, total: 80 },
            { floorName: 'Tầng B3', type: 'Ô tô', available: 12, occupied: 38, total: 50 },
          ]

          const mockRevenue = {
            ngày: { totalAmount: 4250000, transactionCount: 142 },
            tuần: { totalAmount: 31200000, transactionCount: 980 },
            tháng: { totalAmount: 124800000, transactionCount: 3890 },
          }

          const mockPolicies = [
            { type: 'Xe máy', hourlyRate: '5,000đ', depositRate: '5,000đ' },
            { type: 'Xe máy điện', hourlyRate: '6,000đ', depositRate: '6,000đ' },
            { type: 'Ô tô', hourlyRate: '25,000đ', depositRate: '25,000đ' },
          ]

          setAnalyticsData({
            occupancy: mockOccupancy,
            revenue: mockRevenue[timePeriod],
            policies: mockPolicies
          })
          setLoading(false)
        }, 400)
      } catch (err) {
        setError(err.message || 'Không thể tải thông tin tổng quan.')
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [timePeriod])

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

        <div className="sci-header-container">
          <div>
            <h1 className="sci-header-title">Tổng Quan Hệ Thống PBMS</h1>
            <p className="sci-header-subtitle">Giám sát mật độ bãi đỗ, bảng giá chính sách và báo cáo doanh thu tài chính.</p>
          </div>

          <div className="sci-period-filters">
            <button className={`sci-period-pill ${timePeriod === 'ngày' ? 'sci-period-pill--active' : ''}`} onClick={() => setTimePeriod('ngày')}>Hôm nay</button>
            <button className={`sci-period-pill ${timePeriod === 'tuần' ? 'sci-period-pill--active' : ''}`} onClick={() => setTimePeriod('tuần')}>Tuần này</button>
            <button className={`sci-period-pill ${timePeriod === 'tháng' ? 'sci-period-pill--active' : ''}`} onClick={() => setTimePeriod('tháng')}>Tháng này</button>
          </div>
        </div>

        {error && <div className="sci-confirm-error">{error}</div>}

        {/* Analytics Dashboard Grid Framework */}
        <div className="sci-dashboard-grid">

          {/* Card 1 */}
          <div className="sci-stat-card">
            <div className="sci-stat-header">
              <span className="sci-stat-title">Doanh Thu Thu Về ({timePeriod})</span>
              <span className="sci-badge-finance">Tài chính</span>
            </div>
            <div className="sci-stat-value">{analyticsData?.revenue?.totalAmount?.toLocaleString('vi-VN')} VNĐ</div>
            <div className="sci-stat-footer">Tổng số lượt giao dịch: <strong>{analyticsData?.revenue?.transactionCount}</strong></div>
          </div>

          {/* Card 2: Occupancy (Now uses helper class for span) */}
          <div className="sci-stat-card sci-span-2">
            <div className="sci-stat-header">
              <span className="sci-stat-title">Mật Độ Các Tầng</span>
              <span className="sci-badge-status">Trạng Thái</span>
              {/*
                <div className="sci-legend">
                  <span><span className="sci-indicator-dot sci-dot--available"></span>Trống</span>
                  <span><span className="sci-indicator-dot sci-dot--occupied"></span>Đầy</span>
                  <span><span className="sci-indicator-dot sci-dot--total"></span>Tổng</span>
                </div>
                */}
            </div>
            {analyticsData?.occupancy?.map((floor, idx) => (
              <div key={idx} className="sci-floor-detail-row">
                <div className="sci-floor-info">
                  {floor.type === 'Xe máy' && <IconMotorbike />}
                  {floor.type === 'Xe máy điện' && <IconEbike />}
                  {floor.type === 'Ô tô' && <IconCar />}
                  {floor.floorName} ({floor.type})
                </div>
                <div className="sci-floor-counts">
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
                <span className="sci-vehicle-label">{item.type}:</span>
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