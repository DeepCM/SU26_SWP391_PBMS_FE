import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createBooking } from '../../services/bookingService';
import { getMyVehicles } from '../../services/vehicleService';
import { getPaymentLink } from '../../services/paymentService';
import { getPricingPreview } from '../../services/vehicleTypeService';
import '../../styles/BookingPopup.css';

function BookingPopup({ selectedVehicle, vehicleTypes = [], onClose }) {
  const [loading, setLoading] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [pricingPreview, setPricingPreview] = useState(null);
  const [pricingError, setPricingError] = useState(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      vehicleType: selectedVehicle || (vehicleTypes[0]?.name || ''),
      entryTime: '',
      vehicleId: ''
    }
  });

  const watchedVehicleType = watch('vehicleType');
  const watchedEntryTime = watch('entryTime');

  // Active Vehicle Type Configuration Object
  const currentVehicleTypeObj = vehicleTypes.find(
    (v) => v.name === watchedVehicleType || v.id === Number(watchedVehicleType)
  );

  // 1. Fetch User's Registered Vehicles on Mount
  useEffect(() => {
    let isMounted = true;
    const fetchVehicles = async () => {
      try {
        const data = await getMyVehicles();
        if (!isMounted) return;
        const availableVehicles = (data || []).filter(
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
      } catch (err) {
        console.error("Lỗi khi lấy danh sách phương tiện:", err);
      }
    };

    fetchVehicles();
    return () => { isMounted = false; };
  }, []);

  // 2. Fetch Dynamic Pricing Preview based on Selected Check-in Timestamp
  useEffect(() => {
    if (!currentVehicleTypeObj?.id) {
      setPricingPreview(null);
      return;
    }

    const controller = new AbortController();
    const fetchDynamicPricing = async () => {
      setPricingLoading(true);
      setPricingError(null);
      try {
        const entryTimeIso = watchedEntryTime ? new Date(watchedEntryTime).toISOString() : null;
        const preview = await getPricingPreview(currentVehicleTypeObj.id, entryTimeIso, { signal: controller.signal });
        setPricingPreview(preview);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Lỗi khi lấy thông tin giá:", err);
          setPricingError(err.message || "Không thể tải thông tin giá áp dụng.");
          setPricingPreview(null);
        }
      } finally {
        setPricingLoading(false);
      }
    };

    fetchDynamicPricing();
    return () => controller.abort();
  }, [currentVehicleTypeObj?.id, watchedEntryTime]);

  // 3. Reset vehicle choice when Vehicle Type selection changes
  useEffect(() => {
    setValue('vehicleId', '');
  }, [watchedVehicleType, setValue]);

  // Time Utilities
  const getVietnamTime = () => {
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
    );
    now.setSeconds(0, 0);
    return now;
  };

  const formatDateTimeLocal = (date) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const getMinDateTime = () => formatDateTimeLocal(getVietnamTime());

  const getMaxDateTime = () => {
    const max = getVietnamTime();
    const bookAheadHours = currentVehicleTypeObj?.bookAhead || 24;
    max.setHours(max.getHours() + bookAheadHours);
    return formatDateTimeLocal(max);
  };

  // Submit Handler
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const localDate = new Date(data.entryTime);
      const booking = await createBooking({
        vehicleId: Number(data.vehicleId),
        scheduledCheckin: localDate.toISOString()
      });

      const payment = await getPaymentLink(booking.id);

      if (payment?.paymentUrl) {
        window.open(payment.paymentUrl, "_blank", "noopener,noreferrer");
        onClose();
      } else {
        alert("Đã tạo đặt chỗ thành công nhưng không tìm thấy URL thanh toán.");
      }
    } catch (err) {
      console.error("Booking error:", err);
      alert(err.message || "Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(v =>
    v.status === 'none' &&
    (v.vehicleTypeName === watchedVehicleType || v.vehicleTypeId === currentVehicleTypeObj?.id)
  );

  return (
    <div className="booking-overlay">
      <div className="booking-popup">
        <button className="booking-close-btn" onClick={onClose} disabled={loading}>✕</button>

        <form onSubmit={handleSubmit(onSubmit)} className="booking-form">
          <h2 className="booking-title">
            Đặt Chỗ {currentVehicleTypeObj?.name || selectedVehicle || ''}
          </h2>

          {/* Vehicle Type Selection */}
          <div className="booking-group">
            <label>Loại xe</label>
            <select
              {...register("vehicleType", {
                required: "Vui lòng chọn loại xe"
              })}
              disabled={loading}
            >
              {vehicleTypes.map(vehicle => (
                <option key={vehicle.id} value={vehicle.name}>
                  {vehicle.name}
                </option>
              ))}
            </select>
            {errors.vehicleType && <span className="booking-error">{errors.vehicleType.message}</span>}
          </div>
          {/* Pricing Preview Box */}
          <div className="booking-pricing-preview">
            {pricingLoading ? (
              <div className="booking-pricing-loading">Đang cập nhật mức giá áp dụng...</div>
            ) : pricingError ? (
              <div className="booking-error">{pricingError}</div>
            ) : (
              <>
                <div className="booking-item">
                  <strong>Tiền cọc:</strong>{" "}
                  {(pricingPreview?.depositAmount ?? currentVehicleTypeObj?.deposit ?? 0).toLocaleString('vi-VN')} VNĐ
                </div>
                <div className="booking-item">
                  <strong>Giá theo giờ:</strong>{" "}
                  {(pricingPreview?.pricePerHour ?? currentVehicleTypeObj?.pricePerHour ?? 0).toLocaleString('vi-VN')} VNĐ/giờ
                </div>
              </>
            )}
          </div>

          {/* Entry Time Selection */}
          <div className="booking-group">
            <label>Thời gian vào bãi dự kiến</label>
            <input
              type="datetime-local"
              min={getMinDateTime()}
              max={getMaxDateTime()}
              disabled={loading}
              {...register("entryTime", {
                required: "Vui lòng chọn giờ vào",
                validate: (value) => {
                  const selected = new Date(value);
                  const now = getVietnamTime();
                  const bookAheadHours = currentVehicleTypeObj?.bookAhead || 24;

                  const max = new Date(now);
                  max.setHours(max.getHours() + bookAheadHours);

                  if (selected < now) {
                    return "Thời gian đặt không được ở trong quá khứ";
                  }
                  if (selected > max) {
                    return `Giờ đặt vào phải nằm trong vòng ${bookAheadHours} giờ từ bây giờ`;
                  }
                  return true;
                }
              })}
            />
            {errors.entryTime && <span className="booking-error">{errors.entryTime.message}</span>}
          </div>

          {/* Rule Metadata Preview */}
          <div className="booking-pricing-preview secondary">
            <div className="booking-item">
              <strong>Đặt chỗ trước tối đa:</strong>{" "}
              {(currentVehicleTypeObj?.bookAhead ?? 0).toLocaleString('vi-VN')} giờ
            </div>
            <div className="booking-item">
              <strong>Vào bãi sớm tối đa:</strong>{" "}
              {(currentVehicleTypeObj?.earlyCheckin ?? currentVehicleTypeObj?.earlyChekin ?? 0).toLocaleString('vi-VN')} phút
            </div>
            <div className="booking-item">
              <strong>Vào bãi trễ tối đa:</strong>{" "}
              {(currentVehicleTypeObj?.lateCheckin ?? currentVehicleTypeObj?.lateChekin ?? 0).toLocaleString('vi-VN')} phút
            </div>
          </div>

          {/* User Vehicle Selection */}
          <div className="booking-group">
            <label>Phương tiện của bạn</label>
            <select
              disabled={loading}
              {...register('vehicleId', { required: "Vui lòng chọn xe của bạn" })}
            >
              <option value="">-- Chọn biển số xe --</option>
              {filteredVehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.licensePlate}
                </option>
              ))}
            </select>
            {errors.vehicleId && <span className="booking-error">{errors.vehicleId.message}</span>}
            {filteredVehicles.length === 0 && (
              <small className="booking-hint">
                Bạn chưa có xe thuộc loại này hoặc phương tiện đang trong lượt gửi/đặt chỗ khác.
              </small>
            )}
          </div>

          {/* Submit Action */}
          <button type="submit" className="booking-submit-btn" disabled={loading || pricingLoading}>
            {loading ? "Đang xử lý..." : "Tiếp tục thanh toán"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default BookingPopup;