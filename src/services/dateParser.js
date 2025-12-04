/**
 * Parse relative time expressions (in X mins/hours)
 * Returns { date: "YYYY-MM-DD", time: "HH:MM" }
 */
export function parseRelativeTime(text) {
  const relativePattern = /in (\d+)\s*(min|mins|minute|minutes|hr|hrs|hour|hours)/i;
  const match = text.match(relativePattern);

  if (!match) return null;

  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  const now = new Date();
  let futureTime = new Date(now);

  // Add minutes or hours
  if (unit.startsWith('min')) {
    futureTime.setMinutes(futureTime.getMinutes() + amount);
  } else if (unit.startsWith('hr') || unit.startsWith('hour')) {
    futureTime.setHours(futureTime.getHours() + amount);
  }

  // Format date
  const year = futureTime.getFullYear();
  const month = String(futureTime.getMonth() + 1).padStart(2, '0');
  const day = String(futureTime.getDate()).padStart(2, '0');
  const date = `${year}-${month}-${day}`;

  // Format time
  const hours = String(futureTime.getHours()).padStart(2, '0');
  const minutes = String(futureTime.getMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;

  return { date, time };
}

/**
 * Parse time expressions into 24-hour format HH:MM
 */
export function parseTime(timeStr) {
  if (!timeStr) return null;

  const text = timeStr.toLowerCase().trim();

  // Match time patterns
  const patterns = [
    // 3pm, 3:30pm, 15:00
    /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
    // morning, afternoon, evening, night
    /^(morning|afternoon|evening|night)$/i,
    // noon, midnight
    /^(noon|midnight)$/i,
  ];

  // Check for "morning", "afternoon", etc.
  if (/morning/i.test(text)) return '09:00';
  if (/afternoon/i.test(text)) return '14:00';
  if (/evening/i.test(text)) return '18:00';
  if (/night/i.test(text)) return '20:00';
  if (/noon/i.test(text)) return '12:00';
  if (/midnight/i.test(text)) return '00:00';

  // Parse specific times
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const meridiem = match[3] ? match[3].toLowerCase() : null;

    // Convert to 24-hour format
    if (meridiem === 'pm' && hours !== 12) {
      hours += 12;
    } else if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }

    // Validate
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * Extract time from text
 * Returns { cleanText, timeStr }
 */
export function extractTimeFromText(text) {
  const timePatterns = [
    /\bat (\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i,
    /\bat (noon|midnight|morning|afternoon|evening|night)\b/i,
    /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i,
  ];

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      const timeStr = match[1] || match[0];
      const cleanText = text.replace(match[0], '').trim();
      return { cleanText, timeStr };
    }
  }

  return { cleanText: text, timeStr: null };
}

/**
 * Parse natural language date expressions into Date objects
 */
export function parseNaturalDate(dateStr) {
  if (!dateStr) return null;

  const text = dateStr.toLowerCase().trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Today
  if (text === 'today') {
    return formatDate(today);
  }

  // Tomorrow
  if (text === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
  }

  // Yesterday
  if (text === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDate(yesterday);
  }

  // This weekend / Next weekend
  if (text === 'this weekend' || text === 'weekend') {
    const saturday = getNextDayOfWeek(6);
    return formatDate(saturday);
  }

  if (text === 'next weekend') {
    const saturday = getNextDayOfWeek(6);
    saturday.setDate(saturday.getDate() + 7); // Next week's Saturday
    return formatDate(saturday);
  }

  // End of week / End of month
  if (text === 'end of week' || text === 'eow') {
    const friday = getNextDayOfWeek(5);
    return formatDate(friday);
  }

  if (text === 'end of month' || text === 'eom') {
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return formatDate(lastDay);
  }

  // Beginning/Start of week / month
  if (text === 'beginning of week' || text === 'start of week' || text === 'bow') {
    const monday = getNextDayOfWeek(1);
    return formatDate(monday);
  }

  if (text === 'beginning of month' || text === 'start of month' || text === 'bom') {
    const firstDay = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return formatDate(firstDay);
  }

  // Next [day of week]
  const nextDayMatch = text.match(/^next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (nextDayMatch) {
    const targetDay = getDayNumber(nextDayMatch[1]);
    const currentDay = today.getDay();
    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + daysUntil);
    return formatDate(nextDay);
  }

  // This [day of week]
  const thisDayMatch = text.match(/^(this )?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (thisDayMatch) {
    const targetDay = getDayNumber(thisDayMatch[2]);
    const currentDay = today.getDay();
    let daysUntil = targetDay - currentDay;
    if (daysUntil < 0) daysUntil += 7;
    const thisDay = new Date(today);
    thisDay.setDate(thisDay.getDate() + daysUntil);
    return formatDate(thisDay);
  }

  // [Day of week] morning/afternoon/evening (e.g., "Friday afternoon")
  const dayTimeMatch = text.match(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(morning|afternoon|evening|night)$/);
  if (dayTimeMatch) {
    const targetDay = getDayNumber(dayTimeMatch[1]);
    const currentDay = today.getDay();
    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysUntil);
    return formatDate(targetDate);
  }

  // In X days/weeks
  const inDaysMatch = text.match(/^in (\d+) (day|days)$/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1]);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + days);
    return formatDate(futureDate);
  }

  const inWeeksMatch = text.match(/^in (\d+) (week|weeks)$/);
  if (inWeeksMatch) {
    const weeks = parseInt(inWeeksMatch[1]);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + weeks * 7);
    return formatDate(futureDate);
  }

  // Next week/month
  if (text === 'next week') {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    return formatDate(nextWeek);
  }

  if (text === 'next month') {
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return formatDate(nextMonth);
  }

  // Try to parse as actual date string (YYYY-MM-DD, MM/DD/YYYY, etc.)
  const dateObj = new Date(dateStr);
  if (!isNaN(dateObj.getTime())) {
    return formatDate(dateObj);
  }

  return null;
}

