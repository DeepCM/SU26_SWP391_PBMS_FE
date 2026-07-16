import { useState } from 'react'
import '../styles/Dashboard.css'
import Navbar from '../components/common/Navbar'
import Sidebar from '../components/common/Sidebar'
import TableParking from '../components/common/TableParking'

function ParkingHistory() {
  const [isLoggedIn] = useState(!!localStorage.getItem('token'))

  return (
    <div className="sci-page">
      <Navbar isLoggedIn={isLoggedIn} />

      <div className="sci-body">
        <Sidebar />
        <main className="sci-main sci-dashboard-container">

          <div className="sci-header-container">
            <div>
              <h1 className="sci-header-title">Lịch Sử Phiên Gửi Xe</h1>
              <p className="sci-header-subtitle">Tra cứu toàn bộ lịch sử check-in/check-out của các phiên gửi xe.</p>
            </div>
          </div>

          <TableParking />
        </main>
      </div>
    </div>
  )
}

export default ParkingHistory
