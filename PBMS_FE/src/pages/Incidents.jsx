import { useState } from 'react'
import '../styles/Dashboard.css'
import Navbar from '../components/common/Navbar'
import TableIncident from '../components/common/TableIncident'
import { STAFF_ACTIONS_CONFIG, getStaffAvailableActions } from '../utils/incidentActions'
import { getMyReportedIncidents, getMyReportedIncidentById } from '../services/incidentService'
import Sidebar from '../components/common/Sidebar'
function Incidents() {
  const [isLoggedIn] = useState(!!localStorage.getItem('token'))

  return (
    <div className="sci-page">
      <Navbar isLoggedIn={isLoggedIn} />
      
      <main className="sci-main sci-dashboard-container">
        
        <div className="sci-header-container">
          <div>
            
            <h1 className="sci-header-title">Sự Cố Đã Báo Cáo</h1>
            <p className="sci-header-subtitle">Danh sách sự cố bạn đã báo cáo và trạng thái xử lý.</p>
          </div>
        </div>

        <TableIncident
          fetchIncidents={getMyReportedIncidents}
          fetchIncidentById={getMyReportedIncidentById}
          title="Sự Cố Đã Báo Cáo"
          actionsConfig={STAFF_ACTIONS_CONFIG}
          getAvailableActions={getStaffAvailableActions}
        />
      </main>
    </div>
  )
}

export default Incidents