/**
 * Convert day name to number (0 = Sunday, 6 = Saturday)
 */
function getDayNumber(dayName) {
  const days = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  return days[dayName.toLowerCase()];
}

/**
 * Get next occurrence of a specific day of week
 * @param {number} dayOfWeek - 0 (Sunday) to 6 (Saturday)
 */
function getNextDayOfWeek(dayOfWeek) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentDay = today.getDay();

  let daysUntil = dayOfWeek - currentDay;
  if (daysUntil <= 0) {
    daysUntil += 7; // Next week
  }

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysUntil);
  return targetDate;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Extract date keywords from task text
 * Returns { cleanText, dateStr, timeStr }
 */
export function extractDateFromText(text) {
  // First check for relative time (in X mins/hours)
  const relativeTime = parseRelativeTime(text);
  if (relativeTime) {
    // Remove the relative time expression from text
    const cleanText = text.replace(/in \d+\s*(?:min|mins|minute|minutes|hr|hrs|hour|hours)/i, '').trim();
    return {
      cleanText,
      dateStr: 'today', // Will be converted to actual date
      timeStr: relativeTime.time,
      relativeDateTime: relativeTime, // Pass the calculated date/time
    };
  }

  // Extract time
  const { cleanText: textWithoutTime, timeStr } = extractTimeFromText(text);

  const datePatterns = [
    // Basic dates
    /\b(today|tomorrow|yesterday)\b/i,

    // Weekend patterns
    /\b(this weekend|next weekend|weekend)\b/i,

    // Week/month end/beginning
    /\b(end of week|eow|end of month|eom|beginning of week|bow|start of week|beginning of month|bom|start of month)\b/i,

    // Days of week with modifiers
    /\b(next|this) (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,

    // Day with time of day
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(morning|afternoon|evening|night)\b/i,

    // In X days/weeks
    /\bin \d+ (day|days|week|weeks)\b/i,

    // Next week/month
    /\b(next week|next month)\b/i,

    // By/Before patterns (deadline markers)
    /\b(by|before|due by|due before) (today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b(by|before|due by|due before) next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b(by|before|due by|due before) (end of week|end of month|weekend)\b/i,

    // On patterns (specific date markers)
    /\b(on|due|due on) (today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    /\b(on|due|due on) next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  ];

  for (const pattern of datePatterns) {
    const match = textWithoutTime.match(pattern);
    if (match) {
      // Extract the date portion, removing prefixes like "by", "on", "due"
      let dateStr = match[0].replace(/^(by|on|due|before|due by|due before|due on)\s+/i, '').trim();
      const cleanText = textWithoutTime.replace(match[0], '').trim();
      return { cleanText, dateStr, timeStr };
    }
  }

  return { cleanText: textWithoutTime, dateStr: null, timeStr };
}
