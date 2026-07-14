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

function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: '',
      remember: false
    }
  })
  const navigate = useNavigate()

  const onSubmit = async (data) => {
    try {
      const result = await loginUser(data.email, data.password)

      if (result.status === 200) {
        // 1. Save token first so subsequent API calls (like getProfile) are authorized
        localStorage.setItem("token", result.data.accessToken)

        // 2. Fetch the profile details to determine the user's role
        const profileResult = await getProfile()
        
        // Handle both standard axios wrapper layouts { data: ... } and direct payloads
        const profileData = profileResult?.data || profileResult
        const userRole = profileData?.role

        // 3. Construct and save the local user state
        const user = {
          email: result.data.email || profileData?.email,
          fullName: result.data.fullName || profileData?.fullName,
          role: userRole,
          avatarUrl: result.data.avatarUrl ?? profileData?.avatarUrl ?? null
        }
        localStorage.setItem("user", JSON.stringify(user))

        // 4. Role-based routing matrix redirection
        if (userRole === 'driver') {
          navigate('/')
        } else if (userRole === 'staff') {
          navigate('/checkin')
        } else if (userRole === 'admin' || userRole === 'manager') {
          navigate('/dashboard')
        } else {
          // Fallback route if role doesn't match standard profiles
          navigate('/')
        }
      } else {
        alert(result.data.message || 'Đăng nhập thất bại')
      }
    } catch (error) {
      console.error("Login/Profile retrieval error: ", error)
      alert(error.message || 'Có lỗi xảy ra trong quá trình đăng nhập.')
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