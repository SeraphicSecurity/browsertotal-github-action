# Contributing to BrowserTotal Posture Scanner GitHub Action

Thank you for your interest in contributing to the Browser Posture Scanner GitHub Action! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct: be respectful, inclusive, and professional.

## How to Contribute

### Reporting Issues

1. Check if the issue already exists in the [Issues](https://github.com/SeraphicSecurity/browsertotal-github-action/issues) section
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce (if applicable)
   - Expected vs actual behavior
   - Environment details (OS, browser version, etc.)

### Suggesting Features

1. Open a new issue with the "enhancement" label
2. Describe the feature and its use case
3. Explain why it would benefit users

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests: `npm test`
5. Ensure code quality: `npm run lint`
6. Commit with descriptive messages
7. Push to your fork
8. Open a Pull Request with:
   - Clear description of changes
   - Link to related issues
   - Screenshots (if UI changes)

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/SeraphicSecurity/browsertotal-github-action.git
   cd browsertotal-github-action
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

4. Run tests:
   ```bash
   npm test
   ```

5. Build the action:
   ```bash
   npm run build
   ```

## Code Style

- Use ESLint: `npm run lint`
- Use Prettier: `npm run format`
- Follow existing code patterns
- Add JSDoc comments for functions
- Keep functions small and focused

## Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Test with different browsers if applicable
- Include edge cases in tests

## Documentation

- Update README.md for new features
- Add JSDoc comments to code
- Update CHANGELOG.md
- Include examples for new functionality

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create a git tag: `git tag -a v1.x.x -m "Release version 1.x.x"`
4. Push tag: `git push origin v1.x.x`
5. GitHub Action will automatically create a release

## Questions?

Feel free to open an issue for any questions about contributing! 