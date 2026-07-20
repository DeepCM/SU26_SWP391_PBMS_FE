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
  // Tạo URL đầy đủ để log cho dễ theo dõi
  const fullUrl = `${API_URL}/${endpoint}${buildQuery(params)}`;
  
  const response = await fetch(
    fullUrl,
    {
      headers: getAuthHeader()
    }
  );

  // ─── PHẦN THÊM VÀO ĐỂ LOG RAW CONTENT ──────────────────────────────────
  // 1. Tạo một bản sao của response. Stream thô chỉ được đọc một lần,
  // nên ta cần bản sao này để log mà không ảnh hưởng tới logic xử lý bên dưới.
  const responseCloneForLog = response.clone();

  // 2. Đọc nội dung thô dưới dạng văn bản (Text)
  responseCloneForLog.text()
    .then(rawText => {
      console.group(`[BE Response Raw] GET ${endpoint}`); // Nhóm log lại cho gọn
      console.log(`URL: ${fullUrl}`);
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log("Raw Content:", rawText); // ĐÂY LÀ NỘI DUNG THÔ
      
      // Thêm log thử parse JSON nếu nội dung không trống để dễ debug
      if (rawText) {
        try {
          console.log("As Parsed JSON:", JSON.parse(rawText));
        } catch (e) {
          console.warn("Nội dung không phải là JSON hợp lệ.");
        }
      }
      console.groupEnd();
    })
    .catch(err => {
      console.error(`Lỗi khi đọc raw content từ ${endpoint}:`, err);
    });
  // ───────────────────────────────────────────────────────────────────────

  if (!response.ok) {
    // Luồng xử lý lỗi gốc (sẽ đọc stream của `response` gốc)
    const errorData = await response.json().catch(() => ({}));

    throw new Error(
      errorData.message || `Không thể tải báo cáo: ${endpoint}`
    );
  }

  // Luồng trả về dữ liệu thành công gốc
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