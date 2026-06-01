import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createBooking } from '../../services/bookingService';
import { getPaymentLink } from '../../services/paymentService';
import '../../styles/BookingPopup.css';


function BookingPopup({ selectedVehicle, vehicleTypeId, onClose }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { vehicleType: selectedVehicle }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // 1. Create the booking
      const booking = await createBooking({
        vehicleTypeId: vehicleTypeId,
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
  const VEHICLE_NAME_MAP = {
    "Xe máy": "Xe máy",
    "Ô tô": "Ô tô",
    "Xe đạp": "Xe máy điện"
    
  };


  return (
    <div className="booking-overlay">
      <div className="booking-popup">
        <button className="booking-close-btn" onClick={onClose}>✕</button>


          <form onSubmit={handleSubmit(onSubmit)} className="booking-form">
            <h2 className="booking-title">Đặt chỗ {VEHICLE_NAME_MAP[selectedVehicle] || selectedVehicle}</h2>

            <div className="booking-group">
              <label>Giờ vào</label>
              <input type="datetime-local" {...register('entryTime', { required: true })} />
            </div>

            <div className="booking-group">
              <label>Biển số xe</label>
              <input {...register('licensePlate', { required: true })} placeholder="VD: 59A-12345" />
            </div>

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