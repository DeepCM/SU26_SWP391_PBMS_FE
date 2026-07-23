import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'
import '../styles/CheckIn.css'
import '../styles/Dashboard.css'
import TableFloor from '../components/common/TableFloor.jsx'
import TablePolicy from '../components/common/TablePolicy.jsx'
import TableUser from '../components/common/TableUser.jsx'
import TableVehicleType from '../components/common/TableVehicleType.jsx'
import TableBookingSettings from '../components/common/TableBookingSettings.jsx'

export default function Admin() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  // Lấy giá trị của tham số ?tab từ URL, mặc định hiển thị "users" (Người dùng)
  const activeTab = searchParams.get('tab') || 'users'

  // Tự động chuyển hướng /admin thành /admin?tab=users để đồng bộ URL đẹp mắt
  useEffect(() => {
    if (!searchParams.has('tab')) {
      navigate('/admin?tab=users', { replace: true })
    }
  }, [searchParams, navigate])

  // Hàm render động bảng tương ứng với tab đang chọn
  const renderActiveTable = () => {
    switch (activeTab) {
      case 'users':
        return <TableUser />
      case 'policies':
        return <TablePolicy />
      case 'floors':
        return <TableFloor />
      case 'vehicle-types':
        return <TableVehicleType />
      case 'booking-settings':
        return <TableBookingSettings/>
      default:
        return <TableUser />
    }
  }

  // Hàm tự động đổi phụ đề header theo tab cho chuyên nghiệp
  const getHeaderSubtitle = () => {
    switch (activeTab) {
      case 'users':
        return 'Quản lý danh sách tài khoản, phân quyền và trạng thái người dùng.'
      case 'policies':
        return 'Cập nhật hệ thống nội quy bãi đỗ xe và các quy định biểu phí phạt.'
      case 'floors':
        return 'Thiết lập danh sách và trạng thái sức chứa của các tầng đỗ xe.'
      case 'vehicle-types':
        return 'Định cấu hình các loại phương tiện được phép hoạt động trong hệ thống.'
      case 'booking-settings':
        return 'Định cấu hình các thông số đặt chỗ trong hệ thống.'
      default:
        return 'Quản lý cấu hình hệ thống PBMS.'
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

          {/* Chỉ render duy nhất bảng đang được kích hoạt */}
          <div className="sci-table-wrapper">
            {renderActiveTable()}
          </div>
        </main>
      </div>
    </div>
  )
}