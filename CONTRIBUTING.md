# Contributing to TaskCue

Thank you for your interest in contributing to TaskCue! This guide will help you understand our development workflow and how to contribute effectively.

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

### 2. Make Changes & Test Locally
```bash
npm install
npm run dev  # Starts both backend and frontend
```

Test your changes thoroughly on `http://localhost:3000`

### 3. Commit Changes
```bash
git add .
git commit -m "feat: your feature description"
```

### 4. Push & Create Pull Request
```bash
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub targeting the `dev` branch.

### 5. Wait for Checks
- GitHub Actions will run automatically
- Vercel will create a preview deployment
- Review the preview URL in PR comments

### 6. Merge to Dev
After approval and checks passing, merge to `dev` for shared testing.

### 7. Promote to Production
When `dev` is stable, create a PR from `dev` → `main`.

---

## Branch Naming Conventions

Use the following prefixes for your branches:

- `feature/` - New features (e.g., `feature/dark-mode-toggle`)
- `fix/` - Bug fixes (e.g., `fix/date-formatting-issue`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `refactor/` - Code refactoring (e.g., `refactor/simplify-auth`)
- `test/` - Adding tests (e.g., `test/add-unit-tests`)

---

## Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code restructuring without behavior change
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```bash
git commit -m "feat: add dark mode toggle to settings"
git commit -m "fix: resolve date/time fields disappearing"
git commit -m "docs: update contributing guide"
git commit -m "refactor: simplify task transformation logic"
```

---

## Pull Request Process

1. **Ensure all checks pass** - GitHub Actions must be green
2. **Add description of changes** - What and why
3. **Link related issues** - Use "Fixes #123" or "Closes #456"
4. **Request review if needed** - Tag relevant reviewers
5. **Merge when approved** - Squash and merge recommended

---

## Testing Strategy

### Automated Testing (GitHub Actions)
✅ Build check - Ensures code compiles
✅ Lint check - Code quality standards
✅ Unit tests - Component testing
✅ Backend check - Server starts correctly

### Manual Testing
✅ Local testing - `npm run dev`
✅ Preview deployment - Test on Vercel preview URL
✅ Dev deployment - Shared testing on dev branch
✅ Production smoke test - Quick check after merge

---

## Example Workflow: Adding a New Feature

```bash
# 1. Start from dev branch
git checkout dev
git pull origin dev

# 2. Create feature branch
git checkout -b feature/task-categories

# 3. Make changes, test locally
npm run dev
# Make your changes...

# 4. Commit and push
git add .
git commit -m "feat: add task categories feature"
git push origin feature/task-categories

# 5. Create PR on GitHub (feature/task-categories → dev)
# 6. GitHub Actions runs tests
# 7. Vercel creates preview deployment - test it!
# 8. Address any review comments
# 9. Merge when approved

# 10. Test on dev deployment
# 11. When stable, create PR (dev → main)
# 12. After approval, merge to production
```

---

## Example Workflow: Hotfix for Production

```bash
# 1. Create fix branch from main
git checkout main
git pull origin main
git checkout -b fix/critical-auth-bug

# 2. Fix the bug and test
npm run dev
# Make the fix...

# 3. Commit and push
git add .
git commit -m "fix: resolve authentication timeout issue"
git push origin fix/critical-auth-bug

# 4. Create PR (fix/critical-auth-bug → main)
# 5. Fast-track review and merge
# 6. Backport to dev if needed
git checkout dev
git cherry-pick <commit-hash>
git push origin dev
```

---

## Rollback Strategy

### If a Bug Reaches Production

**Option 1: Revert Commit**
```bash
git checkout main
git revert <bad-commit-hash>
git push origin main
```

**Option 2: Revert on Vercel Dashboard**
1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click "Promote to Production"

**Option 3: Hotfix**
Create an urgent fix branch and fast-track the PR to `main`.

---

## Development Environment Setup

### Prerequisites
- Node.js >= 18.0.0
- npm or yarn
- Git

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/ammadhassan/taskCue-app.git
cd taskCue-app

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials (see SETUP_GUIDE.md)

# Install backend dependencies
cd server
npm install
cd ..

# Start development servers
npm run dev
```

---

## Code Style Guidelines

- Use ES6+ features
- Follow React best practices and hooks guidelines
- Keep components small and focused
- Write meaningful commit messages
- Add comments for complex logic
- Use TypeScript types where applicable

---

## Getting Help

- Check existing [Issues](https://github.com/ammadhassan/taskCue-app/issues)
- Read the [Documentation](./README.md)
- Ask in Pull Request comments

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
