/**
 * Smart Default Date/Time Selector
 * Provides intelligent defaults for tasks based on content and user preferences
 */

/**
 * Get smart default date and time based on task text
 * @param {string} taskText - The task description
 * @param {string} defaultMode - User's preferred default mode
 * @returns {object} { dueDate: 'YYYY-MM-DD', dueTime: 'HH:MM', reason: 'why this default' }
 */
export function getSmartDefaults(taskText, defaultMode = 'tomorrow_morning') {
  console.log('✨ [getSmartDefaults] Called:', {
    taskText,
    defaultMode,
    timestamp: new Date().toISOString()
  });

  const text = taskText.toLowerCase();

  // If user disabled defaults, return null
  if (defaultMode === 'manual') {
    const result = { dueDate: null, dueTime: null, reason: null };
    console.log('✨ [getSmartDefaults] Manual mode - returning nulls:', result);
    return result;
  }

  // Smart defaults mode - analyze task text
  if (defaultMode === 'smart') {
    // URGENT / ASAP - within 1 hour
    if (/\b(urgent|asap|immediately|right now|quick)\b/.test(text)) {
      const now = new Date();
      now.setHours(now.getHours() + 1);
      return {
        dueDate: formatDate(now),
        dueTime: formatTime(now),
        reason: 'Urgent task - 1 hour from now'
      };
    }

    // TODAY mentioned - end of today
    if (/\b(today|this evening|tonight)\b/.test(text)) {
      const today = new Date();
      return {
        dueDate: formatDate(today),
        dueTime: '17:00',
        reason: 'Today - End of workday'
      };
    }

    // SHOPPING / ERRANDS - Saturday morning
    if (/\b(buy|shop|grocery|groceries|store|market|pick up|purchase|errand)\b/.test(text)) {
      const saturday = getNextDayOfWeek(6); // Saturday
      return {
        dueDate: formatDate(saturday),
        dueTime: '10:00',
        reason: 'Shopping task - Weekend morning'
      };
    }

    // MEETINGS / CALLS - Next business day afternoon
    if (/\b(meeting|call|conference|zoom|teams|discuss|sync|standup)\b/.test(text)) {
      const nextBusinessDay = getNextBusinessDay();
      return {
        dueDate: formatDate(nextBusinessDay),
        dueTime: '14:00',
        reason: 'Meeting - Tomorrow afternoon'
      };
    }

    // EMAIL / COMMUNICATION - End of today or tomorrow
    if (/\b(email|send|reply|respond|message|text|contact|reach out)\b/.test(text)) {
      const now = new Date();
      const hour = now.getHours();

      // If it's already late (after 5 PM), default to tomorrow morning
      if (hour >= 17) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return {
          dueDate: formatDate(tomorrow),
          dueTime: '09:00',
          reason: 'Communication - Tomorrow morning'
        };
      } else {
        // Still time today
        return {
          dueDate: formatDate(now),
          dueTime: '18:00',
          reason: 'Communication - End of workday'
        };
      }
    }

    // WORK / REPORT / DOCUMENT - Next business day EOD
    if (/\b(report|document|presentation|proposal|review|submit|deadline|project|task)\b/.test(text)) {
      const nextBusinessDay = getNextBusinessDay();
      return {
        dueDate: formatDate(nextBusinessDay),
        dueTime: '17:00',
        reason: 'Work task - Tomorrow end of day'
      };
    }

    // PERSONAL / APPOINTMENT - Next weekday morning
    if (/\b(doctor|dentist|appointment|haircut|checkup|visit)\b/.test(text)) {
      const nextBusinessDay = getNextBusinessDay();
      return {
        dueDate: formatDate(nextBusinessDay),
        dueTime: '10:00',
        reason: 'Appointment - Next weekday morning'
      };
    }

    // EXERCISE / GYM - Tomorrow morning
    if (/\b(gym|workout|exercise|run|jog|fitness|yoga)\b/.test(text)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return {
        dueDate: formatDate(tomorrow),
        dueTime: '07:00',
        reason: 'Exercise - Tomorrow morning'
      };
    }

    // No specific keywords detected - fall back to tomorrow morning
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const result = {
      dueDate: formatDate(tomorrow),
      dueTime: '09:00',
      reason: 'Default - Tomorrow morning'
    };
    console.log('✨ [getSmartDefaults] Smart mode - no keywords matched, using default:', result);
    return result;
  }

  // Simple preset defaults based on user preference
  let result;
  switch (defaultMode) {
    case 'end_of_today': {
      const today = new Date();
      result = {
        dueDate: formatDate(today),
        dueTime: '23:59',
        reason: 'User default - End of today'
      };
      break;
    }

    case 'tomorrow_morning': {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      result = {
        dueDate: formatDate(tomorrow),
        dueTime: '09:00',
        reason: 'User default - Tomorrow morning'
      };
      break;
    }

    case 'next_business_day': {
      const nextBusiness = getNextBusinessDay();
      result = {
        dueDate: formatDate(nextBusiness),
        dueTime: '09:00',
        reason: 'User default - Next business day'
      };
      break;
    }

    default: {
      // Default fallback: tomorrow morning
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      result = {
        dueDate: formatDate(tomorrow),
        dueTime: '09:00',
        reason: 'Default - Tomorrow morning'
      };
      break;
    }
  }

  console.log('✨ [getSmartDefaults] Preset mode result:', { defaultMode, result });
  return result;
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
 * Format time as HH:MM
 */
function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Get next occurrence of a specific day of week
 * @param {number} dayOfWeek - 0 (Sunday) to 6 (Saturday)
 */
function getNextDayOfWeek(dayOfWeek) {
  const today = new Date();
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
 * Get next business day (Monday-Friday)
 * If today is Friday, returns Monday
 * Otherwise returns tomorrow
 */
function getNextBusinessDay() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const tomorrowDay = tomorrow.getDay();

  // If tomorrow is Saturday (6), add 2 days to get Monday
  if (tomorrowDay === 6) {
    tomorrow.setDate(tomorrow.getDate() + 2);
  }
  // If tomorrow is Sunday (0), add 1 day to get Monday
  else if (tomorrowDay === 0) {
    tomorrow.setDate(tomorrow.getDate() + 1);
  }

  return tomorrow;
}

/**
 * Check if defaults should be applied
 * @param {string} dueDate - Existing due date (may be null)
 * @param {string} dueTime - Existing due time (may be null)
 * @returns {boolean} - True if we should apply defaults
 */
export function shouldApplyDefaults(dueDate, dueTime) {
  // Apply defaults only if both date AND time are missing
  // If user specified either one, respect their input
  const result = !dueDate && !dueTime;

  console.log('🔍 [shouldApplyDefaults] Evaluation:', {
    dueDate,
    dueDateType: typeof dueDate,
    dueDateLength: dueDate?.length,
    dueDateFalsy: !dueDate,
    dueTime,
    dueTimeType: typeof dueTime,
    dueTimeFalsy: !dueTime,
    result,
    timestamp: new Date().toISOString()
  });

  return result;
}
