import axios from 'axios';

// Backend proxy URL (no more direct HuggingFace calls to avoid CORS)
const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

/**
 * Extract tasks using ONLY the LLM - no local parsing logic
 * The LLM is the single source of truth for all task extraction decisions
 * Calls through backend proxy to avoid CORS issues
 */
export async function extractTasksFromText(text, defaultTiming = 'tomorrow_morning') {
  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  try {
    console.log('🤖 [LLM] Sending to AI for task extraction:', text);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format

    // Calculate example times for the prompt
    const in10mins = new Date(now.getTime() + 10 * 60000);
    const in30mins = new Date(now.getTime() + 30 * 60000);
    const in1hour = new Date(now.getTime() + 60 * 60000);

    const formatTime = (date) => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Simple, direct prompt - let LLM make all decisions
    const prompt = `<s>[INST] You are an intelligent task extraction assistant. Your job is to analyze user input and extract actionable tasks.

**Your responsibilities:**
1. Identify all distinct tasks in the user's text
2. Create clean, actionable task descriptions
3. Determine appropriate due dates and times
4. Categorize tasks into the best folder

**Current date and time:** ${todayStr} ${currentTime}

**Available folders:**
- Work: professional tasks, meetings, emails, reports, work-related calls
- Personal: appointments, family, friends, hobbies, personal errands
- Shopping: buying items, groceries, shopping errands

**Date/time parsing guidelines:**
- "in 10 minutes" → ${formatDate(in10mins)} ${formatTime(in10mins)}
- "in 30 minutes" → ${formatDate(in30mins)} ${formatTime(in30mins)}
- "in 1 hour" → ${formatDate(in1hour)} ${formatTime(in1hour)}
- "today" → ${todayStr}
- "tomorrow" → ${formatDate(tomorrow)}
- "this evening" → ${todayStr} 18:00
- "tomorrow morning" → ${formatDate(tomorrow)} 09:00

**Smart defaults (if no date/time mentioned):**
- Use "${defaultTiming}" as the default timing strategy
- If defaultTiming is "tomorrow_morning": use tomorrow at 09:00
- If defaultTiming is "end_of_today": use today at 23:59
- Shopping tasks: default to weekend morning (Saturday 10:00 AM)
- Work tasks: default to next business day afternoon (14:00)
- Urgent tasks: default to 1 hour from now

**Important rules:**
1. Merge incomplete phrases: "I need to write I need to send an email" → ONE task: "Write and send an email"
2. Split clear separate tasks: "send email and buy milk" → TWO tasks
3. Remove filler words: "I need to", "please", "don't forget to"
4. Keep important details: names, specifics, context
5. Choose the most appropriate folder based on task content

**Examples:**

Input: "I need to write I need to send an email to Johannes in 10 minutes and call a friend"
Output: [
  {"task": "Write and send an email to Johannes", "dueDate": "${formatDate(in10mins)}", "dueTime": "${formatTime(in10mins)}", "folder": "Work"},
  {"task": "Call a friend", "dueDate": "${formatDate(in10mins)}", "dueTime": "${formatTime(in10mins)}", "folder": "Personal"}
]

Input: "buy milk and eggs tomorrow"
Output: [
  {"task": "Buy milk and eggs", "dueDate": "${formatDate(tomorrow)}", "dueTime": "10:00", "folder": "Shopping"}
]

Input: "meeting at 2pm then email the team"
Output: [
  {"task": "Meeting", "dueDate": "${todayStr}", "dueTime": "14:00", "folder": "Work"},
  {"task": "Email the team", "dueDate": "${todayStr}", "dueTime": "14:30", "folder": "Work"}
]

**Now extract tasks from this user input:**
"${text}"

**Return ONLY a valid JSON array in this exact format:**
[{"task": "description", "dueDate": "YYYY-MM-DD or null", "dueTime": "HH:MM or null", "folder": "Work|Personal|Shopping"}]

JSON:
[/INST]`;

    // Call backend proxy instead of HuggingFace directly
    const response = await axios.post(
      `${BACKEND_API_URL}/api/extract-tasks`,
      { prompt },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 35000, // 35 second timeout
      }
    );

    // Parse the AI response
    if (response.data && response.data[0] && response.data[0].generated_text) {
      const generatedText = response.data[0].generated_text;
      console.log('🤖 [LLM] Raw AI response:', generatedText);

      try {
        // Try to extract JSON from the response
        const jsonMatch = generatedText.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log('✅ [LLM] Successfully extracted', parsed.length, 'tasks');

            // Validate and clean the data
            const validTasks = parsed
              .filter(item => item.task && item.task.trim().length > 0)
              .map(item => ({
                task: item.task.trim(),
                dueDate: item.dueDate && item.dueDate !== 'null' ? item.dueDate : null,
                dueTime: item.dueTime && item.dueTime !== 'null' ? item.dueTime : null,
                folder: item.folder || 'Personal',
              }));

            if (validTasks.length === 0) {
              throw new Error('No valid tasks extracted');
            }

            console.log('✅ [LLM] Final tasks:', validTasks);
            return validTasks;
          }
        }
        throw new Error('Could not find valid JSON in AI response');
      } catch (jsonError) {
        console.error('❌ [LLM] Failed to parse AI response:', jsonError.message);
        console.error('❌ [LLM] Generated text was:', generatedText);
        throw new Error('AI returned invalid response format. Please try rephrasing your input.');
      }
    }

    throw new Error('AI did not return a response. Please try again.');

  } catch (error) {
    console.error('❌ [LLM] Error:', error.message);
    console.error('❌ [LLM] Full error:', error);

    // Provide helpful error messages
    if (error.code === 'ECONNREFUSED' || error.message.includes('ECONNREFUSED')) {
      throw new Error('❌ Backend server is not running!\n\nPlease start it in a separate terminal:\n1. Open a new terminal\n2. Run: npm run server\n3. Wait for "Task Assistant Backend running" message\n4. Then try again');
    } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      throw new Error('❌ Cannot connect to backend server at http://localhost:3001\n\nMake sure the backend server is running with: npm run server');
    } else if (error.message.includes('timeout')) {
      throw new Error('AI request timed out. Please try again with simpler input.');
    } else if (error.message.includes('invalid response')) {
      throw error; // Already has good message
    } else if (error.response?.data?.error) {
      throw new Error(`Backend error: ${error.response.data.error}`);
    } else {
      // Don't hide the real error - show it to help debug
      throw new Error(`Failed to extract tasks: ${error.message}\n\nCheck console for details.`);
    }
  }
}

/**
 * Legacy function kept for compatibility
 */
export async function extractTasksWithAI(text) {
  return extractTasksFromText(text);
}
