import { useState } from 'react'
import '../styles/Login.css'
import '../styles/Signup.css'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { registerUser, verifyEmail } from '../services/authService'
import Footer from '../components/common/Footer'
import Header from '../components/common/Header'
import {
  IconAccountCard,
  IconGoogle,
  IconProfile,
  IconEnvelope,
  IconLock,
  IconEye,
  IconSubmit
} from '../components/svg/Icons'

function Signup() {
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
        confirmPassword: data.confirmPassword,
        avatarFile: data.avatar[0]
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
      const result = await verifyEmail(registeredEmail, otp)
      if (result.status === 200) {
        alert('Xác thực email thành công')
        navigate('/login')
      } else {
        alert(result.data.message || 'Xác thực thất bại')
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
            <IconAccountCard />
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
            <IconGoogle />
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
                  <IconProfile className="login-input-icon" />
                  <input
                    type="text"
                    className="login-input"
                    placeholder=""
                    {...register('fullName', { required: 'Full name is required' })}
                  />
                </div>
                {errors.fullName && <span className="error">{errors.fullName.message}</span>}
              </div>

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
                <label className="login-field-label">Mật Khẩu</label>
                <div className="login-input-wrap">
                  <IconLock className="login-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="login-input login-input--password"
                    placeholder=""
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
                    <IconEye />
                  </button>
                </div>
                {errors.password && <span className="error">{errors.password.message}</span>}
              </div>

              <div className="login-field-group">
                <label className="login-field-label">Nhập Lại Mật Khẩu</label>
                <div className="login-input-wrap">
                  <IconLock className="login-input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="login-input login-input--password"
                    placeholder=""
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
                    <IconEye />
                  </button>
                </div>
                {errors.confirmPassword && <span className="error">{errors.confirmPassword.message}</span>}
              </div>

              <div className="login-field-group">
                <label className="login-field-label">Ảnh xác thực khuôn mặt</label>
                <div className="login-input-wrap">
                  <input
                    type="file"
                    accept="image/*"
                    className="signup-file-input"
                    {...register('avatar', { required: 'Vui lòng chọn ảnh xác thực' })}
                  />
                </div>
                {errors.avatar && <span className="error">{errors.avatar.message}</span>}
              </div>

              <button type="submit" className="login-submit-btn">
                <IconSubmit />
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
                  placeholder=""
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
