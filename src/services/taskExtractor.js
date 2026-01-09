import axios from 'axios';

// Backend proxy URL (no more direct HuggingFace calls to avoid CORS)
const BACKEND_API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

/**
 * Extract tasks using ONLY the LLM - no local parsing logic
 * The LLM is the single source of truth for all task extraction decisions
 * Now also handles task modifications and deletions
 * Calls through backend proxy to avoid CORS issues
 */
export async function extractTasksFromText(text, defaultTiming = 'tomorrow_morning', existingTasks = [], existingFolders = []) {
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

    // Format existing tasks for the prompt
    // Sort by creation time (newest first) so AI knows which is "last added"
    const existingTasksList = existingTasks
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Newest first
      .map((task, idx) =>
        `${idx + 1}. "${task.text}" (ID: ${task.id}, Due: ${task.dueDate || 'No date'} ${task.dueTime || ''}, Folder: ${task.folder || 'Personal'}, Created: ${new Date(task.createdAt).toLocaleString()})`
      )
      .join('\n');

    // Format existing folders for the prompt
    const defaultFolders = ['All Tasks', 'Work', 'Personal', 'Shopping'];
    const existingFoldersList = existingFolders.filter(f => f !== 'All Tasks').join(', ') || 'Work, Personal, Shopping';
    const customFolders = existingFolders.filter(f => !defaultFolders.includes(f));
    const customFoldersList = customFolders.length > 0 ? customFolders.join(', ') : 'None';

    // Enhanced prompt that handles both creation and modification
    const prompt = `<s>[INST] You are an intelligent task management assistant. You can CREATE new tasks, MODIFY/DELETE existing tasks, and MANAGE FOLDERS based on user input.

**Current date and time:** ${todayStr} ${currentTime}

**EXISTING TASKS (sorted by creation time, newest first):**
${existingTasksList || 'No existing tasks'}

**EXISTING FOLDERS:**
All folders: ${existingFoldersList}
Custom folders (user-created): ${customFoldersList}
Default folders (cannot be deleted): All Tasks, Work, Personal, Shopping

**Your capabilities:**
1. CREATE new tasks from user input
2. MODIFY existing tasks (reschedule, change folder, update text, change priority)
3. DELETE/CANCEL existing tasks by:
   - Task ID (from existing tasks list)
   - "Last added task" or "most recent task" (first in the list)
   - Specific date ("task on Monday", "tasks tomorrow")
   - Task text/heading ("email task", "milk task")
   - Folder ("shopping task", "work tasks")
4. Handle BULK OPERATIONS:
   - Move all tasks (by folder, date, or criteria): "move all shopping tasks to tomorrow"
   - Cancel multiple tasks: "delete all tasks on Monday"
   - Bulk modify: "change all work tasks to high priority"
   - Return multiple modify/delete actions for bulk operations
5. CREATE new folders for organizing tasks
6. DELETE custom folders (default folders are protected)

**CRITICAL RULES YOU MUST ALWAYS FOLLOW:**

1. **TASK TEXT CLEANUP** - ALWAYS clean up the task description:
   - Remove filler words: "add a reminder that", "I need to", "please", "can you", "I want to"
   - Remove duplicate words: "send a send an email" → "send an email"
   - Remove command words: "add", "create", "make a task"
   - Make it actionable: Start with a VERB (Send, Buy, Call, Email, Finish, etc.)
   - Keep it concise: Just the core action needed
   - Fix grammar: Ensure proper sentence structure

2. **FOLDER DETECTION** - ALWAYS detect the correct folder:

   **Auto-detect from keywords:**
   - Work: colleague, boss, manager, team, meeting, client, project, presentation, report, email (work context), call (work context), deadline, proposal, interview
   - Shopping: buy, groceries, milk, bread, store, shopping, purchase, pick up (items), get (items from store)
   - Personal: (default for everything else) family, friend, doctor, dentist, appointment, hobby, exercise, home

   **Explicit folder mentions (highest priority):**
   - "add to work folder" → folder: "Work"
   - "in my shopping folder" → folder: "Shopping"
   - "work task" → folder: "Work"
   - "shopping list" → folder: "Shopping"
   - "personal reminder" → folder: "Personal"

3. **FOLDER PRIORITY**:
   - If user explicitly mentions folder → USE THAT (highest priority)
   - If work keywords detected → Work folder
   - If shopping keywords detected → Shopping folder
   - Otherwise → Personal folder (default)

4. **DATE/TIME EXTRACTION** - CRITICAL FORMAT RULES:
   - ALWAYS separate date and time into TWO different fields
   - dueDate: YYYY-MM-DD format ONLY (e.g., "2026-01-09")
   - dueTime: HH:MM format ONLY (e.g., "15:30")
   - NEVER put a full datetime string (e.g., "2026-01-09 15:30") in dueTime
   - NEVER combine date and time in one field
   - When calculating relative time ("in 5 minutes", "in 2 hours"):
     1. Calculate the exact future datetime
     2. Extract date as YYYY-MM-DD → put in dueDate
     3. Extract time as HH:MM → put in dueTime
   - Examples:
     - "tomorrow" → dueDate: tomorrow's date, dueTime: null
     - "in 2 hours" → dueDate: calculated date, dueTime: calculated time (HH:MM only)
     - "this evening" → dueDate: today's date, dueTime: "18:00"

5. **QUALITY CHECKS**:
   - Task text should be 2-8 words (concise)
   - Task text should start with a verb
   - Folder should match context
   - Dates should be valid YYYY-MM-DD format

6. **FOLDER MANAGEMENT** - Handle folder operations:
   - "create a Projects folder" → create_folder action
   - "delete the Projects folder" → delete_folder action
   - "make a new Gym folder" → create_folder action
   - NEVER delete default folders (All Tasks, Work, Personal, Shopping)
   - Validate folder name (non-empty, not duplicate)
   - If task mentions new folder, create folder FIRST, then create task with that folder

**Available folders:**
- Work: professional tasks, meetings, emails, reports
- Personal: appointments, family, friends, hobbies
- Shopping: buying items, groceries, errands

**Date/time parsing:**
- "in 10 minutes" → ${formatDate(in10mins)} ${formatTime(in10mins)}
- "in 30 minutes" → ${formatDate(in30mins)} ${formatTime(in30mins)}
- "in 1 hour" → ${formatDate(in1hour)} ${formatTime(in1hour)}
- "today" → ${todayStr}
- "tomorrow" → ${formatDate(tomorrow)}
- "next Monday" → calculate from today
- "this evening" → ${todayStr} 18:00

**Action Types:**

1. **CREATE** - New task:
{
  "action": "create",
  "task": "description",
  "dueDate": "YYYY-MM-DD or null",
  "dueTime": "HH:MM or null",
  "folder": "Work|Personal|Shopping"
}

2. **MODIFY** - Update existing task:
{
  "action": "modify",
  "taskId": "task-id-from-existing-list",
  "matchedTask": "brief description of matched task",
  "changes": {
    "dueDate": "new-date" (optional),
    "dueTime": "new-time" (optional),
    "task": "new-text" (optional),
    "folder": "new-folder" (optional)
  }
}

3. **DELETE** - Remove task:
{
  "action": "delete",
  "taskId": "task-id-from-existing-list",
  "matchedTask": "brief description of matched task"
}

4. **CREATE_FOLDER** - Create new folder:
{
  "action": "create_folder",
  "folderName": "Folder Name"
}

5. **DELETE_FOLDER** - Delete folder:
{
  "action": "delete_folder",
  "folderName": "Folder Name"
}

**Matching Rules for Deletion:**

**A. Last/First Task:**
- "last added task" / "most recent task" → Task #1 (first in the list - newest)
- "first task" / "oldest task" → Last task in the list

**B. Date-Based Matching:**
- Parse natural language dates (today, tomorrow, Monday, December 10)
- Match tasks by dueDate field
- If multiple tasks on same date:
  - If text also mentions task name: match by BOTH date AND text
  - If only date mentioned: delete ALL tasks on that date

**C. Text-Based Matching:**
- Fuzzy text matching: "remove email task" → "Send email to Johannes"
- Partial matching: "cancel milk" → "Buy milk"
- Keyword matching: "delete meeting" → "Team meeting at 2pm"
- Ignore filler words: "remove the task about email" → match "email"
- Case insensitive
- If multiple matches:
  - Choose the most relevant (highest keyword overlap)
  - If still ambiguous, prefer the most recent task
  - Consider folder context: "remove work email" → Work folder

**D. General Rules:**
- Consider context from user input
- If no match found for modification/deletion, return error
- If ambiguous, prefer the most specific match

**Matching Rules for Bulk Modifications:**

**A. Folder-Based Bulk:**
- "move all shopping tasks" → Find ALL tasks with folder="Shopping"
- "reschedule all work tasks" → Find ALL tasks with folder="Work"
- Return multiple modify actions (one per task)

**B. Date-Based Bulk:**
- "move all tasks tomorrow" → Find ALL tasks with dueDate = tomorrow
- "reschedule all tasks on Monday" → Find ALL tasks with dueDate = next Monday
- Return multiple modify actions

**C. Combined Criteria:**
- "move all shopping tasks to tomorrow" → Find tasks with folder="Shopping", reschedule to tomorrow
- "change all work tasks to high priority" → Find tasks with folder="Work", change priority
- Match by folder + apply same changes to all

**D. Bulk Rules:**
- When user says "all", return multiple modify actions (one per matched task)
- Apply the same changes to all matched tasks
- If no tasks match, return error
- Always include taskId and matchedTask for each action

**Examples:**

**Create Examples (showing text cleanup and folder detection):**

Input: "Add a new task: call the doctor tomorrow"
Output: [{"action": "create", "task": "Call doctor", "dueDate": "${formatDate(tomorrow)}", "dueTime": "09:00", "folder": "Personal"}]

Input: "add a reminder that I need to send an email to my colleague"
→ Cleanup: remove "add a reminder that I need to"
→ Detect: "colleague" = Work keyword
Output: [{"action": "create", "task": "Send email to colleague", "dueDate": null, "dueTime": null, "folder": "Work"}]

Input: "I need to buy milk from the store"
→ Cleanup: remove "I need to"
→ Detect: "buy" and "store" = Shopping keywords
Output: [{"action": "create", "task": "Buy milk", "dueDate": null, "dueTime": null, "folder": "Shopping"}]

Input: "please add a task to call my boss tomorrow morning"
→ Cleanup: remove "please add a task to"
→ Detect: "boss" = Work keyword
Output: [{"action": "create", "task": "Call boss", "dueDate": "${formatDate(tomorrow)}", "dueTime": "09:00", "folder": "Work"}]

Input: "add buy groceries to shopping folder"
→ Cleanup: remove "add", keep action
→ Detect: "shopping folder" = explicit mention (highest priority)
Output: [{"action": "create", "task": "Buy groceries", "dueDate": null, "dueTime": null, "folder": "Shopping"}]

Input: "create a work task to finish the presentation by friday"
→ Cleanup: remove "create a work task to"
→ Detect: "work task" = explicit Work folder
→ Extract: "by friday" = date
Output: [{"action": "create", "task": "Finish presentation", "dueDate": "2025-12-13", "dueTime": null, "folder": "Work"}]

Input: "I want to schedule a meeting with the team next week"
→ Cleanup: remove "I want to schedule"
→ Detect: "meeting" and "team" = Work keywords
Output: [{"action": "create", "task": "Meeting with team", "dueDate": "2025-12-16", "dueTime": "10:00", "folder": "Work"}]

Input: "add a reminder that I need to pick up bread and milk"
→ Cleanup: remove "add a reminder that I need to"
→ Detect: "pick up" + food items = Shopping
Output: [{"action": "create", "task": "Pick up bread and milk", "dueDate": null, "dueTime": null, "folder": "Shopping"}]

Input: "add a new task for next 5 minutes"
→ Cleanup: remove "add a new task for"
→ Calculate: current time + 5 minutes = ${formatDate(in10mins)} ${formatTime(in10mins)}
→ CRITICAL: ALWAYS split date and time into separate fields
Output: [{"action": "create", "task": "New task", "dueDate": "${formatDate(in10mins)}", "dueTime": "${formatTime(in10mins)}", "folder": "Personal"}]

Input: "remind me in 30 minutes"
→ Calculate: current time + 30 minutes = ${formatDate(in30mins)} ${formatTime(in30mins)}
→ CRITICAL: dueDate gets YYYY-MM-DD, dueTime gets HH:MM (NEVER combine them)
Output: [{"action": "create", "task": "Reminder", "dueDate": "${formatDate(in30mins)}", "dueTime": "${formatTime(in30mins)}", "folder": "Personal"}]

**Time Calculation Examples (CRITICAL):**

CRITICAL TIME CALCULATION RULES:
- "in X minutes" / "for X minutes" = current time + X minutes
- "in X hours" = current time + X hours
- NEVER round to nearest hour unless explicitly requested
- ALWAYS calculate exact time from current moment
- Current exact time is: ${currentTime}

Current exact time for examples: ${currentTime}

Input: "add a new reminder for 5 minutes"
→ Current time: ${currentTime}
→ Calculation: ${currentTime} + 5 minutes = ${formatTime(new Date(now.getTime() + 5 * 60000))}
→ CRITICAL: "for 5 minutes" means FROM NOW, not a specific time
Output: [{"action": "create", "task": "Reminder", "dueDate": "${formatDate(new Date(now.getTime() + 5 * 60000))}", "dueTime": "${formatTime(new Date(now.getTime() + 5 * 60000))}", "folder": "Personal"}]

Input: "remind me in 10 minutes to call"
→ Current time: ${currentTime}
→ Calculation: ${currentTime} + 10 minutes = ${formatTime(new Date(now.getTime() + 10 * 60000))}
→ CRITICAL: Calculate from current exact time, not rounded hours
Output: [{"action": "create", "task": "Call", "dueDate": "${formatDate(new Date(now.getTime() + 10 * 60000))}", "dueTime": "${formatTime(new Date(now.getTime() + 10 * 60000))}", "folder": "Personal"}]

**CRITICAL: Always calculate from ${currentTime}, not from rounded hours!**

**Modify Examples:**

Input: "Move my email task to tomorrow at 3pm"
→ Find task containing "email" and reschedule it
Output: [{"action": "modify", "taskId": "123", "matchedTask": "Send email to Johannes", "changes": {"dueDate": "${formatDate(tomorrow)}", "dueTime": "15:00"}}]

Input: "Change my work meeting to high priority"
Output: [{"action": "modify", "taskId": "789", "matchedTask": "Team meeting", "changes": {"priority": "high"}}]

Input: "Move all shopping tasks to tomorrow"
→ Find ALL tasks in Shopping folder and reschedule them
Output: [
  {"action": "modify", "taskId": "111", "matchedTask": "Buy milk", "changes": {"dueDate": "${formatDate(tomorrow)}"}},
  {"action": "modify", "taskId": "222", "matchedTask": "Buy bread", "changes": {"dueDate": "${formatDate(tomorrow)}"}}
]

Input: "Reschedule all work tasks to next Monday at 9am"
→ Find ALL tasks in Work folder and reschedule them
Output: [
  {"action": "modify", "taskId": "333", "matchedTask": "Team meeting", "changes": {"dueDate": "2025-12-16", "dueTime": "09:00"}},
  {"action": "modify", "taskId": "444", "matchedTask": "Send report", "changes": {"dueDate": "2025-12-16", "dueTime": "09:00"}}
]

Input: "Move all tasks tomorrow to next week"
→ Find ALL tasks with dueDate = tomorrow and reschedule
Output: [
  {"action": "modify", "taskId": "555", "matchedTask": "Task A", "changes": {"dueDate": "2025-12-16"}},
  {"action": "modify", "taskId": "666", "matchedTask": "Task B", "changes": {"dueDate": "2025-12-16"}}
]

**Delete Examples:**

Input: "Remove the last added task"
→ Delete task #1 (most recent, first in the list)
Output: [{"action": "delete", "taskId": "123", "matchedTask": "Most recent task"}]

Input: "Cancel my most recent task"
→ Same as above
Output: [{"action": "delete", "taskId": "123", "matchedTask": "Most recent task"}]

Input: "Delete the milk shopping"
→ Find shopping task about milk
Output: [{"action": "delete", "taskId": "456", "matchedTask": "Buy milk"}]

Input: "Remove task on tomorrow"
→ Find task with dueDate = ${formatDate(tomorrow)}
Output: [{"action": "delete", "taskId": "789", "matchedTask": "Team meeting"}]

Input: "Cancel all tasks on Monday"
→ Find ALL tasks with dueDate matching next Monday
Output: [
  {"action": "delete", "taskId": "111", "matchedTask": "Task 1"},
  {"action": "delete", "taskId": "222", "matchedTask": "Task 2"}
]

Input: "Delete the email task"
→ Fuzzy match: task with "email" in text
Output: [{"action": "delete", "taskId": "999", "matchedTask": "Send email to Johannes"}]

Input: "Remove meeting with Johannes on December 10"
→ Match by BOTH text ("meeting", "Johannes") AND date (2025-12-10)
Output: [{"action": "delete", "taskId": "555", "matchedTask": "Team meeting with Johannes"}]

**Folder Management Examples:**

Input: "create a new folder called Projects"
→ Create new folder
Output: [{"action": "create_folder", "folderName": "Projects"}]

Input: "make a Fitness folder"
→ Create new folder
Output: [{"action": "create_folder", "folderName": "Fitness"}]

Input: "delete the Projects folder"
→ Delete custom folder (not default)
Output: [{"action": "delete_folder", "folderName": "Projects"}]

Input: "add a task to my new Gym folder: workout tomorrow"
→ Create folder FIRST, then task
Output: [
  {"action": "create_folder", "folderName": "Gym"},
  {"action": "create", "task": "Workout", "dueDate": "${formatDate(tomorrow)}", "dueTime": null, "folder": "Gym"}
]

Input: "create Projects folder and add prepare presentation task"
→ Create folder and task together
Output: [
  {"action": "create_folder", "folderName": "Projects"},
  {"action": "create", "task": "Prepare presentation", "dueDate": null, "dueTime": null, "folder": "Projects"}
]

**Now process this user input:**
"${text}"

**Return ONLY a valid JSON array of actions:**
[{action-object-here}]

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
            console.log('✅ [LLM] Successfully extracted', parsed.length, 'actions');

            // Process actions - handle both old format (backward compatible) and new format
            const processedActions = parsed.map(item => {
              // Check if it's new action-based format
              if (item.action) {
                return item; // Return as-is for action-based format
              }
              // Old format - convert to create action
              if (item.task) {
                return {
                  action: 'create',
                  task: item.task.trim(),
                  dueDate: item.dueDate && item.dueDate !== 'null' ? item.dueDate : null,
                  dueTime: item.dueTime && item.dueTime !== 'null' ? item.dueTime : null,
                  folder: item.folder || 'Personal',
                };
              }
              return null;
            }).filter(Boolean);

            if (processedActions.length === 0) {
              throw new Error('No valid actions extracted');
            }

            console.log('✅ [LLM] Final actions:', processedActions);
            return processedActions;
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
