import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'
import '../styles/CheckIn.css'
import '../styles/Dashboard.css'
import TableIncident from '../components/common/TableIncident.jsx'
import TablePricing from '../components/common/TablePricing.jsx'

export default function Manager() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Đọc tham số ?tab từ URL, mặc định hiển thị "pricing" (Bảng giá)
  const activeTab = searchParams.get('tab') || 'pricing'

  // Tự động chuyển hướng /manager thành /manager?tab=pricing để đồng bộ URL
  useEffect(() => {
    if (!searchParams.has('tab')) {
      navigate('/manager?tab=pricing', { replace: true })
    }
  }, [searchParams, navigate])

  // Hàm render động bảng tương ứng với tab đang chọn
  const renderActiveTable = () => {
    switch (activeTab) {
      case 'pricing':
        return <TablePricing />
      case 'incidents':
        return <TableIncident />
      default:
        return <TablePricing />
    }
  }

  // Tự động cập nhật phụ đề tương ứng với tab
  const getHeaderSubtitle = () => {
    switch (activeTab) {
      case 'pricing':
        return 'Cấu hình và cập nhật định mức biểu phí gửi xe cho hệ thống.'
      case 'incidents':
        return 'Theo dõi, tiếp nhận và xử lý các báo cáo sự cố tại bãi xe.'
      default:
        return 'Quản lý bảng giá và xử lý sự cố hệ thống.'
    }
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
              <p className="sci-header-subtitle">{getHeaderSubtitle()}</p>
            </div>
          </div>

          <div className="sci-table-wrapper">
            {renderActiveTable()}
          </div>
        </main>
      </div>
    </div>
  )
}