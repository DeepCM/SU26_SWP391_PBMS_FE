import { useState } from 'react'
import Home from './Home.jsx'
import Login from './Login.jsx'
import Signup from './Signup.jsx'

function App() {
  const [page, setPage] = useState('home')

  if (page === 'login') {
    return <Login onLogin={() => setPage('home')} onSignup={() => setPage('signup')} />
  }

  if (page === 'signup') {
    return <Signup onNavigateToLogin={() => setPage('login')} />
  }

  return <Home onNavigateToLogin={() => setPage('login')} />
}

export default App
