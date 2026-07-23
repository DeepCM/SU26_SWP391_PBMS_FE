import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createBooking } from '../../services/bookingService';
import { getMyVehicles } from '../../services/vehicleService';
import { getPaymentLink } from '../../services/paymentService';
import '../../styles/BookingPopup.css';

function BookingPopup({ selectedVehicle, vehicleTypes, onClose }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [vehicles, setVehicles] = useState([])
  /**
   * Lọc danh sách xe đang hoạt động và chưa có Booking/Parking Session
   */
  export const getAvailableVehicles = (vehicleList = []) => {
    return vehicleList.filter(
      (vehicle) => vehicle.isActive === true && vehicle.hasActiveBooking === false
    );
  };

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const data = await getMyVehicles();
        const availableVehicles = data.filter(
          (vehicle) => vehicle.isActive && !vehicle.hasActiveBooking
        );
        const formattedData = availableVehicles.map(item => ({
          id: item.id,
          status: item.hasActiveBooking ? 'active' : 'none',
          vehicleTypeName: item.vehicleTypeName,
          vehicleTypeId: item.vehicleTypeId,
          licensePlate: item.licensePlate,
          vehicleImgUrl: item.vehicleImgUrl
        }));
        setVehicles(formattedData);
        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi lấy phương tiện:", err);
      }
    };

    fetchVehicles();
  }, []);
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { vehicleType: selectedVehicle }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // 0. Set time
      const localDate = new Date(data.entryTime);
      const booking = await createBooking({
        vehicleId: data.vehicleId,
        scheduledCheckin: localDate.toISOString()
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
      alert(err.message || "Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const getVietnamTime = () => {
    return new Date(
      new Date().toLocaleString("en-US", {
        timeZone: "Asia/Ho_Chi_Minh"
      })
    );
  };

  const formatDateTimeLocal = (date) => {
    const pad = (n) => String(n).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const getMinDateTime = () => {
    return formatDateTimeLocal(getVietnamTime());
  };

  const getMaxDateTime = () => {
    const max = getVietnamTime();
    max.setHours(max.getHours() + 4);

    return formatDateTimeLocal(max);
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
              min={getMinDateTime()}
              max={getMaxDateTime()}
              {...register("entryTime", {
                required: "Vui lòng chọn giờ vào",
                validate: (value) => {
                  const selected = new Date(value);

                  const now = getVietnamTime();

                  const max = new Date(now);
                  max.setHours(max.getHours() + 4);

                  return (
                    selected >= now &&
                    selected <= max
                  ) || "Giờ đặt vào phải nằm trong vòng 4 giờ từ bây giờ";
                }
              })}
            />
          </div>
          <div className="booking-group">
            <label>Phương tiện</label>
            <select {...register('vehicleId', { required: true })}>
              <option value="">Chọn phương tiện</option>
              {vehicles
                .filter(v =>
                  v.status === 'none' &&
                  v.vehicleTypeName === selectedVehicleName
                )
                .map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.licensePlate}
                  </option>
                ))
              }
            </select>
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
      </div>
    </div>
  );
}

export default BookingPopup;