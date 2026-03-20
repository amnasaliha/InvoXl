'use strict';

/**
 * Standardizes various date formats into YYYY-MM-DD
 * Handles: DD/MM/YYYY, DD.MM.YYYY, YYYY-MM-DD
 */
function parseToISO(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // Split by common delimiters
  const parts = trimmed.split(/[./-]/);
  if (parts.length === 3) {
    // Case: YYYY-MM-DD (but maybe with . or /)
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    // Case: DD-MM-YYYY
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }

  // Fallback to JS Date if possible
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return null;
}

module.exports = { parseToISO };
