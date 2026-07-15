import { useState, useEffect } from 'react'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'
import { IconCar, IconMotorbike, IconEbike } from '../components/svg/Icons'
import '../styles/CheckIn.css'
import '../styles/Dashboard.css'
import TableFloor from '../components/common/TableFloor.jsx'
import TablePolicy from '../components/common/TablePolicy.jsx'
import TableUser from '../components/common/TableUser.jsx'
{/*service import
import { , } from '../services/'
*/}
export default function Admin() {
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

    <div className="sci-body">
        <Sidebar />
      <main className="sci-main sci-dashboard-container">


        <div className="sci-header-container">
          <div>
            <h1 className="sci-header-title">Hệ Thống PBMS</h1>
            <p className="sci-header-subtitle">Quản lý tầng, chính sách và tài khoản người dùng.</p>
          </div>
        </div>
        {error && <div className="sci-confirm-error">{error}</div>}

        {/* Table Framework */}
        <div className="">
          <TableFloor />
        </div>
        <div className="">
          <TablePolicy />
        </div>
        <div className="">
          <TableUser />
        </div>
      </main>
    </div>
    </div>
  )
}
