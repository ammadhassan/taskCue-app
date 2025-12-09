import { useState } from 'react';
import VoiceInput from './VoiceInput';
import { extractTasksFromText } from '../services/taskExtractor';
import { getSmartDefaults, shouldApplyDefaults } from '../services/defaultDateSelector';

export default function TaskForm({ onAddTask, folders, selectedFolder, settings, tasks, onModifyTask, onDeleteTask, onAddFolder, onDeleteFolder }) {
  const [input, setInput] = useState('');
  const [showVoice, setShowVoice] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [folder, setFolder] = useState(
    selectedFolder === 'All Tasks' ? 'Personal' : selectedFolder
  );
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState('medium');

  // Helper function to apply AI-extracted actions immediately
  const applyTaskActions = (actions) => {
    actions.forEach((actionItem) => {
      if (actionItem.action === 'create') {
        // Create new task
        let taskDueDate = actionItem.dueDate || dueDate || null;
        let taskDueTime = actionItem.dueTime || dueTime || null; // AI time takes priority, fallback to manual
        const taskFolder = actionItem.folder || folder;

        // Apply smart defaults if AI didn't extract date/time
        if (shouldApplyDefaults(taskDueDate, taskDueTime)) {
          const defaults = getSmartDefaults(actionItem.task, settings?.defaultTiming || 'tomorrow_morning');
          taskDueDate = defaults.dueDate;
          taskDueTime = defaults.dueTime;
          console.log('✨ [AI Agent] Applied smart defaults:', {
            task: actionItem.task,
            defaults,
            reason: defaults.reason
          });
        } else {
          console.log('⏭️ [AI Agent] Using AI-extracted dates:', {
            task: actionItem.task,
            dueDate: taskDueDate,
            dueTime: taskDueTime
          });
        }

        onAddTask(actionItem.task, taskFolder, taskDueDate, priority, taskDueTime);
      } else if (actionItem.action === 'modify' && onModifyTask) {
        // Modify existing task
        onModifyTask(actionItem.taskId, actionItem.changes);
      } else if (actionItem.action === 'delete' && onDeleteTask) {
        // Delete existing task
        onDeleteTask(actionItem.taskId);
      } else if (actionItem.action === 'create_folder' && onAddFolder) {
        // Create new folder
        console.log('📁 [AI Agent] Creating folder:', actionItem.folderName);
        onAddFolder(actionItem.folderName);
      } else if (actionItem.action === 'delete_folder' && onDeleteFolder) {
        // Delete folder
        console.log('🗑️ [AI Agent] Deleting folder:', actionItem.folderName);
        onDeleteFolder(actionItem.folderName);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // ALWAYS use AI for all inputs - let AI handle everything
    console.log('🤖 [AI Agent] Processing with AI:', input);
    setIsExtracting(true);

    try {
      const actions = await extractTasksFromText(
        input,
        settings?.defaultTiming || 'tomorrow_morning',
        tasks || [],
        folders || []
      );

      console.log('✅ [AI Agent] AI extracted', actions.length, 'actions');

      // Immediately apply all actions (autonomous mode)
      applyTaskActions(actions);

      // Clear input only on success
      setInput('');
      setDueDate(null);
      setDueTime(null);
      setPriority('medium');

    } catch (error) {
      console.error('❌ [AI Agent] AI extraction failed:', error);
      console.error('❌ [AI Agent] Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        stack: error.stack
      });

      // Show detailed error message - DO NOT add task if AI fails
      const errorMsg = error.message || 'Unknown error';

      if (error.message?.includes('Backend server is not running') ||
          error.code === 'ECONNREFUSED' ||
          error.message?.includes('Network Error')) {
        alert(
          '❌ Backend Server Not Running!\n\n' +
          'The AI extraction needs the backend server.\n\n' +
          'To fix:\n' +
          '1. Open a NEW terminal window\n' +
          '2. Run: npm run server\n' +
          '3. Wait for "Task Assistant Backend running" message\n' +
          '4. Then try adding tasks again'
        );
      } else {
        alert(
          `❌ AI processing failed:\n\n${errorMsg}\n\n` +
          'Check browser console (F12) for details.\n\n' +
          'Task was NOT added.'
        );
      }

      // DO NOT fall back to simple mode - fail gracefully
      // Input stays in field so user can try again
    } finally {
      setIsExtracting(false);
    }
  };

  const handleVoiceTranscript = async (transcript) => {
    setInput(transcript);
    setShowVoice(false);

    // Auto-submit through AI extraction after voice input
    if (transcript.trim()) {
      console.log('🎤 [AI Agent] Processing voice input through AI:', transcript);
      setIsExtracting(true);

      try {
        const actions = await extractTasksFromText(
          transcript,
          settings?.defaultTiming || 'tomorrow_morning',
          tasks || [],
          folders || []
        );

        console.log('✅ [AI Agent] AI extracted', actions.length, 'actions from voice input');

        // Immediately apply all actions (autonomous mode)
        applyTaskActions(actions);

        // Clear input only on success
        setInput('');
        setDueDate(null);
        setDueTime(null);
        setPriority('medium');

      } catch (error) {
        console.error('❌ [AI Agent] Voice AI extraction failed:', error);

        // Show error - DO NOT add task if AI fails
        alert(
          `❌ AI processing failed:\n\n${error.message}\n\n` +
          'Task was NOT added. Please try again.'
        );

        // DO NOT fall back to simple mode
        // Input stays in field so user can try again
      } finally {
        setIsExtracting(false);
      }
    }
  };

  return (
    <div className="mb-6 space-y-3">
      {/* Voice Toggle - Keep as explicit option */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowVoice(!showVoice)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showVoice
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          🎤 Voice Input
        </button>
      </div>

      {!showVoice ? (
        <>
          {/* AI Processing Indicator - shown while extracting */}
          {isExtracting && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg animate-pulse">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400 text-lg">⏳</span>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  AI is processing your request... Please wait
                </p>
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Text Input */}
      {!showVoice && (
        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            {/* Main input row */}
            <div className="flex gap-2">
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {folders
                  .filter((f) => f !== 'All Tasks')
                  .map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
              </select>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe what you want... AI will understand! (e.g., 'add buy milk to work folder')"
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <button
                type="submit"
                disabled={isExtracting}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExtracting ? 'Processing...' : 'Add Task(s)'}
              </button>
            </div>

            {/* Due date and priority row */}
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Due:
                </label>
                <input
                  type="date"
                  value={dueDate || ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('📅 [TaskForm Date Input] Changed:', {
                      newValue,
                      type: typeof newValue,
                      length: newValue?.length,
                      truthy: !!newValue,
                      convertedToNull: newValue === '' ? null : newValue
                    });
                    // Convert empty string to null for consistent falsy checking
                    setDueDate(newValue === '' ? null : newValue);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Time:
                </label>
                <input
                  type="time"
                  value={dueTime || ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('🕐 [TaskForm Time Input] Changed:', {
                      newValue,
                      type: typeof newValue,
                      length: newValue?.length,
                      truthy: !!newValue,
                      convertedToNull: newValue === '' ? null : newValue
                    });
                    // Convert empty string to null for consistent falsy checking
                    setDueTime(newValue === '' ? null : newValue);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Priority:
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Voice Input */}
      {showVoice && <VoiceInput onTranscript={handleVoiceTranscript} />}
    </div>
  );
}
