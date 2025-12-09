/**
 * AI Detection Service
 * Automatically determines when AI extraction should be used vs simple task creation
 */

/**
 * Determines if AI extraction should be used for the given input
 * @param {string} input - User's text input
 * @param {Array} existingTasks - List of existing tasks for modification/deletion detection
 * @returns {boolean} - True if AI should be used, false for simple task creation
 */
export function shouldUseAI(input, existingTasks = []) {
  if (!input || !input.trim()) {
    return false;
  }

  const text = input.toLowerCase().trim();

  // 1. Multiple tasks detected (AND, commas, newlines, semicolons)
  if (/\b(and then|and also|and|also|plus|then)\b/.test(text) ||
      text.includes(',') ||
      text.includes('\n') ||
      text.includes(';')) {
    console.log('🔍 [AI Detector] Multiple tasks detected');
    return true;
  }

  // 2. Modification keywords
  if (/\b(move|change|update|reschedule|modify|shift|postpone|advance)\b/.test(text)) {
    console.log('🔍 [AI Detector] Modification keywords detected');
    return true;
  }

  // 3. Deletion keywords
  if (/\b(remove|delete|cancel|drop|clear)\b/.test(text)) {
    console.log('🔍 [AI Detector] Deletion keywords detected');
    return true;
  }

  // 4. Bulk operations
  if (/\b(all tasks|all my|every task|everything)\b/.test(text)) {
    console.log('🔍 [AI Detector] Bulk operation detected');
    return true;
  }

  // 5. References to existing tasks ("my email task", "the meeting")
  if (/\b(my |the |that )(task|meeting|email|call|appointment)\b/.test(text)) {
    console.log('🔍 [AI Detector] Reference to existing task detected');
    return true;
  }

  // 6. Multiple sentences (more than one period or question mark)
  const sentenceCount = (text.match(/[.!?]/g) || []).length;
  if (sentenceCount >= 2) {
    console.log('🔍 [AI Detector] Multiple sentences detected');
    return true;
  }

  // 7. Very long input (likely contains multiple tasks or complex instructions)
  if (text.length > 150) {
    console.log('🔍 [AI Detector] Long input detected (>150 chars)');
    return true;
  }

  // Default: Use simple mode for straightforward single tasks
  console.log('🔍 [AI Detector] Simple task detected - no AI needed');
  return false;
}

/**
 * Get human-readable reason why AI was triggered
 * @param {string} input - User's text input
 * @returns {string} - Human-readable detection reason
 */
export function getDetectionReason(input) {
  if (!input || !input.trim()) {
    return '';
  }

  const text = input.toLowerCase().trim();

  if (/\b(and then|and also|and|also|plus|then)\b/.test(text) ||
      text.includes(',') || text.includes('\n') || text.includes(';')) {
    return 'Multiple tasks detected';
  }

  if (/\b(move|change|update|reschedule|modify|shift|postpone|advance)\b/.test(text)) {
    return 'Task modification detected';
  }

  if (/\b(remove|delete|cancel|drop|clear)\b/.test(text)) {
    return 'Task deletion detected';
  }

  if (/\b(all tasks|all my|every task|everything)\b/.test(text)) {
    return 'Bulk operation detected';
  }

  if (/\b(my |the |that )(task|meeting|email|call|appointment)\b/.test(text)) {
    return 'Reference to existing task';
  }

  const sentenceCount = (text.match(/[.!?]/g) || []).length;
  if (sentenceCount >= 2) {
    return 'Multiple sentences detected';
  }

  if (text.length > 150) {
    return 'Complex input detected';
  }

  return 'AI processing';
}
