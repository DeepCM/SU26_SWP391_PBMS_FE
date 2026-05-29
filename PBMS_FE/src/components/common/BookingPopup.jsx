import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'

import '../../styles/BookingPopup.css'

function BookingPopup({ selectedVehicle, onClose }) {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      vehicleType: selectedVehicle,
      entryTime: '',
      duration: '',
      licensePlate: '',
      paymentConfirmed: false
    }
  })

  const onSubmit = (data) => {
    console.log(data)

    navigate('/booking')
  }

  return (
    <div className="booking-overlay">
      <div className="booking-popup">

        <button
          className="booking-close-btn"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="booking-title">
          Xác nhận đặt chỗ
        </h2>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="booking-form"
        >
            {/*}
          <div className="booking-group">
            <label>Loại xe</label>

            <input
              type="text"
              readOnly
              {...register('vehicleType')}
            />
          </div>
                */}
          <div className="booking-group">
            <label>Giờ vào</label>

            <input
              type="datetime-local"
              {...register('entryTime', {
                required: 'Vui lòng chọn giờ vào'
              })}
            />

            {errors.entryTime && (
              <span className="booking-error">
                {errors.entryTime.message}
              </span>
            )}
          </div>
            {/*
          <div className="booking-group">
            <label>Biển số xe</label>

            <input
              type="text"
              placeholder="59A-12345"
              {...register('licensePlate')}
            />
          </div>
                */}
          <div className="booking-payment">
            <h3>Thanh toán</h3>

            <p className="booking-price">
              Phí tạm tính: 15.000đ
            </p>

            <img
              src="/images/payment-qr.png"
              alt="QR Payment"
              className="booking-qr"
            />

            <p className="booking-note">
              Quét mã QR để thanh toán
            </p>
          </div>
            {/*
          <label className="booking-checkbox-row">
            <input
              type="checkbox"
              {...register('paymentConfirmed', {
                required: 'Vui lòng xác nhận thanh toán'
              })}
            />

            Tôi đã thanh toán
          </label>
                */}
          {errors.paymentConfirmed && (
            <span className="booking-error">
              {errors.paymentConfirmed.message}
            </span>
          )}

          <button
            type="submit"
            className="booking-submit-btn"
          >
            Xác nhận đặt chỗ
          </button>

        </form>
      </div>
    </div>
  )
}

export default BookingPopup