import { useNavigate } from 'react-router-dom'
import '../../styles/Home.css'

export default function Navbar({ isLoggedIn }) {
  const navigate = useNavigate()
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="nav-logo">PBMS</span>
        <ul className="nav-links">
          <li><a href="#" onClick={() => navigate('/')}>Tổng quan</a></li>
          <li><a href="#" onClick={() => navigate('/bookings')}>Đặt chỗ của tôi</a></li>
          <li><a href="#" onClick={() => navigate('/vehicles')}>Xe của tôi</a></li>
          <li><a href="#">Hỗ trợ</a></li>
          <li><a href="#">Hướng dẫn</a></li>
          <li><a href="#">Liên hệ</a></li>
          <li><a href="#">Giới thiệu</a></li>
        </ul>
        {isLoggedIn ? (
          <div className="navbar-user-actions">

            <button
              className="navbar-avatar-btn"
              onClick={() => navigate('/profile')}
            >
              <img
                src="./src/assets/userAvatar.png"
                alt="avatar"
                className="navbar-avatar"
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
