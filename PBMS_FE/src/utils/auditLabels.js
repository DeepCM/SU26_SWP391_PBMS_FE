export const ACTION_LABELS = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  DELETE: 'Xóa',
  ACTIVATE: 'Kích hoạt',
  DEACTIVATE: 'Vô hiệu hóa',
  RESET_PASSWORD: 'Đặt lại mật khẩu',
  UPDATE_ROLE: 'Chuyển vai trò',
  UPDATE_FLOOR_CAPACITY: 'Cập nhật sức chứa tầng',
  UPDATE_FLOOR_VEHICLE_TYPES: 'Cập nhật loại xe tầng',
  UNKNOWN: 'Thao tác hệ thống'
};

export function getActionLabel(action, fallback = ACTION_LABELS.UNKNOWN) {
  if (!action) return fallback;
  return ACTION_LABELS[action] || fallback;
}
