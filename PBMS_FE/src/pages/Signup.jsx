import { useState } from 'react'
import '../styles/Login.css'
import '../styles/Signup.css'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { registerUser } from '../services/authService'
import Footer from '../components/common/Footer'
import Header from '../components/common/Header'

function Signup({ }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [otp, setOtp] = useState('')
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    }
  })
  const navigate = useNavigate()
  const onSubmit = async (data) => {
    try {
      const result = await registerUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword
      })

      if (result.status === 201) {
        setIsRegistered(true)
        setRegisteredEmail(data.email)
      } else {
        alert(result.data.message || 'Register failed')
      }

    } catch (error) {
      console.error(error)
    }
  }
  const handleVerify = async () => {
    try {
      console.log({
        email: registeredEmail,
        otp: otp
      })
      const response = await fetch('http://localhost:5021/api/Auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: registeredEmail,
          otp: otp
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert('Email verified successfully')
        navigate('/login')
      } else {
        alert(result.message || 'Verification failed')
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
        <div className="login-card signup-card">
          <div className="login-card-icon">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M20.5833 11.9165H5.41667C4.22005 11.9165 3.25 12.8866 3.25 14.0832V21.6665C3.25 22.8631 4.22005 23.8332 5.41667 23.8332H20.5833C21.78 23.8332 22.75 22.8631 22.75 21.6665V14.0832C22.75 12.8866 21.78 11.9165 20.5833 11.9165Z" stroke="#1B5EF7" strokeWidth="2.16667" />
              <path d="M7.58325 11.9165V7.58317C7.58325 6.14658 8.15393 4.76883 9.16976 3.75301C10.1856 2.73719 11.5633 2.1665 12.9999 2.1665C14.4365 2.1665 15.8143 2.73719 16.8301 3.75301C17.8459 4.76883 18.4166 6.14658 18.4166 7.58317V11.9165" stroke="#1B5EF7" strokeWidth="2.16667" />
            </svg>
          </div>

          <h1 className="login-title">Đăng ký tài khoản {isRegistered ? 'thành công' : ''}</h1>

          <div className="login-subtitle">
            <p>Đăng ký để quản lý đặt chỗ của bạn.</p>
            <p>
              Đã có tài khoản?{' '}
              <a href="#" className="login-link" onClick={e => { e.preventDefault(); navigate('/login') }}>
                Đăng nhập ngay
              </a>
            </p>
          </div>

          <button type="button" className="login-google-btn">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M18.8 10.2085C18.8 9.5585 18.7417 8.9335 18.6333 8.3335H10V11.8835H14.9333C14.7167 13.0252 14.0667 13.9918 13.0917 14.6418V16.9502H16.0667C17.8 15.3502 18.8 13.0002 18.8 10.2085Z" fill="#4285F4" />
              <path d="M9.99998 19.1667C12.475 19.1667 14.55 18.35 16.0667 16.95L13.0917 14.6417C12.275 15.1917 11.2333 15.525 9.99998 15.525C7.61665 15.525 5.59165 13.9167 4.86665 11.75H1.81665V14.1167C3.32498 17.1083 6.41665 19.1667 9.99998 19.1667Z" fill="#34A853" />
              <path d="M4.86659 11.7416C4.68325 11.1916 4.57492 10.6083 4.57492 9.99993C4.57492 9.3916 4.68325 8.80827 4.86659 8.25827V5.8916H1.81659C1.19159 7.12493 0.833252 8.5166 0.833252 9.99993C0.833252 11.4833 1.19159 12.8749 1.81659 14.1083L4.86659 11.7416Z" fill="#FBBC05" />
              <path d="M9.99998 4.4835C11.35 4.4835 12.55 4.95016 13.5083 5.85016L16.1333 3.22516C14.5417 1.74183 12.475 0.833496 9.99998 0.833496C6.41665 0.833496 3.32498 2.89183 1.81665 5.89183L4.86665 8.2585C5.59165 6.09183 7.61665 4.4835 9.99998 4.4835Z" fill="#EA4335" />
            </svg>
            Tiếp tục với Google
          </button>

          <div className="login-divider">
            <span className="login-divider-line" />
            <span className="login-divider-text">hoặc đăng ký bằng địa chỉ email</span>
            <span className="login-divider-line" />
          </div>

          {!isRegistered ? (
            <form onSubmit={handleSubmit(onSubmit)} className="login-form">
              <div className="login-field-group">
                <label className="login-field-label">Họ Tên</label>
                <div className="login-input-wrap">
                  <svg className="login-input-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 9C10.6569 9 12 7.65685 12 6C12 4.34315 10.6569 3 9 3C7.34315 3 6 4.34315 6 6C6 7.65685 7.34315 9 9 9Z" stroke="#BFC6D0" strokeWidth="1.5" />
                    <path d="M3 15C3 12 5.7 9.75 9 9.75C12.3 9.75 15 12 15 15" stroke="#BFC6D0" strokeWidth="1.5" />
                  </svg>
                  <input
                    type="text"
                    className="login-input"
                    placeholder="Nguyễn Văn An"
                    {...register('fullName', { required: 'Full name is required' })}
                  />
                </div>
                {errors.fullName && <span className="error">{errors.fullName.message}</span>}
              </div>

              <div className="login-field-group">
                <label className="login-field-label">Địa chỉ Email</label>
                <div className="login-input-wrap">
                  <svg
                    className="login-input-icon"
                    width="17"
                    height="18"
                    viewBox="0 0 17 18"
                    fill="none"
                  >
                    <g opacity="0.55">
                      <path
                        d="M2.125 4.5H14.875C15.266 4.5 15.5833 4.81734 15.5833 5.20833V12.7917C15.5833 13.1827 15.266 13.5 14.875 13.5H2.125C1.73405 13.5 1.41667 13.1827 1.41667 12.7917V5.20833C1.41667 4.81734 1.73405 4.5 2.125 4.5Z"
                        stroke="#BFC6D0"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M15.5833 5.5L8.5 10.25L1.41667 5.5"
                        stroke="#BFC6D0"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  </svg>
                  <input
                    type="email"
                    className="login-input"
                    placeholder="example@example.com"
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
                <label className="login-field-label">Mật Khẩu</label>
                <div className="login-input-wrap">
                  <svg className="login-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M12.6667 7.3335H3.33333C2.59695 7.3335 2 7.93045 2 8.66683V13.3335C2 14.0699 2.59695 14.6668 3.33333 14.6668H12.6667C13.403 14.6668 14 14.0699 14 13.3335V8.66683C14 7.93045 13.403 7.3335 12.6667 7.3335Z" stroke="#BFC6D0" strokeWidth="1.33333" />
                    <path d="M4.66675 7.3335V4.66683C4.66675 3.78277 5.01794 2.93493 5.64306 2.30981C6.26818 1.68469 7.11603 1.3335 8.00008 1.3335C8.88414 1.3335 9.73198 1.68469 10.3571 2.30981C10.9822 2.93493 11.3334 3.78277 11.3334 4.66683V7.3335" stroke="#BFC6D0" strokeWidth="1.33333" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="login-input login-input--password"
                    placeholder="••••••••"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters'
                      }
                    })}
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label="Toggle password visibility"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <g clipPath="url(#signup-eye1-clip)">
                        <path d="M0.666748 7.99984C0.666748 7.99984 3.33341 2.6665 8.00008 2.6665C12.6667 2.6665 15.3334 7.99984 15.3334 7.99984C15.3334 7.99984 12.6667 13.3332 8.00008 13.3332C3.33341 13.3332 0.666748 7.99984 0.666748 7.99984Z" stroke="#6B7280" strokeWidth="1.33333" />
                        <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="#6B7280" strokeWidth="1.33333" />
                      </g>
                      <defs>
                        <clipPath id="signup-eye1-clip"><rect width="16" height="16" fill="white" /></clipPath>
                      </defs>
                    </svg>
                  </button>
                </div>
                {errors.password && <span className="error">{errors.password.message}</span>}
              </div>

              <div className="login-field-group">
                <label className="login-field-label">Nhập Lại Mật Khẩu</label>
                <div className="login-input-wrap">
                  <svg className="login-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M12.6667 7.3335H3.33333C2.59695 7.3335 2 7.93045 2 8.66683V13.3335C2 14.0699 2.59695 14.6668 3.33333 14.6668H12.6667C13.403 14.6668 14 14.0699 14 13.3335V8.66683C14 7.93045 13.403 7.3335 12.6667 7.3335Z" stroke="#BFC6D0" strokeWidth="1.33333" />
                    <path d="M4.66675 7.3335V4.66683C4.66675 3.78277 5.01794 2.93493 5.64306 2.30981C6.26818 1.68469 7.11603 1.3335 8.00008 1.3335C8.88414 1.3335 9.73198 1.68469 10.3571 2.30981C10.9822 2.93493 11.3334 3.78277 11.3334 4.66683V7.3335" stroke="#BFC6D0" strokeWidth="1.33333" />
                  </svg>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="login-input login-input--password"
                    placeholder="••••••••"
                    {...register('confirmPassword', {
                      required: 'Confirm password is required',
                      validate: (value) =>
                        value === watch('password') || 'Passwords do not match'
                    })}
                  />
                  <button
                    type="button"
                    className="login-eye-btn"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    aria-label="Toggle confirm password visibility"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <g clipPath="url(#signup-eye2-clip)">
                        <path d="M0.666748 7.99984C0.666748 7.99984 3.33341 2.6665 8.00008 2.6665C12.6667 2.6665 15.3334 7.99984 15.3334 7.99984C15.3334 7.99984 12.6667 13.3332 8.00008 13.3332C3.33341 13.3332 0.666748 7.99984 0.666748 7.99984Z" stroke="#6B7280" strokeWidth="1.33333" />
                        <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="#6B7280" strokeWidth="1.33333" />
                      </g>
                      <defs>
                        <clipPath id="signup-eye2-clip"><rect width="16" height="16" fill="white" /></clipPath>
                      </defs>
                    </svg>
                  </button>
                </div>
                {errors.confirmPassword && <span className="error">{errors.confirmPassword.message}</span>}
              </div>

              <button type="submit" className="login-submit-btn">
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                  <path d="M10.625 2.125H13.4583C13.8341 2.125 14.1944 2.27426 14.4601 2.53993C14.7257 2.80561 14.875 3.16594 14.875 3.54167V13.4583C14.875 13.8341 14.7257 14.1944 14.4601 14.4601C14.1944 14.7257 13.8341 14.875 13.4583 14.875H10.625" stroke="white" strokeWidth="1.77083" />
                  <path d="M7.08325 12.0418L10.6249 8.50016L7.08325 4.9585" stroke="white" strokeWidth="1.77083" />
                  <path d="M10.625 8.5H2.125" stroke="white" strokeWidth="1.77083" />
                </svg>
                Đăng ký
              </button>
            </form>
          ) : (
            <div className="login-form">
              <label className="login-field-label">Xác thực email</label>
              <p>Chúng tôi đã gửi mã xác thực đến: {registeredEmail}</p>
              <div className="login-field-group">
                <input
                  type="text"
                  placeholder="Nhập mã xác thực"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <button onClick={handleVerify} className="login-submit-btn">
                Xác thực Email
              </button>
            </div>
          )}

          <p className="login-terms">
            Bằng cách đăng ký, bạn đồng ý với{' '}
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

export default Signup
