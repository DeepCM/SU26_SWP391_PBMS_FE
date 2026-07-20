import { useState, useEffect } from 'react'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'
import '../styles/CheckIn.css'
import '../styles/Dashboard.css'
import { getOverview, getOccupancy, getRevenue, getSlotUsage, getTraffic } from '../services/reportService'

// ── DATE UTILITIES FOR API PARAMETERS ───────────────────────────────────────
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

  const lastDay = new Date(year, month, 0).getDate();
  const formattedLastDay = lastDay < 10 ? `0${lastDay}` : lastDay;
  const endDate = `${yearMonthStr}-${formattedLastDay}`;

  return { startDate, endDate };
};

const getThreeMonthsAgoStr = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 3);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function Dashboard() {
  // ── STATE MANAGEMENT ──────────────────────────────────────────────────────
  // Trạng thái timePeriod hỗ trợ: 'day', 'month', '3months', 'custom'
  const [timePeriod, setTimePeriod] = useState('day')

  // Các state phục vụ việc nhập ngày thủ công từ người dùng
  const [fromDateInput, setFromDateInput] = useState('')
  const [toDateInput, setToDateInput] = useState('')
  // State giữ khoảng ngày đã được nhấn nút "Áp dụng" để kích hoạt gọi API
  const [appliedCustomRange, setAppliedCustomRange] = useState({ from: '', to: '' })

  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const occupancyData = analyticsData?.occupancy || {};
  const revenueTrend = analyticsData?.revenue?.trend || [];
  const trafficData = analyticsData?.traffic || {};
  const vehicleTypes = trafficData.byVehicleType || [];
  const floorUsage = analyticsData?.slotUsage?.floors || [];
  const floorsList = analyticsData?.slotUsage?.floors || [];

  // Hệ thống tính toán chỉ số KPI (giữ nguyên logic gốc của bạn)
  const globalTotalSlots = floorsList.reduce((sum, f) => sum + (f.totalSlots || 0), 0);
  const globalOccupied = floorsList.reduce((sum, f) => sum + (f.currentOccupiedSlots || 0), 0);
  const globalReserved = floorsList.reduce((sum, f) => sum + (f.currentReservedSlots || 0), 0);
  const globalAvailable = floorsList.reduce((sum, f) => sum + (f.currentAvailableSlots || 0), 0);

  const systemOccupancyRate = globalTotalSlots > 0 ? Math.round((globalOccupied / globalTotalSlots) * 100) : 0;
  const totalAllocatedSlots = globalOccupied + globalReserved;
  const occupiedRatio = totalAllocatedSlots > 0 ? Math.round((globalOccupied / totalAllocatedSlots) * 100) : 0;
  const reservedRatio = totalAllocatedSlots > 0 ? Math.round((globalReserved / totalAllocatedSlots) * 100) : 0;
  const totalCommitted = globalOccupied + globalReserved;
  const totalCommittedRatio = globalTotalSlots > 0 ? Math.round((totalCommitted / globalTotalSlots) * 100) : 0;

  const arcOffsetCommitted = 377 - (377 * totalCommittedRatio) / 100;
  const arcOffsetOccupied = 377 - (377 * systemOccupancyRate) / 100;
  const arcOffsetReserved = totalAllocatedSlots > 0 ? 377 - (377 * reservedRatio) / 100 : 377;

  const maxVehicleEntries = Math.max(...vehicleTypes.map(v => Math.max(v.entries || 0, v.exits || 0)), 1);
  const maxRevenue = Math.max(...revenueTrend.map(d => d.revenue || 0), 1);

  // ── DATA DISPATCHER & LIFECYCLE ───────────────────────────────────────────
  useEffect(() => {
    const loadDashboardData = async () => {
      let from = '';
      let to = '';

      // Tính toán tham số date dựa trên chế độ lọc được chọn
      if (timePeriod === 'day') {
        const today = getTodayStr();
        from = today;
        to = today;
      } else if (timePeriod === 'month') {
        const range = getMonthDateRange(getCurrentMonthStr());
        from = range.startDate;
        to = range.endDate;
      } else if (timePeriod === '3months') {
        from = getThreeMonthsAgoStr();
        to = getTodayStr();
      } else if (timePeriod === 'custom') {
        from = appliedCustomRange.from;
        to = appliedCustomRange.to;
        // Nếu chọn chế độ tự chọn nhưng chưa nhấn Áp dụng hoặc thiếu ngày thì không gọi API
        if (!from || !to) return;
      }

      setLoading(true)
      setError(null)

      // Tự động gom nhóm linh hoạt: Nếu lọc 1 ngày đơn lẻ (hôm nay hoặc custom trùng ngày) thì gom theo giờ 'hour', ngược lại gom theo ngày 'day'
      const groupBy = (from === to) ? 'hour' : 'day';

      try {
        const [overviewRes, occupancyRes, revenueRes, trafficRes, slotUsageRes] = await Promise.all([
          getOverview({ from, to }),
          getOccupancy(),
          getRevenue({ from, to, groupBy }),
          getTraffic({ from, to, groupBy }),
          getSlotUsage({ from, to })
        ])

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
  }, [timePeriod, appliedCustomRange]) // Chạy lại khi chuyển tab hoặc khi khoảng custom được áp dụng thành công

  // Hàm xử lý hành vi khi nhấn nút "Áp dụng" khoảng ngày tự chọn
  const handleApplyCustomDate = (e) => {
    e.preventDefault();
    if (fromDateInput && toDateInput) {
      setAppliedCustomRange({ from: fromDateInput, to: toDateInput });
      setTimePeriod('custom');
    }
  };

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
          <div className="sci-header-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="sci-header-title">Tổng Quan Hệ Thống PBMS</h1>
              <p className="sci-header-subtitle">Giám sát mật độ bãi đỗ, bảng giá chính sách và báo cáo doanh thu tài chính liên tục.</p>
            </div>

            {/* Khối bộ lọc tích hợp Quick Pills và Custom Date Picker */}
            <div className="sci-filters-wrapper" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>

              {/* Nhóm các nút chọn nhanh */}
              <div className="sci-period-filters-container" style={{ margin: 0 }}>
                <button
                  className={`sci-period-pill ${timePeriod === 'day' ? 'sci-period-pill--active' : ''}`}
                  onClick={() => setTimePeriod('day')}
                >
                  Hôm nay
                </button>
                <button
                  className={`sci-period-pill ${timePeriod === 'month' ? 'sci-period-pill--active' : ''}`}
                  onClick={() => setTimePeriod('month')}
                >
                  Tháng này
                </button>
                <button
                  className={`sci-period-pill ${timePeriod === '3months' ? 'sci-period-pill--active' : ''}`}
                  onClick={() => setTimePeriod('3months')}
                >
                  3 tháng qua
                </button>
              </div>

              {/* Form nhập ngày tùy chỉnh */}
              <form onSubmit={handleApplyCustomDate} className="sci-custom-date-form">
                <input
                  type="date"
                  value={fromDateInput}
                  onChange={(e) => setFromDateInput(e.target.value)}
                  className="sci-date-input"
                  required
                />
                <span className="sci-date-separator">đến</span>
                <input
                  type="date"
                  value={toDateInput}
                  onChange={(e) => setToDateInput(e.target.value)}
                  className="sci-date-input"
                  required
                />
                <button
                  type="submit"
                  disabled={!fromDateInput || !toDateInput}
                  className={`sci-period-pill ${timePeriod === 'custom' ? 'sci-period-pill--active' : ''} sci-date-submit-btn`}
                >
                  Áp dụng
                </button>
              </form>

            </div>
          </div>

          {error && <div className="sci-confirm-error">{error}</div>}

          {/* LAYOUT ZONE 1: KEY PERFORMANCE METRICS */}
          <div className="sci-dashboard-grid">
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

            <div className="sci-stat-card">
              <div className="sci-stat-header">
                <span className="sci-stat-title">Sức Chứa Hiện Tại</span>
                <span className="sci-badge-status">Trạng Thái</span>
              </div>
              <div className="sci-stat-value">
                {overview?.availableSlots} / {overview?.totalSlots} <span className="sci-stat-currency">Trống</span>
              </div>
              <div className="sci-progress-track">
                <div className="sci-progress-bar-occupied" style={{ width: `${overview?.physicalOccupancyRate || 0}%` }} />
                <div className="sci-progress-bar-reserved" style={{ width: `${((overview?.reservedSlots || 0) / (overview?.totalSlots || 1)) * 100}%` }} />
              </div>
              <div className="sci-stat-footer-flex">
                <span>Mật độ thực tế: <strong className="text-red">{overview?.physicalOccupancyRate || 0}%</strong></span>
                <span>Cam kết: <strong className="text-blue">{overview?.committedCapacityRate || 0}%</strong></span>
              </div>
            </div>

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

          {/* LAYOUT ZONE 2 & 3: ADVANCED VISUALIZATIONS */}
          <div className="sci-charts-section-grid">
            <div id="dashboard-phase-2-slot" className="sci-charts-row-1">

              {/* Chart A: Donuts */}
              <div className="sci-chart-card">
                <h3 className="sci-chart-card-title">Phân Tích Trạng Thái Mật Độ Chỗ (Tổng Hợp)</h3>
                <div className="sci-charts-twin-container">
                  <div className="sci-donut-sub-block">
                    <span className="sci-sub-chart-label">Tổng tải hệ thống</span>
                    <div className="sci-donut-wrapper">
                      <svg viewBox="0 0 160 160" className="sci-donut-svg">
                        <circle className="sci-donut-track" cx="80" cy="80" r="60" />
                        <circle
                          className="sci-donut-segment sci-segment-occupied"
                          cx="80" cy="80" r="60"
                          strokeDasharray="377"
                          strokeDashoffset={arcOffsetCommitted}
                        />
                      </svg>
                      <div className="sci-donut-center-text">
                        <span className="sci-donut-percentage">{totalCommittedRatio}%</span>
                        <span className="sci-donut-label">Đã đặt/đỗ</span>
                      </div>
                    </div>
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

                  <div className="sci-donut-sub-block">
                    <span className="sci-sub-chart-label">Đặt chỗ vs. Thực tế</span>
                    <div className="sci-donut-wrapper">
                      <svg viewBox="0 0 160 160" className="sci-donut-svg">
                        <circle className="sci-donut-track" cx="80" cy="80" r="60" />
                        <circle
                          className="sci-segment-reserved-nested"
                          cx="80" cy="80" r="60"
                          strokeWidth="16"
                          strokeDasharray={`${reservedRatio * 3.77} 377`}
                          strokeDashoffset="0"
                        />
                        <circle
                          className="sci-segment-occupied-yellow"
                          cx="80" cy="80" r="60"
                          strokeWidth="16"
                          strokeDasharray={`${occupiedRatio * 3.77} 377`}
                          strokeDashoffset={`-${reservedRatio * 3.77}`}
                        />
                      </svg>
                      <div className="sci-donut-center-text">
                        <span className="sci-donut-percentage">{reservedRatio}%</span>
                        <span className="sci-donut-label">Đặt trước</span>
                      </div>
                    </div>
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

              {/* Chart B: Revenue Trend Line */}
              <div className="sci-chart-card">
                <h3 className="sci-chart-card-title">Biểu Đồ Xu Hướng Doanh Thu Dòng Tiền</h3>
                <div className="sci-trend-wrapper">
                  <svg viewBox="0 0 600 220" className="sci-trend-svg">
                    <line x1="40" y1="30" x2="560" y2="30" className="sci-grid-line" />
                    <line x1="40" y1="95" x2="560" y2="95" className="sci-grid-line" />
                    <line x1="40" y1="160" x2="560" y2="160" className="sci-grid-line" />

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

                    {revenueTrend.map((pt, i) => {
                      const x = revenueTrend.length > 1 ? 40 + (i * (520 / (revenueTrend.length - 1))) : 300;
                      const y = 160 - ((pt.revenue || 0) / maxRevenue) * 120;

                      return (
                        <g key={i} className="sci-trend-node-group">
                          <circle cx={x} cy={y} r="5" className="sci-trend-dot" />
                          <text x={x} y={y - 12} className="sci-trend-value-label">
                            {pt.revenue ? `${(pt.revenue / 1000).toFixed(0)}k` : '0'}
                          </text>
                          <text x={x} y="185" className="sci-trend-axis-label">
                            {pt.periodStart ? new Date(pt.periodStart).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : ''}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>

            <div id="dashboard-phase-3-slot" className="sci-charts-row-2">
              {/* Chart C: Traffic Flow */}
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
                            <div className="sci-double-bar-track">
                              <div className="sci-double-bar bg-green" style={{ width: `${entryPercent}%` }}>
                                {vehicle.entries > 0 && <span className="sci-bar-label">{vehicle.entries}</span>}
                              </div>
                            </div>
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

              {/* Chart D: Floor Telemetry Table */}
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
                          const occColorClass = occRate > 80 ? 'bg-red' : occRate > 50 ? 'bg-orange' : 'bg-green';
                          const commitColorClass = commitRate > 80 ? 'bg-red' : 'bg-blue';

                          return (
                            <tr key={idx}>
                              <td className="sci-table-bold">{floor.floorName}</td>
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