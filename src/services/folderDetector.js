/**
 * Detect appropriate folder based on task keywords
 */
export function detectFolder(taskText) {
  const text = taskText.toLowerCase();

  // Shopping keywords
  const shoppingKeywords = [
    'buy', 'shop', 'purchase', 'grocery', 'groceries', 'store',
    'market', 'mall', 'order', 'amazon', 'delivery'
  ];

  // Work keywords
  const workKeywords = [
    'meeting', 'email', 'call boss', 'call manager', 'report', 'presentation',
    'project', 'deadline', 'client', 'team', 'office', 'work', 'conference',
    'review', 'document', 'proposal', 'memo', 'colleague', 'supervisor'
  ];

  // Personal keywords
  const personalKeywords = [
    'doctor', 'dentist', 'appointment', 'gym', 'workout', 'exercise',
    'family', 'friend', 'birthday', 'call mom', 'call dad', 'visit',
    'personal', 'home', 'car', 'repair', 'maintenance', 'haircut',
    'hobby', 'book', 'read', 'watch', 'movie'
  ];

  // Check for shopping
  if (shoppingKeywords.some(keyword => text.includes(keyword))) {
    return 'Shopping';
  }

  // Check for work
  if (workKeywords.some(keyword => text.includes(keyword))) {
    return 'Work';
  }

  // Check for personal
  if (personalKeywords.some(keyword => text.includes(keyword))) {
    return 'Personal';
  }

  // Default to Personal
  return 'Personal';
}
