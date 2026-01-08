import { supabase } from '../supabaseClient';

/**
 * Minimal data service - using REST API with proper authentication
 */

// Helper function to get auth headers with user's session token
async function getAuthHeaders() {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  // Get user's session token for RLS
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || supabaseKey;

  return {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

export async function fetchTasks(userId) {
  console.log('🔍 Starting fetchTasks for:', userId);

  // Try using fetch() directly to Supabase REST API
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  console.log('🌐 Testing direct REST API call...');
  console.log('URL:', supabaseUrl);
  console.log('Key exists:', !!supabaseKey);

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/tasks?user_id=eq.${userId}&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    console.log('📊 REST API response status:', response.status);
    const data = await response.json();
    console.log('📊 REST API data:', data);

    if (!response.ok) {
      throw new Error(`REST API error: ${response.status} ${response.statusText}`);
    }

    return data || [];
  } catch (error) {
    console.error('❌ REST API error:', error);
    throw error;
  }
}

export async function fetchFolders(userId) {
  console.log('🔍 Starting fetchFolders for:', userId);

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/folders?user_id=eq.${userId}&select=*&order=created_at.asc`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Folders REST API status:', response.status);
    const data = await response.json();
    console.log('📊 Folders data:', data);

    if (!response.ok) {
      throw new Error(`Folders API error: ${response.status}`);
    }

    const folderNames = (data || []).map(f => f.name);
    return ['All Tasks', ...folderNames];
  } catch (error) {
    console.error('❌ Folders REST API error:', error);
    throw error;
  }
}

export async function fetchSettings(userId) {
  console.log('🔍 Starting fetchSettings for:', userId);

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/settings?user_id=eq.${userId}&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.pgrst.object+json'
      }
    });

    console.log('📊 Settings REST API status:', response.status);

    // If no settings exist (404 or 406), CREATE them automatically
    if (response.status === 406 || response.status === 404) {
      console.log('📝 No settings found, creating default settings');

      const defaultSettings = {
        user_id: userId,
        notifications: true,
        desktop_notifications: true,
        sound_alerts: true,
        theme: 'light',
        default_timing: 'tomorrow_morning',
      };

      const createResponse = await fetch(`${supabaseUrl}/rest/v1/settings`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(defaultSettings)
      });

      if (createResponse.ok) {
        const created = await createResponse.json();
        const data = Array.isArray(created) ? created[0] : created;
        console.log('✅ Default settings created:', data);

        return {
          notifications: data.notifications,
          desktopNotifications: data.desktop_notifications,
          soundAlerts: data.sound_alerts,
          theme: data.theme,
          defaultTiming: data.default_timing,
        };
      } else {
        console.error('❌ Failed to create settings');
        // Return defaults if creation fails
        return {
          notifications: true,
          desktopNotifications: true,
          soundAlerts: true,
          theme: 'light',
          defaultTiming: 'tomorrow_morning',
        };
      }
    }

    const data = await response.json();
    console.log('📊 Settings data:', data);

    if (!response.ok) {
      throw new Error(`Settings API error: ${response.status}`);
    }

    // Convert snake_case to camelCase
    return {
      notifications: data.notifications,
      desktopNotifications: data.desktop_notifications,
      soundAlerts: data.sound_alerts,
      theme: data.theme,
      defaultTiming: data.default_timing,
    };
  } catch (error) {
    console.error('❌ Settings REST API error:', error);
    // Return defaults on error
    return {
      notifications: true,
      desktopNotifications: true,
      soundAlerts: true,
      theme: 'light',
      defaultTiming: 'tomorrow_morning',
    };
  }
}

// Real-time subscription functions using Supabase
export function subscribeToTasks(userId, callback) {
  console.log('📡 Setting up real-time subscription for tasks');

  const subscription = supabase
    .channel(`tasks-${userId}`)
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('🔄 Real-time task change:', payload);
        callback(payload);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    console.log('🔌 Unsubscribing from tasks channel');
    subscription.unsubscribe();
  };
}

export function subscribeToFolders(userId, callback) {
  console.log('📡 Setting up real-time subscription for folders');

  const subscription = supabase
    .channel(`folders-${userId}`)
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'folders',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        console.log('🔄 Real-time folder change:', payload);
        callback(payload);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    console.log('🔌 Unsubscribing from folders channel');
    subscription.unsubscribe();
  };
}

// Task CRUD functions using REST API
export async function createTask(userId, taskData) {
  console.log('➕ Creating task:', taskData);

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const headers = await getAuthHeaders();

  const taskForDB = {
    user_id: userId,
    text: taskData.text,
    folder: taskData.folder || 'Personal',
    due_date: taskData.dueDate || null,
    due_time: taskData.dueTime || null,
    priority: taskData.priority || 'medium',
    completed: false,
  };

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/tasks`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(taskForDB)
    });

    console.log('📊 Create task status:', response.status);
    const data = await response.json();
    console.log('📊 Created task:', data);

    if (!response.ok) {
      throw new Error(`Create task error: ${response.status}`);
    }

    // Transform snake_case to camelCase
    const task = Array.isArray(data) ? data[0] : data;
    return {
      id: task.id,
      text: task.text,
      folder: task.folder,
      dueDate: task.due_date,
      dueTime: task.due_time,
      priority: task.priority,
      completed: task.completed,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    };
  } catch (error) {
    console.error('❌ Create task error:', error);
    throw error;
  }
}

