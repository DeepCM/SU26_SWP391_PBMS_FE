import {
    handleIncident,
    requestIncidentMoreInfo,
    resolveIncident,
    provideAdditionalInfo,
} from '../services/incidentService'

// Cấu hình hành động cho popup chi tiết — Manager: xử lý/yêu cầu thông tin/giải quyết.
export const MANAGER_ACTIONS_CONFIG = {
    handle: {
        label: 'Xử lý',
        formTitle: 'Ghi chú xử lý (tuỳ chọn)',
        confirmLabel: 'Xác nhận xử lý',
        requiredInput: false,
        call: (id, text) => handleIncident(id, text ? { note: text } : {}),
    },
    'request-info': {
        label: 'Yêu cầu thông tin',
        formTitle: 'Nội dung yêu cầu bổ sung',
        confirmLabel: 'Gửi yêu cầu',
        requiredInput: true,
        call: (id, text) => requestIncidentMoreInfo(id, { message: text }),
    },
    resolve: {
        label: 'Giải quyết',
        formTitle: 'Kết quả xử lý',
        confirmLabel: 'Xác nhận giải quyết',
        requiredInput: true,
        call: (id, text) => resolveIncident(id, { resolution: text }),
    },
}

export function getManagerAvailableActions(status) {
    if (status === 'open') return ['handle', 'request-info', 'resolve']
    if (status === 'in_progress') return ['handle', 'request-info', 'resolve']
    return []
}

// Cấu hình hành động cho popup chi tiết — Staff: chỉ cung cấp thêm thông tin
// khi Manager đang chờ bổ sung (pending_info).
export const STAFF_ACTIONS_CONFIG = {
    'provide-info': {
        label: 'Cung cấp thông tin',
        formTitle: 'Thông tin bổ sung',
        confirmLabel: 'Gửi thông tin',
        requiredInput: true,
        call: (id, text) => provideAdditionalInfo(id, { additionalInfo: text }),
    },
}

export function getStaffAvailableActions(status) {
    if (status === 'pending_info') return ['provide-info']
    return []
}
