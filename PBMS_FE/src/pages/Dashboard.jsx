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
  const [timePeriod, setTimePeriod] = useState('day') // 'day' | 'week' | 'month'
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
            day: { totalAmount: 4250000, transactionCount: 142 },
            week: { totalAmount: 31200000, transactionCount: 980 },
            month: { totalAmount: 124800000, transactionCount: 3890 },
          }

          const mockPolicies = [
            { type: 'Xe máy', rate: '5,000đ / giờ' },
            { type: 'Xe máy điện', rate: '6,000đ / giờ' },
            { type: 'Ô tô', rate: '25,000đ / giờ' },
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
      <div className="sci-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '15px' }}>Đang tải dữ liệu phân tích...</p>
      </div>
    )
  }

  // ── VIEW RENDERING LAYER ──────────────────────────────────────────────────
  return (
    <div className="sci-page">
      {/* Dynamic top bar layout */}
      <Navbar isLoggedIn={true} />

      <main className="sci-main" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Header section with analytical scope switcher */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>
              Tổng Quan Hệ Thống PBMS
            </h1>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
              Giám sát mật độ bãi đỗ, bảng giá chính sách và báo cáo doanh thu tài chính.
            </p>
          </div>
          
          {/* Timeframe Scope Filters */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`sci-period-pill ${timePeriod === 'day' ? 'sci-period-pill--active' : ''}`}
              onClick={() => setTimePeriod('day')}
            >
              Hôm nay
            </button>
            <button 
              className={`sci-period-pill ${timePeriod === 'week' ? 'sci-period-pill--active' : ''}`}
              onClick={() => setTimePeriod('week')}
            >
              Tuần này
            </button>
            <button 
              className={`sci-period-pill ${timePeriod === 'month' ? 'sci-period-pill--active' : ''}`}
              onClick={() => setTimePeriod('month')}
            >
              Tháng này
            </button>
          </div>
        </div>

        {error && <div className="sci-confirm-error" style={{ marginBottom: '20px' }}>{error}</div>}

        {/* Analytics Dashboard Grid Framework */}
        <div className="sci-dashboard-grid">
          
          {/* Card 1: Revenue Metrics */}
          <div className="sci-stat-card">
            <div className="sci-stat-header">
              <span className="sci-stat-title">Doanh Thu Thu Về ({timePeriod === 'day' ? 'Ngày' : timePeriod === 'week' ? 'Tuần' : 'Tháng'})</span>
              <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', background: '#e1effe', color: '#1a56db', borderRadius: '4px', textTransform: 'uppercase' }}>
                Tài chính
              </span>
            </div>
            <div className="sci-stat-value">
              {analyticsData?.revenue?.totalAmount?.toLocaleString('vi-VN')} VNĐ
            </div>
            <div style={{ fontSize: '13px', color: '#4b5563', borderTop: '1px solid #f3f4f6', paddingTop: '10px', marginTop: 'auto' }}>
              Tổng số lượt giao dịch: <strong>{analyticsData?.revenue?.transactionCount}</strong>
            </div>
          </div>

          {/* Card 2: Parking Slots Occupancy Status */}
          <div className="sci-stat-card" style={{ gridColumn: 'span 2' }}>
            <div className="sci-stat-header">
              <span className="sci-stat-title">Trạng Thái Mật Độ Các Tầng Đỗ</span>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                <span><span className="sci-indicator-dot sci-dot--available"></span>Trống</span>
                <span><span className="sci-indicator-dot sci-dot--occupied"></span>Đầy</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {analyticsData?.occupancy?.map((floor, idx) => (
                <div key={idx} className="sci-floor-detail-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                    {floor.type === 'Xe máy' && <IconMotorbike style={{ width: '16px', height: '16px', fill: '#4b5563' }} />}
                    {floor.type === 'Xe máy điện' && <IconEbike style={{ width: '16px', height: '16px', fill: '#4b5563' }} />}
                    {floor.type === 'Ô tô' && <IconCar style={{ width: '16px', height: '16px', fill: '#4b5563' }} />}
                    {floor.floorName} ({floor.type})
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    <span style={{ color: '#16a34a', fontWeight: '600' }}>{floor.available}</span> trống / <span style={{ color: '#dc2626', fontWeight: '600' }}>{floor.occupied}</span> đỗ (Tổng: {floor.total})
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Active Rates Configuration Summary */}
          <div className="sci-stat-card">
            <div className="sci-stat-header">
              <span className="sci-stat-title">Cấu Hình Giá Hiện Tại</span>
              <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', background: '#fef08a', color: '#854d0e', borderRadius: '4px', textTransform: 'uppercase' }}>
                Policy
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              {analyticsData?.policies?.map((policy, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingBottom: '6px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ color: '#4b5563' }}>{policy.type}</span>
                  <span style={{ fontWeight: '600', color: '#111827' }}>{policy.rate}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>
    </div>
  )
}