export async function updateTask(taskId, updates) {
  console.log('✏️ Updating task:', taskId, updates);

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const headers = await getAuthHeaders();

  // Convert camelCase to snake_case
  const dbUpdates = {
    updated_at: new Date().toISOString(),
  };

  if (updates.text !== undefined) dbUpdates.text = updates.text;
  if (updates.folder !== undefined) dbUpdates.folder = updates.folder;
  if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
  if (updates.dueTime !== undefined) dbUpdates.due_time = updates.dueTime;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
  if (updates.completed !== undefined) dbUpdates.completed = updates.completed;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/tasks?id=eq.${taskId}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(dbUpdates)
    });

    console.log('📊 Update task status:', response.status);
    const data = await response.json();
    console.log('📊 Updated task:', data);

    if (!response.ok) {
      throw new Error(`Update task error: ${response.status}`);
    }

    const task = Array.isArray(data) ? data[0] : data;
    return {
      id: task.id,
      text: task.text,
      folder: task.folder,
      dueDate: task.due_date,
      dueTime: task.due_time,
      priority: task.priority,
      completed: task.completed,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    };
  } catch (error) {
    console.error('❌ Update task error:', error);
    throw error;
  }
}

export async function deleteTask(taskId) {
  console.log('🗑️ Deleting task:', taskId);

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const headers = await getAuthHeaders();

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/tasks?id=eq.${taskId}`, {
      method: 'DELETE',
      headers
    });

    console.log('📊 Delete task status:', response.status);

    if (!response.ok) {
      throw new Error(`Delete task error: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Delete task error:', error);
    throw error;
  }
}

export async function toggleTaskComplete(taskId, completed) {
  console.log('✅ Toggling task:', taskId, completed);

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const headers = await getAuthHeaders();

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/tasks?id=eq.${taskId}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({
        completed,
        updated_at: new Date().toISOString()
      })
    });

    console.log('📊 Toggle task status:', response.status);
    const data = await response.json();
    console.log('📊 Toggled task:', data);

    if (!response.ok) {
      throw new Error(`Toggle task error: ${response.status}`);
    }

    const task = Array.isArray(data) ? data[0] : data;
    return {
      id: task.id,
      text: task.text,
      folder: task.folder,
      dueDate: task.due_date,
      dueTime: task.due_time,
      priority: task.priority,
      completed: task.completed,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    };
  } catch (error) {
    console.error('❌ Toggle task error:', error);
    throw error;
  }
}

