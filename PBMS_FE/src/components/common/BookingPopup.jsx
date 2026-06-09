import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createBooking } from '../../services/bookingService';
import { getPaymentLink } from '../../services/paymentService';
import '../../styles/BookingPopup.css';


function BookingPopup({ selectedVehicle, vehicleTypes, onClose }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { vehicleType: selectedVehicle }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // 1. Create the booking
      const booking = await createBooking({
        vehicleTypeId: selectedVehicleInfo.id,
        licensePlate: data.licensePlate,
        scheduledCheckin: new Date(data.entryTime).toISOString()
      });

      // 2. Fetch the payment URL
      const payment = await getPaymentLink(booking.id);

      // 3. Trigger the redirect immediately
      if (payment?.paymentUrl) {
        window.open(payment.paymentUrl, "_blank", "noopener,noreferrer");
        // Optionally close the popup after redirecting
        onClose();
      }
    } catch (err) {
      console.error("Booking error:", err);
      alert("Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const getMinBookingTime = () => {
    const now = new Date();

    // UTC+7
    const utc7 = new Date(
      now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000
    );

    utc7.setHours(utc7.getHours() + 4);

    return utc7.toISOString().slice(0, 16);
  };

  const VEHICLE_OPTIONS = [
    { id: 1, name: "Xe máy" },
    { id: 2, name: "Ô tô" },
    { id: 3, name: "Xe đạp" }
  ];
  const VEHICLE_NAME_MAP = {
    "Xe máy": "Xe máy",
    "Ô tô": "Ô tô",
    "Xe máy điện": "Xe máy điện"

  };
  const selectedVehicleName = watch('vehicleType');
  const selectedVehicleInfo =
    vehicleTypes.find(
      v => v.name === selectedVehicleName
    );
  return (
    <div className="booking-overlay">
      <div className="booking-popup">
        <button className="booking-close-btn" onClick={onClose}>✕</button>

        <form onSubmit={handleSubmit(onSubmit)} className="booking-form">
          <h2 className="booking-title">Đặt chỗ {VEHICLE_NAME_MAP[selectedVehicle] || selectedVehicle}</h2>

          <div className="booking-group">
            <label>Loại xe</label>

            <select
              {...register("vehicleType", {
                required: "Vui lòng chọn loại xe"
              })}
            >
              {vehicleTypes.map(vehicle => (
                <option
                  key={vehicle.id}
                  value={vehicle.name}
                >
                  {vehicle.name}
                </option>
              ))}
            </select>
          </div>

          <div className="booking-pricing-preview">
            <div>
              <strong>Tiền cọc:</strong>{" "}
              {selectedVehicleInfo?.deposit?.toLocaleString()} VNĐ
            </div>

            <div>
              <strong>Giá theo giờ:</strong>{" "}
              {selectedVehicleInfo?.pricePerHour?.toLocaleString()} VNĐ/giờ
            </div>
          </div>
          <div className="booking-group">
            <label>Thời gian vào</label>
            <input
              type="datetime-local"
              min={getMinBookingTime()}
              {...register('entryTime', {
                required: 'Vui lòng chọn giờ vào',
                validate: (value) => {
                  const selected = new Date(value);

                  const now = new Date();
                  const utc7 = new Date(
                    now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000
                  );

                  utc7.setHours(utc7.getHours() + 4);

                  return selected >= utc7 ||
                    'Giờ vào phải cách thời điểm hiện tại ít nhất 4 giờ';
                }
              })}
            />
          </div>
          <div className="booking-group">
            <label>Biển số xe</label>
            <input {...register('licensePlate', { required: true })} placeholder="VD: 59A-12345" />
          </div>


          {errors.entryTime && (
            <span className="booking-error">
              {errors.entryTime.message}
            </span>
          )}

          <button type="submit" className="booking-submit-btn" disabled={loading}>
            {loading ? "Đang xử lý..." : "Tiếp tục thanh toán"}
          </button>
        </form>
        {/*
          <div className="booking-payment">
            <h3>Thanh toán</h3>
            <p className="booking-price">Phí tạm tính: </p>
            {/*{paymentData?.amount || '-'}*/}
        {/* The src will now use the dynamic URL from your backend 

            <p className="booking-note">Quét mã QR để hoàn tất đặt chỗ</p>
            <button className="booking-submit-btn" onClick={onClose}>Đóng</button>
          </div>
*/}
      </div>
    </div>
  );
}

export default BookingPopup;