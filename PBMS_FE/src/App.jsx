import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import UserProfile from './pages/UserProfile.jsx'
import Bookings from './pages/Bookings.jsx'

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
          path="/profile"
          element={
            <UserProfile
              userAvatar={null}
              stats={null}
              recentHistory={[]}
              notificationSettings={null}
              onSaveProfile={(data) => console.log('Save profile:', data)}
              onNotifChange={(settings) => console.log('Notif settings:', settings)}
              onChangePassword={() => console.log('Change password')}
              onActivate2FA={() => console.log('Activate 2FA')}
              onManageDevices={() => console.log('Manage devices')}
              onDeleteAccount={() => console.log('Delete account')}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
