import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import '../styles/Login.css'
import Footer from '../components/common/Footer'
import Header from '../components/common/Header'
import { getProfile } from "../services/profileService"
import {
  IconAccountCard,
  IconEnvelope,
  IconLock,
  IconEye,
  IconSubmit
} from '../components/svg/Icons'
import { loginUser } from '../services/authService'
// Add this import at the top of Login.jsx
import { useAuth } from '../components/auth/AuthContext' 

function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth() // <--- Extract the login action here
  const navigate = useNavigate()
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '', remember: false }
  })

  const onSubmit = async (data) => {
    try {
      const result = await loginUser(data.email, data.password)

      if (result.status === 200) {
        const userRole = result.data.role;

        const userData = {
          email: result.data.email,
          fullName: result.data.fullName,
          role: userRole,
          avatarUrl: result.data.avatarUrl ?? null
        }

        // This updates React State and LocalStorage simultaneously
        login(userData, result.data.accessToken)

        // Now routing will evaluate with the correct, fresh state
        if (userRole === 'driver') {
          navigate('/')
        } else if (userRole === 'staff') {
          navigate('/checkin')
        } else if (userRole === 'manager') {
          navigate('/dashboard')
        } else if (userRole === 'admin') {
          navigate('/admin')
        } else {
          navigate('/')
        }
      } else {
        alert(result.data.message || 'Đăng nhập thất bại')
      }
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg-gradient" />

      <Header />

      <main className="login-main">
        <div className="login-card">
          <div className="login-card-icon">
            <IconAccountCard />
          </div>

          <h1 className="login-title">Đăng nhập trở lại</h1>

          <div className="login-subtitle">
            <p>Đăng nhập để quản lý đặt chỗ của bạn.</p>
            <p>Chưa có tài khoản? <a
              href="#"
              className="login-link"
              onClick={e => {
                e.preventDefault()
                navigate('/signup')
              }}>
              Đăng ký ngay
            </a></p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            <div className="login-field-group">
              <label className="login-field-label">Địa chỉ Email</label>
              <div className="login-input-wrap">
                <IconEnvelope className="login-input-icon" />
                <input
                  type="email"
                  className="login-input"
                  placeholder=""
                  {...register('email', {
                    required: 'Vui lòng nhập email',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Email không hợp lệ'
                    }
                  })}
                />

              </div>
              {errors.email && <span className="error">{errors.email.message}</span>}
            </div>

            <div className="login-field-group">
              <div className="login-password-label-row">
                <label className="login-field-label">Mật khẩu</label>
                <a href="#" className="login-link login-forgot-link">Quên mật khẩu?</a>
              </div>
              <div className="login-input-wrap">
                <IconLock className="login-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-input login-input--password"
                  placeholder=""
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label="Toggle password visibility"
                >
                  <IconEye />
                </button>
              </div>
              {errors.password && <span className="error">{errors.password.message}</span>}
            </div>

            <label className="login-remember-row">
              <input
                type="checkbox"
                className="login-checkbox"
                {...register('remember')}
              />
              <span className="login-remember-text">Ghi nhớ đăng nhập</span>
            </label>

            <button type="submit" className="login-submit-btn">
              <IconSubmit />
              Đăng nhập
            </button>
          </form>

          <p className="login-terms">
            Bằng cách đăng nhập, bạn đồng ý với{' '}
            <a href="#" className="login-link">Điều khoản dịch vụ</a>
            {' '}và{' '}
            <a href="#" className="login-link">Chính sách bảo mật</a>
            {' '}của chúng tôi.
          </p>
        </div>
      </main>

      <Footer />

    </div>
  )
}

export default Login