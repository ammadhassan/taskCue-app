import { useState } from 'react';
import VoiceInput from './VoiceInput';
import { extractTasksFromText } from '../services/taskExtractor';
import { getSmartDefaults, shouldApplyDefaults } from '../services/defaultDateSelector';

export default function TaskForm({ onAddTask, folders, selectedFolder, settings }) {
  const [input, setInput] = useState('');
  const [showVoice, setShowVoice] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showAIVoice, setShowAIVoice] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [folder, setFolder] = useState(
    selectedFolder === 'All Tasks' ? 'Personal' : selectedFolder
  );
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      let finalDueDate = dueDate || null;
      let finalDueTime = null;

      // Apply smart defaults if user hasn't specified date/time
      if (shouldApplyDefaults(dueDate, null)) {
        const defaults = getSmartDefaults(input, settings?.defaultTiming || 'tomorrow_morning');
        finalDueDate = defaults.dueDate;
        finalDueTime = defaults.dueTime;
      }

      onAddTask(input.trim(), folder, finalDueDate, priority, finalDueTime);
      setInput('');
      setDueDate('');
      setPriority('medium');
    }
  };

  const handleVoiceTranscript = (transcript) => {
    setInput(transcript);
    setShowVoice(false);

    // Auto-submit after voice input
    if (transcript.trim()) {
      let finalDueDate = dueDate || null;
      let finalDueTime = null;

      // Apply smart defaults if user hasn't specified date/time
      if (shouldApplyDefaults(dueDate, null)) {
        const defaults = getSmartDefaults(transcript, settings?.defaultTiming || 'tomorrow_morning');
        finalDueDate = defaults.dueDate;
        finalDueTime = defaults.dueTime;
      }

      onAddTask(transcript.trim(), folder, finalDueDate, priority, finalDueTime);
      setInput('');
      setDueDate('');
      setPriority('medium');
    }
  };

  const handleAIExtract = async () => {
    if (!input.trim()) return;

    setIsExtracting(true);
    try {
      const tasks = await extractTasksFromText(input, settings?.defaultTiming || 'tomorrow_morning');
      setExtractedTasks(tasks);
    } catch (error) {
      console.error('Error extracting tasks:', error);
      // Show the actual error message from the LLM
      alert(error.message || 'Failed to extract tasks. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddExtractedTasks = () => {
    extractedTasks.forEach((taskItem) => {
      // Use individual task's due date, time, and folder
      const taskDueDate = taskItem.dueDate || dueDate || null;
      const taskDueTime = taskItem.dueTime || null;
      const taskFolder = taskItem.folder || folder;
      onAddTask(taskItem.task, taskFolder, taskDueDate, priority, taskDueTime);
    });
    setInput('');
    setExtractedTasks([]);
    setShowAI(false);
    setDueDate('');
    setPriority('medium');
  };

  const handleRemoveExtractedTask = (index) => {
    setExtractedTasks(extractedTasks.filter((_, i) => i !== index));
  };

  const handleUpdateExtractedTaskDate = (index, newDate) => {
    const updated = [...extractedTasks];
    updated[index] = { ...updated[index], dueDate: newDate };
    setExtractedTasks(updated);
  };

  const handleUpdateExtractedTaskTime = (index, newTime) => {
    const updated = [...extractedTasks];
    updated[index] = { ...updated[index], dueTime: newTime };
    setExtractedTasks(updated);
  };

  const handleUpdateExtractedTaskFolder = (index, newFolder) => {
    const updated = [...extractedTasks];
    updated[index] = { ...updated[index], folder: newFolder };
    setExtractedTasks(updated);
  };

  const handleAIVoiceTranscript = (transcript) => {
    // Check if there's existing text to prevent data loss
    if (input.trim()) {
      const confirmReplace = window.confirm(
        "You have existing text. Do you want to replace it with voice input?\n\nClick OK to replace, or Cancel to keep your existing text."
      );
      if (!confirmReplace) {
        // User chose to keep existing text
        setShowAIVoice(false);
        return;
      }
    }
    // Replace input with voice transcript
    setInput(transcript);
    setShowAIVoice(false);
  };

  return (
    <div className="mb-6 space-y-3">
      {/* Toggle Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setShowVoice(false);
            setShowAI(false);
            setExtractedTasks([]);
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !showVoice && !showAI
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Text
        </button>
        <button
          type="button"
          onClick={() => {
            setShowVoice(true);
            setShowAI(false);
            setExtractedTasks([]);
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showVoice
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Voice
        </button>
        <button
          type="button"
          onClick={() => {
            setShowVoice(false);
            setShowAI(true);
            setExtractedTasks([]);
          }}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showAI
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          AI Extract
        </button>
      </div>

      {/* Text Input */}
      {!showVoice && !showAI && (
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
                placeholder="Add a new task..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
              >
                Add Task
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
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
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

      {/* AI Extract Mode */}
      {showAI && (
        <div className="space-y-3">
          <div className="space-y-2">
            {/* Input area with voice button */}
            {!showAIVoice ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Paste or type multiple tasks here... Example: 'Buy groceries, call dentist, finish report, and email team'"
                    rows={4}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAIVoice(true)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors self-start"
                    title="Add tasks by voice"
                  >
                    🎤
                  </button>
                </div>

                {/* Extract button */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAIExtract}
                    disabled={!input.trim() || isExtracting}
                    className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExtracting ? 'Extracting...' : 'Extract Tasks'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <VoiceInput onTranscript={handleAIVoiceTranscript} />
                <button
                  type="button"
                  onClick={() => setShowAIVoice(false)}
                  className="mt-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white transition-colors text-sm"
                >
                  Back to Text
                </button>
              </div>
            )}

            {/* Folder and metadata selection */}
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Folder:
                </label>
                <select
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {folders
                    .filter((f) => f !== 'All Tasks')
                    .map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Due:
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
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

          {/* Extracted tasks preview */}
          {extractedTasks.length > 0 && (
            <div className="p-4 border-2 border-purple-300 dark:border-purple-700 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Extracted Tasks ({extractedTasks.length})
                </h3>
                <button
                  onClick={handleAddExtractedTasks}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition-colors text-sm"
                >
                  Add All Tasks
                </button>
              </div>

              <div className="space-y-2">
                {extractedTasks.map((taskItem, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 space-y-2"
                  >
                    <div className="text-gray-900 dark:text-white text-sm font-medium">
                      {taskItem.task}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Folder */}
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                          Folder:
                        </label>
                        <select
                          value={taskItem.folder || 'Personal'}
                          onChange={(e) => handleUpdateExtractedTaskFolder(index, e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {folders
                            .filter((f) => f !== 'All Tasks')
                            .map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                        </select>
                        {taskItem.folder && (
                          <span className="text-xs text-green-600 dark:text-green-400 mt-1 block">
                            ✓ Auto-detected
                          </span>
                        )}
                      </div>

                      {/* Due Date */}
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                          Due Date:
                        </label>
                        <input
                          type="date"
                          value={taskItem.dueDate || ''}
                          onChange={(e) => handleUpdateExtractedTaskDate(index, e.target.value || null)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        {taskItem.dueDate && (
                          <span className="text-xs text-green-600 dark:text-green-400 mt-1 block">
                            ✓ Auto-detected
                          </span>
                        )}
                      </div>

                      {/* Due Time */}
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                          Due Time:
                        </label>
                        <input
                          type="time"
                          value={taskItem.dueTime || ''}
                          onChange={(e) => handleUpdateExtractedTaskTime(index, e.target.value || null)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        {taskItem.dueTime && (
                          <span className="text-xs text-green-600 dark:text-green-400 mt-1 block">
                            ✓ Auto-detected
                          </span>
                        )}
                      </div>

                      {/* Remove Button */}
                      <div className="flex items-end">
                        <button
                          onClick={() => handleRemoveExtractedTask(index)}
                          className="w-full px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-xs border border-red-300 dark:border-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Voice Input */}
      {showVoice && <VoiceInput onTranscript={handleVoiceTranscript} />}
    </div>
  );
}
