import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getMyVehicles, createVehicle, updateVehicle } from '../../services/vehicleService';
import '../../styles/BookingPopup.css';

function VehiclePopup({ vehicle, vehicleTypes, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  useEffect(() => {
    if (vehicle) {
      reset({
        licensePlate: vehicle.licensePlate,
        vehicleTypeId: vehicle.vehicleTypeId,
        // Add other fields you want to prefill
      });
    } else {
      reset({
        licensePlate: "",
        vehicleTypeId: vehicleTypes[0]?.id
      });
    }
  }, [vehicle, vehicleTypes, reset])

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("VehicleTypeId", data.vehicleTypeId);
      formData.append("LicensePlate", data.licensePlate);

      // Only append the file if the user selected one
      if (imageFile) {
        formData.append("VehicleImage", imageFile);
      }

      // Your service must be updated to handle FormData instead of JSON
      if (vehicle?.id) {
        await updateVehicle(vehicle.id, formData);
      } else {
        await createVehicle(formData);
      }

      onSave();
      onClose();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setLoading(false);
    }
  };
  // This function now talks to your cloud service
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "PBMS_FE_");

    console.log("Uploading file to Cloudinary...", file);

    try {
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dc1oi7y1i/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      console.log("Cloudinary Response:", data); // Check if this shows 'secure_url'

      if (!response.ok) {
        throw new Error(data.error?.message || "Upload failed");
      }

      return data.secure_url;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };
  {/*
  const handleClose = () => {
  setImageFile(null); // Clear the file selection
  onClose();          // Call the original close handler
};
// ... In your JSX
<button className="booking-close-btn" onClick={handleClose}>✕</button>
*/}
  return (
    <div className="booking-overlay">
      <div className="booking-popup">
        <button className="booking-close-btn" onClick={onClose}>✕</button>
        <form onSubmit={handleSubmit(onSubmit)} className="booking-form">
          <h2 className="booking-title">
            {vehicle ? "Chỉnh sửa xe" : "Thêm xe mới"}
          </h2>

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

            {/* Show current image if in update mode */}
            {vehicle?.vehicleImgUrl && (
              <div className="current-image">
                <img className="qr-wrap" src={vehicle.vehicleImgUrl} alt="Current" style={{ width: '100px' }} />
                <p>Giữ nguyên ảnh cũ nếu không chọn file mới</p>
              </div>
            )}

            <input type="file" onChange={(e) => setImageFile(e.target.files[0])} />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Đang xử lý..." : "Lưu thông tin"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default VehiclePopup;