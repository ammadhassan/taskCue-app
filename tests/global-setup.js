import { createClient } from '@supabase/supabase-js';

/**
 * Global Setup for Playwright Tests
 * Creates test user if it doesn't exist
 */

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://edadytvzscxwjtfnhmtz.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkYWR5dHZ6c2N4d2p0Zm5obXR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0MzQwNzEsImV4cCI6MjA4MzAxMDA3MX0.UVAla1hVpm-AAbMVvrTlRC3v5GkuU-PofsCmVI_YoJY';

const TEST_EMAIL = 'ammhasun@gmail.com';
const TEST_PASSWORD = '123456';

async function globalSetup() {
  console.log('🔧 Running global test setup...');
  console.log(`✅ Using test account: ${TEST_EMAIL}`);
  console.log('⚠️  Make sure this account exists and is verified in Supabase before running tests.');

  // Clean up test data from previous runs
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Sign in as test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (authError) {
      console.log('⚠️  Could not sign in to clean up test data:', authError.message);
      console.log('⚠️  Tests will run but may encounter existing data');
      return;
    }

    const userId = authData.user.id;
    console.log('🧹 Cleaning up test data for user:', userId);

    // Delete all tasks for this user
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.log('⚠️  Error deleting tasks:', deleteError.message);
    } else {
      console.log('✅ Deleted all existing test tasks');
    }

    // Sign out
    await supabase.auth.signOut();
    console.log('✅ Test data cleanup complete');

  } catch (error) {
    console.log('⚠️  Error during cleanup:', error.message);
    console.log('⚠️  Tests will continue but may encounter existing data');
  }
}

export default globalSetup;
