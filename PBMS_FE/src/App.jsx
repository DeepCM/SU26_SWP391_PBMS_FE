// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthContext';

// Layouts
import DriverLayout from './layouts/DriverLayout';
import ManagementLayout from './layouts/ManagementLayout';

// Auth Guard
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Bookings from './pages/Bookings';
import Vehicles from './pages/Vehicles';
import UserProfile from './pages/UserProfile';
import CheckIn from './pages/CheckIn';
import CheckOut from './pages/CheckOut';
import Incidents from './pages/Incidents';
import Dashboard from './pages/Dashboard';
import Manager from './pages/Manager';
import Review from './pages/Review';
import ManagerReviews from './pages/ManagerReviews';
import MobileCamera from './pages/MobileCamera';
import MobileBookingScanner from './pages/MobileBookingScanner';
import MobileCheckoutScan from './pages/MobileCheckoutScan';
import Admin from './pages/Admin';
import ParkingHistory from './pages/ParkingHistory';
import Unknown from './pages/Unknown';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ================= PUBLIC AUTH ROUTES ================= */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* ================= DRIVER & GUEST CUSTOMER ROUTES ================= */}
          <Route element={<DriverLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/my-reviews" element={<Review />} />

            {/* Profile is shared by everyone but requires a valid active session */}
            <Route element={<ProtectedRoute allowedRoles={['driver', 'staff', 'admin', 'manager']} />}>
              <Route path="/profile" element={<UserProfile
                stats={null}
                recentHistory={[]}
                notificationSettings={null}
                onNotifChange={(settings) => console.log('Notif settings:', settings)}
                onChangePassword={() => console.log('Change password')}
                onActivate2FA={() => console.log('Activate 2FA')}
                onManageDevices={() => console.log('Manage devices')}
                onDeleteAccount={() => console.log('Delete account')}
              />} />
            </Route>
          </Route>

          {/* ================= MOBILE QR SCAN ROUTES (public — opened by a phone from a QR code, no login) ================= */}
          <Route path="/mobile-camera" element={<MobileCamera />} />
          <Route path="/mobile-booking-scanner" element={<MobileBookingScanner />} />
          <Route path="/mobile-checkout-scan" element={<MobileCheckoutScan />} />

          {/* ================= STAFF WORKSPACE ROUTES ================= */}
          <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
            <Route element={<ManagementLayout />}>
              <Route path="/checkin" element={<CheckIn />} />
              <Route path="/checkout" element={<CheckOut />} />
              <Route path="/incidents" element={<Incidents />} />
            </Route>
          </Route>

          {/* ================= SHARED STAFF/MANAGER ROUTES ================= */}
          <Route element={<ProtectedRoute allowedRoles={['staff', 'manager']} />}>
            <Route element={<ManagementLayout />}>
              <Route path="/parking-history" element={<ParkingHistory />} />
            </Route>
          </Route>

          {/* ================= MANAGER CONTROL ROUTES ================= */}
          <Route element={<ProtectedRoute allowedRoles={['manager', 'admin']} />}>
            <Route element={<ManagementLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/manager" element={<Manager />} />
              <Route path="/reviews" element={<ManagerReviews />} />
            </Route>
          </Route>

          {/* ================= ADMIN CONTROL ROUTES ================= */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<ManagementLayout />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>

          {/* Fallback Catch-All Redirect */}
          <Route path="*" element={<Unknown />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;