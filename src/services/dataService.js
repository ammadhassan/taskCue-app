import { supabase } from '../supabaseClient';

/**
 * Data Service Layer
 * Handles all Supabase database operations for tasks, folders, and settings
 */

// ============================================================================
// TASKS
// ============================================================================

/**
 * Fetch all tasks for a user
 */
export async function fetchTasks(userId) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Convert snake_case to camelCase for frontend
    return data.map(transformTaskFromDB);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }
}

/**
 * Create a new task
 */
export async function createTask(userId, taskData) {
  try {
    const taskForDB = {
      user_id: userId,
      text: taskData.text,
      folder: taskData.folder || 'Personal',
      due_date: taskData.dueDate || null,
      due_time: taskData.dueTime || null,
      priority: taskData.priority || 'medium',
      completed: false,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskForDB])
      .select()
      .single();

    if (error) throw error;

    return transformTaskFromDB(data);
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

/**
 * Update an existing task
 */
export async function updateTask(taskId, updates) {
  try {
    // Convert camelCase to snake_case for database
    const dbUpdates = {
      updated_at: new Date().toISOString(),
    };

    if (updates.text !== undefined) dbUpdates.text = updates.text;
    if (updates.folder !== undefined) dbUpdates.folder = updates.folder;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
    if (updates.dueTime !== undefined) dbUpdates.due_time = updates.dueTime;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed;

    const { data, error } = await supabase
      .from('tasks')
      .update(dbUpdates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    return transformTaskFromDB(data);
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId) {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

/**
 * Toggle task completion status
 */
export async function toggleTaskComplete(taskId, completed) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        completed,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    return transformTaskFromDB(data);
  } catch (error) {
    console.error('Error toggling task:', error);
    throw error;
  }
}

// ============================================================================
// FOLDERS
// ============================================================================

/**
 * Fetch all folders for a user
 */
export async function fetchFolders(userId) {
  try {
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Return folder names as simple array (matching current app structure)
    // Always include 'All Tasks' at the beginning
    const folderNames = data.map(folder => folder.name);
    return ['All Tasks', ...folderNames];
  } catch (error) {
    console.error('Error fetching folders:', error);
    throw error;
  }
}

/**
 * Create a new folder
 */
export async function createFolder(userId, name) {
  try {
    const { data, error } = await supabase
      .from('folders')
      .insert([{ user_id: userId, name }])
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        throw new Error('A folder with this name already exists');
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
}

/**
 * Delete a folder
 */
export async function deleteFolder(userId, folderName) {
  try {
    // Don't allow deleting special folders
    if (folderName === 'All Tasks') {
      throw new Error('Cannot delete "All Tasks" folder');
    }

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('user_id', userId)
      .eq('name', folderName);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
}

// ============================================================================
// SETTINGS
// ============================================================================

/**
 * Fetch user settings
 */
export async function fetchSettings(userId) {
  try {
    console.log('🔍 [dataService] Fetching settings for user:', userId);

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.log('⚠️ [dataService] Settings query error:', error.code, error.message);

      // If no settings exist, return defaults
      if (error.code === 'PGRST116') {
        console.log('📝 [dataService] No settings found, returning defaults');
        return {
          notifications: true,
          desktopNotifications: true,
          soundAlerts: true,
          theme: 'light',
          defaultTiming: 'tomorrow_morning',
        };
      }
      throw error;
    }

    console.log('✅ [dataService] Settings fetched successfully:', data);

    // Convert snake_case to camelCase
    return transformSettingsFromDB(data);
  } catch (error) {
    console.error('❌ [dataService] Error fetching settings:', error);
    throw error;
  }
}

/**
 * Update user settings
 */
export async function updateSettings(userId, settings) {
  try {
    // Convert camelCase to snake_case
    const dbSettings = {
      user_id: userId,
      notifications: settings.notifications,
      desktop_notifications: settings.desktopNotifications,
      sound_alerts: settings.soundAlerts,
      theme: settings.theme,
      default_timing: settings.defaultTiming,
      email: settings.email || null,
      phone: settings.phone || null,
    };

    // Use upsert to insert or update
    const { data, error } = await supabase
      .from('settings')
      .upsert([dbSettings], { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    return transformSettingsFromDB(data);
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to task changes in real-time
 */
export function subscribeToTasks(userId, callback) {
  const subscription = supabase
    .channel(`tasks:user_id=eq.${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Task change detected:', payload);

        if (payload.eventType === 'INSERT') {
          callback({ type: 'INSERT', task: transformTaskFromDB(payload.new) });
        } else if (payload.eventType === 'UPDATE') {
          callback({ type: 'UPDATE', task: transformTaskFromDB(payload.new) });
        } else if (payload.eventType === 'DELETE') {
          callback({ type: 'DELETE', taskId: payload.old.id });
        }
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Subscribe to folder changes in real-time
 */
export function subscribeToFolders(userId, callback) {
  const subscription = supabase
    .channel(`folders:user_id=eq.${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'folders',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Folder change detected:', payload);
        callback(payload);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transform task from database format (snake_case) to app format (camelCase)
 */
function transformTaskFromDB(dbTask) {
  return {
    id: dbTask.id,
    text: dbTask.text,
    folder: dbTask.folder,
    dueDate: dbTask.due_date,
    dueTime: dbTask.due_time,
    priority: dbTask.priority,
    completed: dbTask.completed,
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at,
  };
}

/**
 * Transform settings from database format (snake_case) to app format (camelCase)
 */
function transformSettingsFromDB(dbSettings) {
  return {
    notifications: dbSettings.notifications,
    desktopNotifications: dbSettings.desktop_notifications,
    soundAlerts: dbSettings.sound_alerts,
    theme: dbSettings.theme,
    defaultTiming: dbSettings.default_timing,
    email: dbSettings.email,
    phone: dbSettings.phone,
  };
}
