import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser } from "../../services/authService"
import '../../styles/Home.css'
import userAvatarPlaceholder from '../../assets/userAvatar.png'

export default function Navbar({ isLoggedIn }) {
  const navigate = useNavigate()
  const userData = useMemo(() => getUser(), [])

  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const isStaff = isLoggedIn && user?.role?.toLowerCase() === 'staff'

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="nav-logo">PBMS</span>
        <ul className="nav-links">
          {isStaff ? (
            <>
              <li><a href="#" onClick={() => navigate('/checkin')}>Check-in</a></li>
              <li><a href="#" onClick={() => navigate('/checkout')}>Check-out</a></li>
            </>
          ) : (
            <>
              <li><a href="#" onClick={() => navigate('/')}>Tổng quan</a></li>
              <li><a href="#" onClick={() => navigate('/bookings')}>Đặt chỗ của tôi</a></li>
              <li><a href="#" onClick={() => navigate('/vehicles')}>Xe của tôi</a></li>
              <li><a href="#">Hỗ trợ</a></li>
              <li><a href="#">Hướng dẫn</a></li>
              <li><a href="#">Liên hệ</a></li>
              <li><a href="#">Giới thiệu</a></li>
            </>
          )}
        </ul>
        {isLoggedIn ? (
          <div className="navbar-user-actions">

            <button
              className="navbar-avatar-btn"
              onClick={() => navigate('/profile')}
            >
              <img
                // Use the avatar from userData, or fallback to the imported placeholder
                src={userData?.avatarUrl || userAvatarPlaceholder}
                alt="avatar"
                className="navbar-avatar"
                onError={(e) => { e.target.src = userAvatarPlaceholder }} // Safety check if URL is broken
              />
            </button>

            <button className="btn-logout" onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              navigate('/login');
            }}>
              Đăng xuất
            </button>
          </div>
        ) : (
          <button className="btn-login" onClick={() => navigate('/login')}>
            Đăng nhập
          </button>
        )}
      </div>
    </nav >
  )
}
