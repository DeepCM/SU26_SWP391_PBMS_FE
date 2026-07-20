const API_URL = `${import.meta.env.VITE_API_URL}/api/reports`;
import getAuthHeader from '../components/auth/authHeader';

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

async function requestReport(endpoint, params = {}) {
  const response = await fetch(
    `${API_URL}/${endpoint}${buildQuery(params)}`,
    {
      headers: getAuthHeader()
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message || `Không thể tải báo cáo: ${endpoint}`
    );
  }

  return response.json();
}

export function getOverview(params = {}) {
  return requestReport('overview', params);
}

export function getRevenue(params = {}) {
  return requestReport('revenue', params);
}

export function getTraffic(params = {}) {
  return requestReport('traffic', params);
}

export function getOccupancy(params = {}) {
  return requestReport('occupancy', params);
}

export function getSlotUsage(params = {}) {
  return requestReport('slot-usage', params);
}