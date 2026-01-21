/**
 * Operation Detector
 *
 * Detects the type of operation (create/modify/delete) from user input
 * and filters existing tasks to only pass relevant context to the AI.
 *
 * This dramatically reduces prompt size and prevents AI confusion when
 * the database has many existing tasks.
 */

/**
 * Detects the operation type from user input
 * @param {string} userInput - Raw user input text
 * @returns {'create' | 'modify' | 'delete'} - Detected operation type
 */
export function detectOperationType(userInput) {
  if (!userInput || typeof userInput !== 'string') {
    return 'create'; // Default to create for invalid input
  }

  const input = userInput.toLowerCase().trim();

  // DELETE indicators
  if (/\b(delete|remove|cancel|clear)\b/.test(input)) {
    return 'delete';
  }

  // MODIFY indicators
  if (/\b(move|change|update|reschedule|modify|edit)\b/.test(input)) {
    return 'modify';
  }

  // References to existing tasks (likely modify or delete)
  if (/\b(last|previous|recent|that|this|my)\s+(task|one|reminder)\b/.test(input)) {
    return 'modify';
  }

  // CREATE (default) indicators
  if (/\b(add|create|new|remind|schedule|make)\b/.test(input)) {
    return 'create';
  }

  // Default: assume create for ambiguous input
  // This is safer - if we guess wrong, worst case is user has to be more explicit
  return 'create';
}

/**
 * Extracts meaningful keywords from user input
 * Used to filter tasks for modify operations
 * @param {string} userInput - Raw user input text
 * @returns {string[]} - Array of keywords
 */
function extractKeywords(userInput) {
  if (!userInput) return [];

  // Common stop words to ignore
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'be', 'been', 'are',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her',
    'this', 'that', 'these', 'those', 'move', 'change', 'update', 'task'
  ]);

  return userInput
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Filters existing tasks based on operation type
 * @param {'create' | 'modify' | 'delete'} operation - Detected operation type
 * @param {Array} existingTasks - All existing tasks
 * @param {string} userInput - Original user input for keyword matching
 * @returns {Array} - Filtered tasks array
 */
export function filterTasksForOperation(operation, existingTasks, userInput = '') {
  if (!Array.isArray(existingTasks)) {
    return [];
  }

  switch (operation) {
    case 'create':
      // No existing tasks needed for pure creation
      return [];

    case 'delete':
      // Only need recent tasks for "delete last task" operations
      // Limit to 10 to keep prompt small
      return existingTasks.slice(0, 10);

    case 'modify': {
      // Try to find tasks mentioned in the input
      const keywords = extractKeywords(userInput);

      if (keywords.length === 0) {
        // No specific keywords, return last 20 tasks
        return existingTasks.slice(0, 20);
      }

      // Filter tasks that match any keyword
      const filtered = existingTasks.filter(task => {
        const taskText = (task.text || '').toLowerCase();
        return keywords.some(keyword => taskText.includes(keyword));
      });

      if (filtered.length > 0) {
        // Found matching tasks, return them (up to 20)
        return filtered.slice(0, 20);
      }

      // No matches found, return last 20 tasks as fallback
      return existingTasks.slice(0, 20);
    }

    default:
      // Unknown operation type, return all tasks (fallback to current behavior)
      return existingTasks;
  }
}
