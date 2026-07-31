import getAuthHeader from '../components/auth/authHeader';

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/admin/activity-logs`;

function buildParams(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  return params;
}

export async function getActivityLogs(filters = {}, { signal } = {}) {
  const params = buildParams(filters);
  const response = await fetch(`${BASE_URL}?${params.toString()}`, {
    headers: getAuthHeader(),
    cache: 'no-store',
    signal
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Không thể tải nhật ký hệ thống.');
  }

  return data;
}

export async function getActivityLogById(id, { signal } = {}) {
  const response = await fetch(`${BASE_URL}/${id}`, {
    headers: getAuthHeader(),
    cache: 'no-store',
    signal
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Không thể tải chi tiết nhật ký.');
  }

  return data;
}
