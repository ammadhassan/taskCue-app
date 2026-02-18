// Manual mock for Supabase client
export const supabase = {
  auth: {
    getSession: jest.fn(() =>
      Promise.resolve({
        data: { session: null },
        error: null
      })
    ),
    onAuthStateChange: jest.fn(() => ({
      data: {
        subscription: {
          unsubscribe: jest.fn()
        }
      }
    })),
    signOut: jest.fn(() =>
      Promise.resolve({ error: null })
    )
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(() => Promise.resolve({ data: null, error: null }))
  }))
};