// Folder CRUD functions using REST API
export async function createFolder(userId, name) {
  console.log('📁 Creating folder:', name);

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const headers = await getAuthHeaders();

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/folders`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({ user_id: userId, name })
    });

    console.log('📊 Create folder status:', response.status);
    const data = await response.json();
    console.log('📊 Created folder:', data);

    if (!response.ok) {
      // Handle unique constraint violation
      if (response.status === 409) {
        throw new Error('A folder with this name already exists');
      }
      throw new Error(`Create folder error: ${response.status}`);
    }

    return Array.isArray(data) ? data[0] : data;
  } catch (error) {
    console.error('❌ Create folder error:', error);
    throw error;
  }
}

export async function deleteFolder(userId, folderName) {
  console.log('🗑️ Deleting folder:', folderName);

  if (folderName === 'All Tasks') {
    throw new Error('Cannot delete "All Tasks" folder');
  }

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const headers = await getAuthHeaders();

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/folders?user_id=eq.${userId}&name=eq.${encodeURIComponent(folderName)}`, {
      method: 'DELETE',
      headers
    });

    console.log('📊 Delete folder status:', response.status);

    if (!response.ok) {
      throw new Error(`Delete folder error: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Delete folder error:', error);
    throw error;
  }
}

export async function updateSettings(userId, settings) {
  console.log('⚙️ Updating settings:', settings);

  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const headers = await getAuthHeaders();

  const dbSettings = {
    notifications: settings.notifications,
    desktop_notifications: settings.desktopNotifications,
    sound_alerts: settings.soundAlerts,
    theme: settings.theme,
    default_timing: settings.defaultTiming,
    email: settings.email || null,
    phone: settings.phone || null,
  };

  try {
    // Try to update first
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/settings?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(dbSettings)
    });

    console.log('📊 Update settings status:', updateResponse.status);

    const data = await updateResponse.json();
    console.log('📊 Updated settings response:', data);

    // If no rows updated (empty array or 404/406), insert instead
    const isEmpty = Array.isArray(data) && data.length === 0;
    if (updateResponse.status === 406 || updateResponse.status === 404 || isEmpty) {
      console.log('📝 No settings found, inserting new...');
      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/settings`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=representation' },
        body: JSON.stringify({ ...dbSettings, user_id: userId })
      });

      const insertData = await insertResponse.json();
      console.log('📊 Inserted settings:', insertData);

      if (!insertResponse.ok) {
        console.error('❌ Insert failed:', insertData);
        throw new Error(`Insert settings error: ${insertResponse.status} - ${JSON.stringify(insertData)}`);
      }

      const settingsData = Array.isArray(insertData) ? insertData[0] : insertData;

      if (!settingsData) {
        throw new Error('Settings data is empty after insert');
      }

      return {
        notifications: settingsData.notifications,
        desktopNotifications: settingsData.desktop_notifications,
        soundAlerts: settingsData.sound_alerts,
        theme: settingsData.theme,
        defaultTiming: settingsData.default_timing,
        email: settingsData.email,
        phone: settingsData.phone,
      };
    }

    if (!updateResponse.ok) {
      throw new Error(`Update settings error: ${updateResponse.status}`);
    }

    const settingsData = Array.isArray(data) ? data[0] : data;

    if (!settingsData) {
      throw new Error('Settings data is empty after update');
    }

    return {
      notifications: settingsData.notifications,
      desktopNotifications: settingsData.desktop_notifications,
      soundAlerts: settingsData.sound_alerts,
      theme: settingsData.theme,
      defaultTiming: settingsData.default_timing,
      email: settingsData.email,
      phone: settingsData.phone,
    };
  } catch (error) {
    console.error('❌ Update settings error:', error);
    throw error;
  }
}
