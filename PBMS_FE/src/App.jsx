import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import UserProfile from './pages/UserProfile.jsx'
import Bookings from './pages/Bookings.jsx'
import Vehicles from './pages/Vehicles.jsx'
import CheckIn from './pages/CheckIn.jsx'
import CheckOut from './pages/CheckOut.jsx'
import MobileCamera from './pages/MobileCamera.jsx'
import MobileBookingScanner from './pages/MobileBookingScanner.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/bookings"
          element={<Bookings />}
        />

        <Route
          path="/vehicles"
          element={<Vehicles />}
        />

        <Route
          path="/profile"
          element={
            <UserProfile
              stats={null}
              recentHistory={[]}
              notificationSettings={null}
              onNotifChange={(settings) => console.log('Notif settings:', settings)}
              onChangePassword={() => console.log('Change password')}
              onActivate2FA={() => console.log('Activate 2FA')}
              onManageDevices={() => console.log('Manage devices')}
              onDeleteAccount={() => console.log('Delete account')}
            />
          }
        />

        <Route
          path="/checkin"
          element={<CheckIn />}
        />

        <Route
          path="/checkout"
          element={<CheckOut />}
        />

        <Route
          path="/mobile-camera"
          element={<MobileCamera />}
        />

        <Route
          path="/mobile-booking-scanner"
          element={<MobileBookingScanner />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
