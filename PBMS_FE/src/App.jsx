import { useState } from 'react'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'

function App() {
  const [page, setPage] = useState('home')

  if (page === 'login') {
    return <Login onLogin={() => setPage('home')} onSignup={() => setPage('signup')} />
  }

  if (page === 'signup') {
    return <Signup onNavigateToLogin={() => setPage('login')} onNavigateToHome={() => setPage('home')} />
  }

  return <Home onNavigateToLogin={() => setPage('login')} />
}

export default App
