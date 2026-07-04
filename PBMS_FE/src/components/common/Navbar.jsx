import { useNavigate } from 'react-router-dom'
import { getUser } from "../../services/authService"
import '../../styles/Home.css'
import defaultAvatar from '../../assets/userAvatar.png'

export default function Navbar({ isLoggedIn, userAvatar }) {
  const navigate = useNavigate()
  const user = getUser()
  const avatarSrc = userAvatar || user?.avatarUrl || defaultAvatar
  const isStaff = user?.role?.toLowerCase() === 'staff'
  const isAdmin = user?.role?.toLowerCase() === 'admin'
  const isManager = user?.role?.toLowerCase() === 'manager'
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="nav-logo">PBMS</span>
        <ul className="nav-links">
          {isAdmin ? (
            <>
              {/* TODO: Admin specific navigation links will go here */}
              <a href="#" onClick={() => navigate('/dashboard')}>Tổng quan</a>
              <a href="#" onClick={() => navigate('/dashboard')}>Quản lý</a>
            </>
          ) : isManager ? (
            <>
              {/* TODO: Manager specific navigation links will go here */}
              <a href="#" onClick={() => navigate('/dashboard')}>Tổng quan</a>
            </>
          ) : isStaff ? (
            <>
              <li><a href="#" onClick={() => navigate('/checkin')}>Check-in</a></li>
              <li><a href="#" onClick={() => navigate('/checkout')}>Check-out</a></li>
              <li><a href="#" onClick={() => navigate('/checkout')}>Xử lý sự cố</a></li>
              <li><a href="#" onClick={() => navigate('/checkout')}>Hướng dẫn</a></li>
              <li><a href="#" onClick={() => navigate('/checkout')}>Liên hệ quản lý</a></li>
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
                src={avatarSrc}
                alt="avatar"
                className="navbar-avatar"
                onError={(e) => { e.target.src = defaultAvatar }} // Safety check if URL is broken
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
