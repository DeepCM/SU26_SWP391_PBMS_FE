import { useState } from 'react'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import UserProfile from './pages/UserProfile.jsx'

function App() {
  const [page, setPage] = useState('home')

  if (page === 'login') {
    return <Login onLogin={() => setPage('profile')} onSignup={() => setPage('signup')} />
  }

  if (page === 'signup') {
    return <Signup onNavigateToLogin={() => setPage('login')} onNavigateToProfile={() => setPage('profile')} />
  }

  if (page === 'profile') {
    return (
      <UserProfile
        onLogout={() => setPage('home')}
        userAvatar={null}
        userData={null}
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
    )
  }

  return <Home onNavigateToLogin={() => setPage('login')} />
}

export default App
