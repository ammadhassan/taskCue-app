# Testing Guide

This document explains how to use the custom testing slash command to test the Task Assistant application.

## Testing Command

The `/test-website` slash command is a comprehensive testing agent that can systematically test all features of the application.

### Usage

In Claude Code chat, type:

```
/test-website
```

This will activate the testing agent, which will ask you what you'd like to test.

### Testing Scopes

You can test specific areas or everything:

- **All Features**: Comprehensive test of the entire application
- **Authentication**: Login, signup, logout, session management
- **Task Management**: Create, edit, delete, toggle tasks
- **UI Components**: Dashboard, calendar, charts, modals
- **Database Operations**: Supabase sync, RLS, data persistence
- **Notifications**: Desktop alerts, email, scheduling, sounds

### Example Sessions

#### Test Everything
```
User: /test-website
Agent: What would you like me to test?
User: All features
Agent: [Runs comprehensive test suite and provides detailed report]
```

#### Test Authentication Only
```
User: /test-website
Agent: What would you like me to test?
User: Authentication flows
Agent: [Tests signup, login, logout, session persistence, etc.]
```

#### Generate New Test Cases
```
User: /test-website
Agent: What would you like me to test?
User: Generate new test scenarios
Agent: [Creates creative edge cases and stress tests]
```

## Test Report Format

The testing agent provides structured reports with:

- **Status**: ✅ Pass / ❌ Fail / ⚠️ Warning
- **Files Analyzed**: List of code files reviewed
- **Test Cases**: Specific scenarios tested with expected vs actual results
- **Edge Cases**: Potential boundary conditions identified
- **Bugs Found**: Issues discovered with file locations and severity
- **Recommendations**: Suggestions for improvements

## What Gets Tested

### Authentication Flows
- User signup with email/password
- Email verification links
- Login with valid/invalid credentials
- Logout and session termination
- Session persistence across page refreshes
- Protected route access
- New user initialization (default folders and settings)

### Task Management
- Manual task creation
- AI task extraction from natural language
- Voice input
- Task editing (text, date, time, priority, folder)
- Task deletion
- Toggle task completion
- Task sorting (by date, priority, creation time)
- Folder filtering

### UI Components
- Dashboard header with stats
- Calendar view and navigation
- Day detail modal
- Priority breakdown chart
- Productivity chart
- Today's Focus widget
- Quick Actions sidebar
- View toggle (list/calendar)
- Dark mode
- Responsive design
- Settings modal

### Database Operations
- Tasks table CRUD operations
- Folders table management
- Settings persistence
- Row Level Security (RLS) policies
- Real-time sync across sessions
- Foreign key constraints
- User data isolation

### Notifications
- Desktop notifications
- Email notifications (if implemented)
- Notification scheduling (5-min warning + exact time)
- Sound alerts
- Notification deduplication
- Settings integration
- Cancellation on task completion

## Adding New Tests

The testing agent can dynamically generate new test cases. Ask it to:

- Test stress scenarios (100+ tasks)
- Test concurrent edits
- Test network failures
- Test boundary conditions
- Test security vulnerabilities
- Test accessibility
- Test browser compatibility

## Integration with Development

Use the testing agent:

1. **Before committing**: Test features you've changed
2. **After major changes**: Run comprehensive tests
3. **Before deployment**: Verify all critical paths
4. **When fixing bugs**: Generate regression tests
5. **When adding features**: Create new test scenarios

## Continuous Testing

The testing agent is stateless and can be called repeatedly:

```
# Test after implementing a feature
/test-website

# Test again after fixing a bug
/test-website

# Generate new edge cases
/test-website
```

## Tips

- Be specific about what you want tested for focused results
- Ask for "all features" for pre-deployment verification
- Use test reports to track bugs and improvements over time
- Request new test scenarios to discover edge cases you haven't considered

## Example Test Report

```
## Test Report: Authentication Flows

**Status**: ⚠️ Warning
**Files Analyzed**: src/components/Auth.jsx, src/contexts/AuthContext.jsx
**Test Date**: 2026-01-06

### Test Cases

#### Test Case 1: User Signup
- **Steps**: Enter email and password, click Sign Up
- **Expected**: User account created, confirmation email sent
- **Actual**: Works as expected
- **Result**: ✅ Pass

#### Test Case 2: Login with Invalid Credentials
- **Steps**: Enter wrong password, click Sign In
- **Expected**: Error message displayed
- **Actual**: Generic error shown
- **Result**: ⚠️ Warning - Could be more specific

### Bugs Found
- ❌ **Password strength not enforced** (Severity: Medium)
  - **File**: src/components/Auth.jsx:103
  - **Description**: Only checks minLength=6, doesn't enforce complexity
  - **Suggested Fix**: Add password strength validation

### Recommendations
- 💡 Add password strength indicator
- 💡 Implement rate limiting for login attempts
- 💡 Add "Forgot Password" functionality
```

## Future Enhancements

The testing command can be extended to:

- Auto-generate Jest test files
- Create Cypress E2E test scripts
- Generate test data
- Monitor for regressions
- Create visual regression tests
