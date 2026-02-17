# TaskCue Test Suite

This directory contains the comprehensive test suite for TaskCue, covering all 15 critical use cases required before deploying new features.

## Test Structure

```
tests/
├── e2e/                          # End-to-end tests (Playwright)
│   ├── ai-extraction.spec.js     # AI task extraction and folder auto-categorization
│   ├── datetime-handling.spec.js # Date/time intelligence and defaults
│   ├── folders.spec.js           # Folder management and filtering
│   ├── views.spec.js             # List/calendar views and theme changes
│   ├── notifications.spec.js     # Notification timing and delivery
│   ├── analytics.spec.js         # Analytics and statistics accuracy
│   └── auth.spec.js              # Authentication and session management
├── integration/                  # Integration tests (React Testing Library)
│   └── (existing integration tests)
└── helpers/                      # Test utilities and fixtures
    ├── test-utils.js             # Helper functions for tests
    └── fixtures.js               # Sample test data
```

## Running Tests

### Local Development

**Run all unit/integration tests:**
```bash
npm test
```

**Run E2E tests (headless):**
```bash
npm run test:e2e
```

**Run E2E tests (UI mode - interactive):**
```bash
npm run test:e2e:ui
```

**Run integration tests only:**
```bash
npm run test:integration
```

**Run all tests:**
```bash
npm run test:all
```

### CI/CD Pipeline

All tests run automatically on every pull request and push to `main` or `dev` branches. The pipeline includes:

1. ✅ Setup - Install dependencies
2. ✅ Lint - Code quality checks
3. ✅ Build - Build the application
4. ✅ Test - Run unit/integration tests
5. ✅ Backend Check - Verify backend starts
6. ✅ **E2E Tests** - Run end-to-end tests

**All checks must pass before merging!**

## Test Coverage

The test suite covers these 15 critical use cases:

### 1. AI Task Extraction (5 tests)
- ✅ Voice input works with AI and task is added correctly
- ✅ Add task button works with AI and task is added correctly
- ✅ Shopping tasks auto-categorized to Shopping folder
- ✅ Work tasks auto-categorized to Work folder
- ✅ Personal tasks auto-categorized to Personal folder

### 2. Date/Time Handling (4 tests)
- ✅ If date/time not mentioned, fields should NOT be blank (use defaults)
- ✅ If only time mentioned, AI determines today vs tomorrow based on current time
- ✅ Date/time fields are NEVER empty in tasks
- ✅ Tasks persist with correct date/time across browsers

### 3. Folder Management (2 tests)
- ✅ Add folder works properly
- ✅ Tasks correctly assigned to folders based on keywords

### 4. UI/UX (3 tests)
- ✅ List view works properly
- ✅ Calendar view works properly
- ✅ Theme change works (dark/light mode)

### 5. Notifications (6 tests)
- ✅ Desktop notifications sent 5 mins before due time
- ✅ Desktop notifications sent at due time
- ✅ Notifications NOT sent at any other time
- ✅ Email notifications work
- ✅ SMS notifications work
- ✅ Sound alerts work

### 6. Analytics/Stats (6 tests)
- ✅ Weekly activity shows correct info
- ✅ Priority distribution shows correct info
- ✅ Due Today count is accurate
- ✅ Overdue count is accurate
- ✅ Completion rate calculates correctly
- ✅ Charts display without visual overflow

### 7. Authentication (2 tests)
- ✅ Logout works properly
- ✅ Session persists correctly

## First-Time Setup

### Install Playwright Browsers

Before running E2E tests locally, install the required browser binaries:

```bash
npx playwright install
```

This downloads Chromium and Firefox for testing. It only needs to be done once.

### Environment Variables

E2E tests require these environment variables (set in `.env`):

```bash
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_BACKEND_URL=your_backend_url
```

In CI/CD, these are automatically provided via GitHub Secrets.

## Test Philosophy

### Multi-Layer Testing Strategy

1. **Unit Tests** - Fast, isolated tests for individual functions
2. **Integration Tests** - Test component interactions and workflows
3. **E2E Tests** - Test complete user journeys across the app

### Key Principles

- **Tests are documentation** - Each test describes expected behavior
- **Test real user workflows** - E2E tests simulate actual user actions
- **Fail fast** - Tests catch bugs before they reach production
- **No merges without passing tests** - Quality gate for all changes

## Writing New Tests

### E2E Test Template

```javascript
import { test, expect } from '@playwright/test';
import { login, createTask } from '../helpers/test-utils.js';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Should do something', async ({ page }) => {
    // Arrange - Set up test data
    await createTask(page, { text: 'Test task' });

    // Act - Perform action
    await page.click('[data-testid="some-button"]');

    // Assert - Verify result
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid attributes** - Stable selectors that don't break with styling changes
2. **Test user behavior, not implementation** - Focus on what users see and do
3. **Keep tests independent** - Each test should run in isolation
4. **Use descriptive test names** - Clearly state what is being tested
5. **Clean up after tests** - Avoid side effects that affect other tests

## Debugging Tests

### Run single test file:
```bash
npx playwright test tests/e2e/ai-extraction.spec.js
```

### Run single test:
```bash
npx playwright test -g "Shopping tasks auto-categorized"
```

### Debug mode (step through test):
```bash
npx playwright test --debug
```

### View test report:
```bash
npx playwright show-report
```

## Troubleshooting

### Tests failing locally but passing in CI

- Ensure browsers are installed: `npx playwright install`
- Check environment variables are set in `.env`
- Verify backend server is running if testing with real API

### Flaky tests (intermittent failures)

- Add explicit waits: `await page.waitForTimeout(1000)`
- Use Playwright's built-in waiters: `await page.waitForSelector()`
- Check for race conditions in the application code

### Notification tests not working

- Ensure notification permissions are granted (handled in test setup)
- Use `page.clock` to mock time instead of real delays
- Check that notifications are enabled in test settings

## Next Steps

After the test infrastructure is set up:

1. ✅ Phase 1 Complete - Infrastructure setup
2. 🔄 Phase 2 - Run tests locally and fix any failures
3. 🔄 Phase 3 - Update app components with data-testid attributes
4. 🔄 Phase 4 - Test in CI/CD pipeline
5. 🔄 Phase 5 - Update branch protection rules to require e2e-tests
6. 🔄 Phase 6 - Documentation and team training

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://testingjavascript.com/)
