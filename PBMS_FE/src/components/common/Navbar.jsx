export default function Navbar({ onNavigateToLogin }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="nav-logo">PBMS</span>
        <ul className="nav-links">
          <li><a href="#">Tổng quan</a></li>
          <li><a href="#">Đặt chỗ</a></li>
          <li><a href="#">Hỗ trợ</a></li>
          <li><a href="#">Hướng dẫn</a></li>
          <li><a href="#">Liên hệ</a></li>
          <li><a href="#">Giới thiệu</a></li>
        </ul>
        <button className="btn-login" onClick={onNavigateToLogin}>Đăng nhập</button>
      </div>
    </nav>
  )
}