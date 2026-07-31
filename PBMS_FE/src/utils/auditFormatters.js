/**
 * Utility functions for Administrative Audit Trail formatting.
 */

/**
 * Formats the name or identifier of an actor (Admin / Manager / System).
 * 
 * @param {string} actorName - The name or email of the user who performed the action.
 * @param {string} [fallback='Hệ thống'] - Default text if actorName is empty or missing.
 * @returns {string} Formatted actor label.
 */
export const formatAuditActor = (actorName, fallback = 'Hệ thống') => {
  if (!actorName || typeof actorName !== 'string' || !actorName.trim()) {
    return fallback;
  }
  return actorName.trim();
};

/**
 * Formats ISO date strings into localized Vietnamese datetime format (DD/MM/YYYY, HH:MM:SS).
 * 
 * @param {string|Date} dateInput - ISO timestamp or Date object.
 * @param {string} [fallback='N/A'] - Default text if date is missing or invalid.
 * @returns {string} Formatted localized date string.
 */
export const formatAuditDate = (dateInput, fallback = 'N/A') => {
  if (!dateInput) return fallback;

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh'
  }).format(date);
};