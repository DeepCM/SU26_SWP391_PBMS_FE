import { useState } from 'react'
import '../styles/Dashboard.css'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'
import TableReview from '../components/manager/TableReview'

function ManagerReviews() {
  const [isLoggedIn] = useState(!!localStorage.getItem('token'))

  return (
    <div className="sci-page">
      <Navbar isLoggedIn={isLoggedIn} />

      <div className="sci-body">
        <Sidebar />

        <main className="sci-main sci-dashboard-container">
          <div className="sci-header-container">
            <div>
              <h1 className="sci-header-title">Quản Lý Đánh Giá</h1>
              <p className="sci-header-subtitle">Danh sách đánh giá của khách hàng và trạng thái phản hồi.</p>
            </div>
          </div>

          <TableReview />
        </main>
      </div>
    </div>
  )
}

export default ManagerReviews
