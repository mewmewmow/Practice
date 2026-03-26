# Contributing to SmartBook SaaS

Thank you for your interest in contributing to SmartBook SaaS! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Practice.git
   cd Practice
   ```

3. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Install dependencies**:
   ```bash
   cd booking-saas/backend && npm install
   cd ../frontend && npm install
   cd ../admin-dashboard && npm install
   ```

## Development Setup

### Backend
```bash
cd booking-saas/backend
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend
```bash
cd booking-saas/frontend
npm install
npm start
```

### Admin Dashboard
```bash
cd booking-saas/admin-dashboard
npm install
npm start
```

## Commit Guidelines

We follow conventional commits for clear and consistent commit messages:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding or updating tests
- `chore`: Changes to build process, dependencies, etc.

### Examples
```
feat(auth): add OAuth2 support for Google

fix(booking): resolve date picker timezone issue

docs(readme): update installation instructions

refactor(cache): optimize Redis connection handling
```

## Pull Request Process

1. **Update your branch** with the latest main:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Write clear PR description** including:
   - What changes were made
   - Why the changes were made
   - Any breaking changes
   - Related issues (e.g., `Closes #123`)

3. **Ensure tests pass**:
   ```bash
   npm test
   ```

4. **Code review**: Be responsive to feedback and make requested changes

5. **Merge**: Once approved, your PR will be merged to main

## Coding Standards

### JavaScript/Node.js
- Use ES6+ syntax
- Follow the existing code style (run `eslint` before committing)
- Write meaningful variable and function names
- Use `const` by default, `let` when needed, avoid `var`
- Aim for functions under 20 lines
- Add JSDoc comments for complex functions

### Example:
```javascript
/**
 * Creates a booking for a customer
 * @param {string} customerId - The customer ID
 * @param {Object} bookingData - The booking details
 * @returns {Promise<Object>} The created booking
 * @throws {Error} If booking creation fails
 */
async function createBooking(customerId, bookingData) {
  // Implementation
}
```

### React Components
- Use functional components with hooks
- Props validation with PropTypes or TypeScript
- Meaningful component names (PascalCase)
- One component per file
- Extract reusable logic into custom hooks

## Testing

- Write tests for new features
- Update tests when modifying existing features
- Aim for at least 80% code coverage
- Run tests before committing:
  ```bash
  npm test
  ```

## Documentation

- Update README.md if behavior changes
- Add comments for complex logic
- Update API documentation for endpoint changes
- Include examples for new features

## Performance Considerations

- Optimize database queries (use indexes, pagination)
- Implement caching for frequently accessed data
- Minimize bundle size for frontend
- Use lazy loading for routes and components
- Monitor and profile performance regularly

## Security

- Never commit secrets or sensitive data
- Use environment variables for configuration
- Validate and sanitize all user inputs
- Use parameterized SQL queries
- Keep dependencies updated
- Report security issues privately to maintainers

## Issues and Bugs

When reporting issues:
1. Check if the issue already exists
2. Provide a clear title and description
3. Include reproduction steps
4. Add relevant error messages or screenshots
5. Specify your environment (OS, Node version, etc.)

## Questions?

- Check existing issues and discussions
- Review the documentation in `/docs`
- Open a new discussion for questions

## License

By contributing to SmartBook SaaS, you agree that your contributions will be licensed under its MIT License.

---

Happy contributing! 🚀
