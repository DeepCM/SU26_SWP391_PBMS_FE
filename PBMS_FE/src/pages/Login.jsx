import { useState } from 'react'
import { useForm } from 'react-hook-form'
import '../styles/Login.css'

function Login({ onLogin, onSignup }) {
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      phone: '',
      password: '',
      remember: false
    }
  })

  const onSubmit = (data) => {
    console.log('Form data:', data)
    onLogin()
  }

  return (
    <div className="login-page">
      <div className="login-bg-gradient" />

      <header className="login-header">
        <div className="login-logo">
          <span className="login-logo-pbms">PBMS</span>
          <span className="login-logo-parking">| Parking</span>
        </div>
        <a href="#" className="login-home-link" onClick={onLogin}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 5.99992L8 1.33325L14 5.99992V13.3333C14 13.6869 13.8595 14.026 13.6095 14.2761C13.3594 14.5261 13.0203 14.6666 12.6667 14.6666H3.33333C2.97971 14.6666 2.64057 14.5261 2.39052 14.2761C2.14048 14.026 2 13.6869 2 13.3333V5.99992Z" stroke="#6B7280" strokeWidth="1.33333"/>
            <path d="M6 14.6667V8H10V14.6667" stroke="#6B7280" strokeWidth="1.33333"/>
          </svg>
          Trang chủ
        </a>
      </header>

      <main className="login-main">
        <div className="login-card">
          <div className="login-card-icon">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M20.5833 11.9167H5.41667C4.22005 11.9167 3.25 12.8868 3.25 14.0834V21.6667C3.25 22.8634 4.22005 23.8334 5.41667 23.8334H20.5833C21.78 23.8334 22.75 22.8634 22.75 21.6667V14.0834C22.75 12.8868 21.78 11.9167 20.5833 11.9167Z" stroke="#1B5EF7" strokeWidth="2.16667"/>
              <path d="M7.58325 11.9167V7.58341C7.58325 6.14683 8.15393 4.76908 9.16976 3.75325C10.1856 2.73743 11.5633 2.16675 12.9999 2.16675C14.4365 2.16675 15.8143 2.73743 16.8301 3.75325C17.8459 4.76908 18.4166 6.14683 18.4166 7.58341V11.9167" stroke="#1B5EF7" strokeWidth="2.16667"/>
            </svg>
          </div>

          <h1 className="login-title">Đăng nhập trở lại</h1>

          <div className="login-subtitle">
            <p>Đăng nhập để quản lý đặt chỗ của bạn.</p>
            <p>Chưa có tài khoản? <a href="#" className="login-link" onClick={e => { e.preventDefault(); onSignup?.() }}>Đăng ký ngay</a></p>
          </div>

          <button type="button" className="login-google-btn">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M18.8 10.2083C18.8 9.55825 18.7417 8.93325 18.6333 8.33325H10V11.8833H14.9333C14.7167 13.0249 14.0667 13.9916 13.0917 14.6416V16.9499H16.0667C17.8 15.3499 18.8 12.9999 18.8 10.2083Z" fill="#4285F4"/>
              <path d="M9.99998 19.1667C12.475 19.1667 14.55 18.35 16.0667 16.95L13.0917 14.6417C12.275 15.1917 11.2333 15.525 9.99998 15.525C7.61665 15.525 5.59165 13.9167 4.86665 11.75H1.81665V14.1167C3.32498 17.1083 6.41665 19.1667 9.99998 19.1667Z" fill="#34A853"/>
              <path d="M4.86659 11.7416C4.68325 11.1916 4.57492 10.6083 4.57492 9.99993C4.57492 9.3916 4.68325 8.80827 4.86659 8.25827V5.8916H1.81659C1.19159 7.12493 0.833252 8.5166 0.833252 9.99993C0.833252 11.4833 1.19159 12.8749 1.81659 14.1083L4.86659 11.7416Z" fill="#FBBC05"/>
              <path d="M9.99998 4.48325C11.35 4.48325 12.55 4.94992 13.5083 5.84992L16.1333 3.22492C14.5417 1.74159 12.475 0.833252 9.99998 0.833252C6.41665 0.833252 3.32498 2.89159 1.81665 5.89159L4.86665 8.25825C5.59165 6.09159 7.61665 4.48325 9.99998 4.48325Z" fill="#EA4335"/>
            </svg>
            Tiếp tục với Google
          </button>

          <div className="login-divider">
            <span className="login-divider-line" />
            <span className="login-divider-text">hoặc đăng nhập bằng số điện thoại</span>
            <span className="login-divider-line" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            <div className="login-field-group">
              <label className="login-field-label">Số Điện Thoại</label>
              <div className="login-input-wrap">
                <svg className="login-input-icon" width="17" height="18" viewBox="0 0 17 18" fill="none">
                  <g opacity="0.55" clipPath="url(#phone-clip)">
                    <path d="M15.5833 12.6901V14.9401C15.5841 15.1489 15.5437 15.3557 15.4646 15.5471C15.3856 15.7385 15.2697 15.9103 15.1243 16.0515C14.979 16.1927 14.8073 16.3002 14.6205 16.3671C14.4336 16.434 14.2356 16.4589 14.0391 16.4401C11.8594 16.1893 9.76572 15.4007 7.92618 14.1376C6.21473 12.9861 4.76371 11.4497 3.67618 9.63757C2.47908 7.68098 1.7341 5.45332 1.5016 3.13507C1.4839 2.92767 1.50718 2.71864 1.56995 2.52129C1.63273 2.32394 1.73363 2.14259 1.86622 1.98879C1.99882 1.83499 2.16021 1.7121 2.34012 1.62796C2.52002 1.54382 2.71451 1.50027 2.91118 1.50007H5.03618C5.37994 1.49649 5.7132 1.62538 5.97385 1.86272C6.23449 2.10006 6.40474 2.42966 6.45285 2.79007C6.54254 3.51012 6.70888 4.21712 6.94868 4.89757C7.04398 5.16602 7.06461 5.45776 7.00812 5.73823C6.95162 6.01871 6.82038 6.27616 6.62993 6.48007L5.73035 7.43257C6.7387 9.31023 8.207 10.8649 9.98035 11.9326L10.8799 10.9801C11.0725 10.7784 11.3157 10.6395 11.5806 10.5796C11.8455 10.5198 12.121 10.5417 12.3745 10.6426C13.0172 10.8965 13.6849 11.0726 14.3649 11.1676C14.709 11.219 15.0233 11.4025 15.2479 11.6832C15.4725 11.9639 15.5919 12.3223 15.5833 12.6901Z" stroke="#BFC6D0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                  <defs>
                    <clipPath id="phone-clip"><rect width="17" height="18" fill="white"/></clipPath>
                  </defs>
                </svg>
                <input
                  type="tel"
                  className="login-input"
                  placeholder="0777 777 777"
                  {...register('phone', { required: 'Phone is required' })}
                />
                {errors.phone && <span className="error">{errors.phone.message}</span>}
              </div>
            </div>

            <div className="login-field-group">
              <div className="login-password-label-row">
                <label className="login-field-label">Mật khẩu</label>
                <a href="#" className="login-link login-forgot-link">Quên mật khẩu?</a>
              </div>
              <div className="login-input-wrap">
                <svg className="login-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12.6667 7.33325H3.33333C2.59695 7.33325 2 7.93021 2 8.66659V13.3333C2 14.0696 2.59695 14.6666 3.33333 14.6666H12.6667C13.403 14.6666 14 14.0696 14 13.3333V8.66659C14 7.93021 13.403 7.33325 12.6667 7.33325Z" stroke="#BFC6D0" strokeWidth="1.33333"/>
                  <path d="M4.66675 7.33325V4.66659C4.66675 3.78253 5.01794 2.93468 5.64306 2.30956C6.26818 1.68444 7.11603 1.33325 8.00008 1.33325C8.88414 1.33325 9.73198 1.68444 10.3571 2.30956C10.9822 2.93468 11.3334 3.78253 11.3334 4.66659V7.33325" stroke="#BFC6D0" strokeWidth="1.33333"/>
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-input login-input--password"
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label="Toggle password visibility"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <g clipPath="url(#eye-clip)">
                      <path d="M0.666748 8.00008C0.666748 8.00008 3.33341 2.66675 8.00008 2.66675C12.6667 2.66675 15.3334 8.00008 15.3334 8.00008C15.3334 8.00008 12.6667 13.3334 8.00008 13.3334C3.33341 13.3334 0.666748 8.00008 0.666748 8.00008Z" stroke="#6B7280" strokeWidth="1.33333"/>
                      <path d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z" stroke="#6B7280" strokeWidth="1.33333"/>
                    </g>
                    <defs>
                      <clipPath id="eye-clip"><rect width="16" height="16" fill="white"/></clipPath>
                    </defs>
                  </svg>
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
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <path d="M10.625 2.125H13.4583C13.8341 2.125 14.1944 2.27426 14.4601 2.53993C14.7257 2.80561 14.875 3.16594 14.875 3.54167V13.4583C14.875 13.8341 14.7257 14.1944 14.4601 14.4601C14.1944 14.7257 13.8341 14.875 13.4583 14.875H10.625" stroke="white" strokeWidth="1.77083"/>
                <path d="M7.08325 12.0416L10.6249 8.49992L7.08325 4.95825" stroke="white" strokeWidth="1.77083"/>
                <path d="M10.625 8.5H2.125" stroke="white" strokeWidth="1.77083"/>
              </svg>
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

      <footer className="login-footer">
        <span>© 2026 PBMS – Parking Building Management System · </span>
        <a href="#" className="login-footer-link">Hỗ trợ</a>
        <span> · </span>
        <a href="#" className="login-footer-link">Điều khoản</a>
      </footer>
    </div>
  )
}

export default Login
