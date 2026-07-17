import { useState, useEffect, useCallback } from 'react'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'
import '../styles/CheckIn.css'
import '../styles/Dashboard.css'
import { getOverview, getOccupancy, getRevenue, getSlotUsage, getTraffic } from '../services/reportService'

// ── DATE UTILITIES FOR API PARAMETERS (Moved outside Component) ───────────
const getTodayStr = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getCurrentMonthStr = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
};

const getMonthDateRange = (yearMonthStr) => {
  if (!yearMonthStr) return { startDate: '', endDate: '' };

  const [year, month] = yearMonthStr.split('-').map(Number);
  const startDate = `${yearMonthStr}-01`;

  // Ngày thứ '0' của tháng sau chính là ngày cuối cùng của tháng này
  const lastDay = new Date(year, month, 0).getDate();
  const formattedLastDay = lastDay < 10 ? `0${lastDay}` : lastDay;
  const endDate = `${yearMonthStr}-${formattedLastDay}`;

  return { startDate, endDate };
};

export default function Dashboard() {
  // ── STATE MANAGEMENT ──────────────────────────────────────────────────────
  const [timePeriod, setTimePeriod] = useState('ngày')
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const occupancyData = analyticsData?.occupancy || {};
  const revenueTrend = analyticsData?.revenue?.trend || [];
  const trafficData = analyticsData?.traffic || {};
  const vehicleTypes = trafficData.byVehicleType || [];
  const floorUsage = analyticsData?.slotUsage?.floors || [];
  const floorsList = analyticsData?.slotUsage?.floors || [];

  // Aggregating system-wide operational totals from individual floor nodes
  const globalTotalSlots = floorsList.reduce((sum, f) => sum + (f.totalSlots || 0), 0);
  const globalOccupied = floorsList.reduce((sum, f) => sum + (f.currentOccupiedSlots || 0), 0);
  const globalReserved = floorsList.reduce((sum, f) => sum + (f.currentReservedSlots || 0), 0);
  const globalAvailable = floorsList.reduce((sum, f) => sum + (f.currentAvailableSlots || 0), 0);

  // Derive exact systemic ratios safely
  const systemOccupancyRate = globalTotalSlots > 0 ? Math.round((globalOccupied / globalTotalSlots) * 100) : 0;
  const totalAllocatedSlots = globalOccupied + globalReserved;
  const occupiedRatio = totalAllocatedSlots > 0 ? Math.round((globalOccupied / totalAllocatedSlots) * 100) : 0;
  const reservedRatio = totalAllocatedSlots > 0 ? Math.round((globalReserved / totalAllocatedSlots) * 100) : 0;
  const totalCommitted = globalOccupied + globalReserved;
  const totalCommittedRatio = globalTotalSlots > 0
    ? Math.round((totalCommitted / globalTotalSlots) * 100)
    : 0;

  // Calculate offset for the SVG
  const arcOffsetCommitted = 377 - (377 * totalCommittedRatio) / 100;
  const arcOffsetOccupied = 377 - (377 * systemOccupancyRate) / 100;
  const arcOffsetReserved = totalAllocatedSlots > 0 ? 377 - (377 * reservedRatio) / 100 : 377;// Computes peak vehicle entries to scale comparative horizontal bars safely
  const maxVehicleEntries = Math.max(...vehicleTypes.map(v => Math.max(v.entries || 0, v.exits || 0)), 1);
  // Computes peak value to auto-scale the revenue trend line safely inside the SVG bounds
  const maxRevenue = Math.max(...revenueTrend.map(d => d.revenue || 0), 1);

  // ── DATA DISPATCHER & LIFECYCLE ───────────────────────────────────────────
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true)
      setError(null)

      // Khởi tạo tham số thời gian dựa vào state timePeriod hiện tại
      let from = '';
      let to = '';

      if (timePeriod === 'ngày') {
        const today = getTodayStr();
        from = today;
        to = today;
      } else if (timePeriod === 'tháng') {
        const range = getMonthDateRange(getCurrentMonthStr());
        from = range.startDate;
        to = range.endDate;
      }

      const groupBy = timePeriod === 'ngày' ? 'month' : 'day'

      try {
        const [overviewRes, occupancyRes, revenueRes, trafficRes, slotUsageRes] = await Promise.all([
          getOverview({ from, to }),
          getOccupancy(),
          getRevenue({ from, to, groupBy }),
          getTraffic({ from, to, groupBy }),
          getSlotUsage({ from, to })
        ])
        console.log("Revenue Trend Data:", revenueRes.data || revenueRes);

        setAnalyticsData({
          overview: overviewRes?.data || overviewRes,
          occupancy: occupancyRes?.data || occupancyRes,
          revenue: revenueRes?.data || revenueRes,
          traffic: trafficRes?.data || trafficRes,
          slotUsage: slotUsageRes?.data || slotUsageRes
        })

        setLoading(false)
      } catch (err) {
        console.error("Dashboard Fetch Error: ", err)
        setError(err.message || 'Không thể tải thông tin tổng quan hệ thống.')
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [timePeriod])

  if (loading) {
    return (
      <div className="sci-page sci-loading-state">
        <p className="sci-loading-text">Đang tải dữ liệu phân tích hệ thống...</p>
      </div>
    )
  }

  const overview = analyticsData?.overview

  return (
    <div className="sci-page">
      <Navbar isLoggedIn={true} />

      <main className="sci-body">
        <Sidebar />

        <div className="sci-main">

          {/* Dashboard Header Area */}
          <div className="sci-header-container">
            <div>
              <h1 className="sci-header-title">Tổng Quan Hệ Thống PBMS</h1>
              <p className="sci-header-subtitle">Giám sát mật độ bãi đỗ, bảng giá chính sách và báo cáo doanh thu tài chính liên tục.</p>
            </div>

            {/* Time Period Filter Pills Wrapper  */}
            <div className="sci-period-filters-container">
              <button className={`sci-period-pill ${timePeriod === 'ngày' ? 'sci-period-pill--active' : ''}`} onClick={() => setTimePeriod('ngày')}>Hôm nay</button>
              <button className={`sci-period-pill ${timePeriod === 'tháng' ? 'sci-period-pill--active' : ''}`} onClick={() => setTimePeriod('tháng')}>Tháng này</button>
            </div>

          </div>

          {error && <div className="sci-confirm-error">{error}</div>}

          {/* LAYOUT ZONE 1: KEY PERFORMANCE METRICS */}
          <div className="sci-dashboard-grid">

            {/* KPI Card 1: Integrated Revenue Metrics */}
            <div className="sci-stat-card">
              <div className="sci-stat-header">
                <span className="sci-stat-title">Doanh Thu Hợp Nhất</span>
                <span className="sci-badge-finance">Tài chính</span>
              </div>
              <div className="sci-stat-value">
                {overview?.totalRevenue?.toLocaleString('vi-VN')} <span className="sci-stat-currency">VNĐ</span>
              </div>
              <div className="sci-stat-footer-lines">
                <div>Số lượng thanh toán: <strong>{overview?.completedPaymentCount} giao dịch</strong></div>
                <div className="sci-stat-footer-split">
                  <span>Đặt chỗ: {overview?.depositRevenue?.toLocaleString('vi-VN')}đ</span>
                  <span>Gửi xe: {overview?.parkingFeeRevenue?.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>

            {/* KPI Card 2: Space Allocation Summary */}
            <div className="sci-stat-card">
              <div className="sci-stat-header">
                <span className="sci-stat-title">Sức Chứa Hiện Tại</span>
                <span className="sci-badge-status">Trạng Thái</span>
              </div>
              <div className="sci-stat-value">
                {overview?.availableSlots} / {overview?.totalSlots} <span className="sci-stat-currency">Trống</span>
              </div>

              {/* Clean Progress Bar Component */}
              <div className="sci-progress-track">
                <div className="sci-progress-bar-occupied" style={{ width: `${overview?.physicalOccupancyRate || 0}%` }} />
                <div className="sci-progress-bar-reserved" style={{ width: `${((overview?.reservedSlots || 0) / (overview?.totalSlots || 1)) * 100}%` }} />
              </div>

              <div className="sci-stat-footer-flex">
                <span>Mật độ thực tế: <strong className="text-red">{overview?.physicalOccupancyRate}%</strong></span>
                <span>Cam kết: <strong className="text-blue">{overview?.committedCapacityRate}%</strong></span>
              </div>
            </div>

            {/* KPI Card 3: Traffic Flow Dynamics */}
            <div className="sci-stat-card">
              <div className="sci-stat-header">
                <span className="sci-stat-title">Lưu Lượng Điều Phối</span>
                <span className="sci-badge-policy">Vận Hành</span>
              </div>
              <div className="sci-stat-value">
                {parseInt(overview?.totalEntries || 0) + parseInt(overview?.totalExits || 0)} <span className="sci-stat-currency">Lượt xe</span>
              </div>
              <div className="sci-stat-footer-flex-row">
                <span>Tổng lượt vào: <strong className="text-green">{overview?.totalEntries}</strong></span>
                <span>Tổng lượt ra: <strong className="text-orange">{overview?.totalExits}</strong></span>
              </div>
            </div>
          </div>

          {/* LAYOUT ZONE 2 & 3: ADVANCED VISUALIZATIONS HOOKS */}
          <div className="sci-charts-section-grid">

            {/* Row 1 Content Area: Phase 2 Implementation */}
            <div id="dashboard-phase-2-slot" className="sci-charts-row-1">

              {/* Updated Chart A: Dynamic Twin Donuts with Dedicated Context Legends */}
              <div className="sci-chart-card">
                <h3 className="sci-chart-card-title">Phân Tích Trạng Thái Mật Độ Chỗ (Tổng Hợp)</h3>

                <div className="sci-charts-twin-container">

                  {/* Sub-Chart 1: Total Committed Capacity */}
                  <div className="sci-donut-sub-block">
                    <span className="sci-sub-chart-label">Tổng tải hệ thống</span>
                    <div className="sci-donut-wrapper">
                      <svg viewBox="0 0 160 160" className="sci-donut-svg">
                        <circle className="sci-donut-track" cx="80" cy="80" r="60" />
                        <circle
                          className="sci-donut-segment sci-segment-occupied"
                          cx="80"
                          cy="80"
                          r="60"
                          strokeDasharray="377"
                          strokeDashoffset={arcOffsetCommitted}
                        />
                      </svg>
                      <div className="sci-donut-center-text">
                        <span className="sci-donut-percentage">{totalCommittedRatio}%</span>
                        <span className="sci-donut-label">Đã đặt/đỗ</span>
                      </div>
                    </div>

                    {/* Updated Legend for Combined Load */}
                    <div className="sci-mini-legend-vertical">
                      <div className="sci-legend-item">
                        <span className="sci-legend-marker bg-red"></span>
                        <span className="sci-legend-txt">Đã dùng: <strong>{totalCommitted}</strong></span>
                      </div>
                      <div className="sci-legend-item">
                        <span className="sci-legend-marker bg-green"></span>
                        <span className="sci-legend-txt">Trống: <strong>{globalAvailable}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-Chart 2: Reserved vs In Use (Allocated Capacity Only) */}
                  <div className="sci-donut-sub-block">
                    <span className="sci-sub-chart-label">Đặt chỗ vs. Thực tế</span>
                    <div className="sci-donut-wrapper">
                      <svg viewBox="0 0 160 160" className="sci-donut-svg">
                        {/* Background Track (Neutral base) */}
                        <circle className="sci-donut-track" cx="80" cy="80" r="60" />

                        {/* Reserved Segment (Blue) */}
                        <circle
                          className="sci-segment-reserved-nested"
                          cx="80" cy="80" r="60"
                          strokeWidth="16"
                          // Length of reserved segment based on ratio
                          strokeDasharray={`${reservedRatio * 3.77} 377`}
                          strokeDashoffset="0"
                        />

                        {/* Occupied Segment (Yellow) */}
                        <circle
                          className="sci-segment-occupied-yellow"
                          cx="80" cy="80" r="60"
                          strokeWidth="16"
                          // Length of occupied segment based on ratio
                          strokeDasharray={`${occupiedRatio * 3.77} 377`}
                          // Offset by the reserved length to start immediately after it
                          strokeDashoffset={`-${reservedRatio * 3.77}`}
                        />
                      </svg>

                      <div className="sci-donut-center-text">
                        <span className="sci-donut-percentage">{reservedRatio}%</span>
                        <span className="sci-donut-label">Đặt trước</span>
                      </div>
                    </div>

                    {/* Dedicated Legend for Chart 2 */}
                    <div className="sci-mini-legend-vertical">
                      <div className="sci-legend-item">
                        <span className="sci-legend-marker bg-blue"></span>
                        <span className="sci-legend-txt">Đặt trước: <strong>{globalReserved}</strong> ({reservedRatio}%)</span>
                      </div>
                      <div className="sci-legend-item">
                        <span className="sci-legend-marker bg-yellow"></span>
                        <span className="sci-legend-txt">Xe thực tế: <strong>{globalOccupied}</strong> ({occupiedRatio}%)</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Chart B: Financial Performance Trend (SVG Area/Line Chart) */}
              <div className="sci-chart-card">
                <h3 className="sci-chart-card-title">Biểu Đồ Xu Hướng Doanh Thu Dòng Tiền</h3>
                <div className="sci-trend-wrapper">
                  {/* Optimized Financial Trend Chart */}
                  <svg viewBox="0 0 600 220" className="sci-trend-svg">
                    {/* Horizontal grid lines */}
                    <line x1="40" y1="30" x2="560" y2="30" className="sci-grid-line" />
                    <line x1="40" y1="95" x2="560" y2="95" className="sci-grid-line" />
                    <line x1="40" y1="160" x2="560" y2="160" className="sci-grid-line" />

                    {/* Draw line only if there are 2 or more points */}
                    {revenueTrend.length > 1 && (
                      <polyline
                        className="sci-trend-polyline"
                        points={revenueTrend.map((pt, i) => {
                          const x = 40 + (i * (520 / (revenueTrend.length - 1)));
                          const y = 160 - ((pt.revenue || 0) / maxRevenue) * 120;
                          return `${x},${y}`;
                        }).join(' ')}
                      />
                    )}

                    {/* Nodes and Labels */}
                    {revenueTrend.map((pt, i) => {
                      // If length is 1, center it (x=300). Otherwise, space evenly.
                      const x = revenueTrend.length > 1
                        ? 40 + (i * (520 / (revenueTrend.length - 1)))
                        : 300;

                      const y = 160 - ((pt.revenue || 0) / maxRevenue) * 120;

                      return (
                        <g key={i} className="sci-trend-node-group">
                          <circle cx={x} cy={y} r="5" className="sci-trend-dot" />
                          <text x={x} y={y - 12} className="sci-trend-value-label">
                            {pt.revenue ? `${(pt.revenue / 1000).toFixed(0)}k` : '0'}
                          </text>
                          <text x={x} y="185" className="sci-trend-axis-label">
                            {/* Using Date object to format correctly */}
                            {new Date(pt.periodStart).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

            </div>

            {/* Row 2 Content Area: Phase 3 Implementation */}
            <div id="dashboard-phase-3-slot" className="sci-charts-row-2">

              {/* Chart C: Traffic Flow & Vehicle Types (Horizontal Distribution Bars) */}
              <div className="sci-chart-card">
                <div className="sci-chart-card-header">
                  <h3 className="sci-chart-card-title">Lưu Lượng Theo Loại Phương Tiện</h3>
                  <div className="sci-compact-legend">
                    <span><span className="sci-legend-marker bg-green"></span>Vào</span>
                    <span><span className="sci-legend-marker bg-orange"></span>Ra</span>
                  </div>
                </div>

                <div className="sci-vehicle-list">
                  {vehicleTypes.length === 0 ? (
                    <p className="sci-empty-text">Không có dữ liệu phương tiện</p>
                  ) : (
                    vehicleTypes.map((vehicle, idx) => {
                      const entryPercent = ((vehicle.entries || 0) / maxVehicleEntries) * 100;
                      const exitPercent = ((vehicle.exits || 0) / maxVehicleEntries) * 100;

                      return (
                        <div key={idx} className="sci-vehicle-row">
                          <div className="sci-vehicle-info">
                            <span className="sci-vehicle-name">{vehicle.vehicleTypeName}</span>
                            <span className="sci-vehicle-total">
                              Tổng: {parseInt(vehicle.entries || 0) + parseInt(vehicle.exits || 0)}
                            </span>
                          </div>

                          <div className="sci-vehicle-bar-wrapper">
                            {/* Entry Flow Bar */}
                            <div className="sci-double-bar-track">
                              <div className="sci-double-bar bg-green" style={{ width: `${entryPercent}%` }}>
                                {vehicle.entries > 0 && <span className="sci-bar-label">{vehicle.entries}</span>}
                              </div>
                            </div>

                            {/* Exit Flow Bar */}
                            <div className="sci-double-bar-track">
                              <div className="sci-double-bar bg-orange" style={{ width: `${exitPercent}%` }}>
                                {vehicle.exits > 0 && <span className="sci-bar-label">{vehicle.exits}</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Updated Chart D: Deep Telemetry Performance Table Grid */}
              <div className="sci-chart-card">
                <h3 className="sci-chart-card-title">Hiệu Suất Hoạt Động Chi Tiết Theo Tầng</h3>

                <div className="sci-table-wrapper">
                  <table className="sci-performance-table">
                    <thead>
                      <tr>
                        <th>Tầng</th>
                        <th>Mật Độ Thực Tế</th>
                        <th>Tỷ Lệ Đặt Chỗ</th>
                        <th>Lưu Lượng Ra/Vào</th>
                        <th>T.Gian Chờ TB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {floorUsage.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="sci-empty-text">Không có dữ liệu vận hành tầng</td>
                        </tr>
                      ) : (
                        floorUsage.map((floor, idx) => {
                          const occRate = floor.currentPhysicalOccupancyRate || 0;
                          const commitRate = floor.currentCommittedCapacityRate || 0;

                          // Semantic color evaluation profiles
                          const occColorClass = occRate > 80 ? 'bg-red' : occRate > 50 ? 'bg-orange' : 'bg-green';
                          const commitColorClass = commitRate > 80 ? 'bg-red' : 'bg-blue';

                          return (
                            <tr key={idx}>
                              <td className="sci-table-bold">{floor.floorName}</td>

                              {/* Physical Occupancy Metric Node */}
                              <td>
                                <div className="sci-table-progress-container">
                                  <div className="sci-table-progress-track">
                                    <div className={`sci-table-progress-bar ${occColorClass}`} style={{ width: `${occRate}%` }}></div>
                                  </div>
                                  <span className="sci-table-progress-text">{occRate}%</span>
                                </div>
                                <div className="sci-table-sub-info">
                                  Trống: <strong>{floor.currentAvailableSlots}</strong> / {floor.totalSlots} chỗ
                                </div>
                              </td>

                              {/* Committed Financial Capacity Node */}
                              <td>
                                <div className="sci-table-progress-container">
                                  <div className="sci-table-progress-track">
                                    <div className={`sci-table-progress-bar ${commitColorClass}`} style={{ width: `${commitRate}%` }}></div>
                                  </div>
                                  <span className="sci-table-progress-text">{commitRate}%</span>
                                </div>
                                <div className="sci-table-sub-info">
                                  Đặt trước: <strong>{floor.currentReservedSlots}</strong> chỗ
                                </div>
                              </td>

                              <td>
                                <div className="sci-table-traffic-split">
                                  <span className="text-green font-semibold">+{floor.entryCount} vào</span>
                                  <span className="text-orange font-semibold">-{floor.completedExitCount} ra</span>
                                </div>
                              </td>

                              <td className="sci-table-bold">{floor.averageParkingMinutes} phút</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>

        </div>
      </main>
    </div>
  )
}