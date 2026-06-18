import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getMyVehicles, createVehicle, updateVehicle } from '../../services/vehicleService';
import '../../styles/BookingPopup.css';

function VehiclePopup({ vehicle, vehicleTypes, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (vehicle) {
      reset({
        licensePlate: vehicle.licensePlate,
        vehicleTypeId: vehicle.vehicleTypeId,
        vehicleImgUrl: vehicle.vehicleImgUrl
      });
    } else {
      reset({
        licensePlate: "",
        vehicleTypeId: vehicleTypes[0]?.id
      });
    }
  }, [vehicle, vehicleTypes, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Backend expects multipart/form-data with these exact field names
      // (VehicleRequest.cs: VehicleTypeId, LicensePlate, VehicleImage).
      const formData = new FormData();
      formData.append("VehicleTypeId", data.vehicleTypeId);
      formData.append("LicensePlate", data.licensePlate);
      if (imageFile) {
        formData.append("VehicleImage", imageFile); // optional; omit to keep the old image
      }

      if (vehicle?.id) {
        await updateVehicle(vehicle.id, formData);
      } else {
        await createVehicle(formData);
      }

      onSave();
      onClose();
    } catch (err) {
      console.error("Save error:", err);
      alert("Lỗi khi lưu thông tin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-overlay">
      <div className="booking-popup">
        <button className="booking-close-btn" onClick={onClose}>✕</button>
        <form onSubmit={handleSubmit(onSubmit)} className="booking-form">
          <h2 className="booking-title">{vehicle ? "Chỉnh sửa xe" : "Thêm xe mới"}</h2>

          <div className="booking-group">
            <label>Loại xe</label>
            <select {...register("vehicleTypeId", { required: true })}>
              {vehicleTypes.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          <div className="booking-group">
            <label>Biển số xe</label>
            <input {...register('licensePlate', { required: true })} />
          </div>

          <div className="booking-group">
            <label>Hình ảnh xe</label>
            {/* The preview image */}
            {vehicle?.vehicleImgUrl && (
              <div className="current-image">
                <img className="qr-wrap" src={vehicle.vehicleImgUrl} alt="Current" style={{ width: '100px' }} />
                <p>Giữ nguyên ảnh cũ nếu không chọn file mới</p>
              </div>
            )}
            <div className="file-upload-container">
              <label htmlFor="file-upload" className="file-upload-btn">
                Chọn ảnh
              </label>
              <span className="file-upload-text">
                {imageFile ? imageFile.name : "Tải lên từ máy tính"}
              </span>
              <input
                id="file-upload"
                type="file"
                accept="image/*" /* This forces the file picker to show only images */
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    console.log("Setting file:", file.name);
                    setImageFile(file); // This MUST trigger the update
                  }
                }}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className='booking-submit-btn'>
            {loading ? "Đang xử lý..." : "Lưu thông tin"}
          </button>
        </form>
      </div >
    </div >
  );
}

export default VehiclePopup;