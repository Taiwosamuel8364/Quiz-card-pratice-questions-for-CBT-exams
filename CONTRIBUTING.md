# Contributing to Quiz Card Practice

Thank you for your interest in contributing! This document provides guidelines and instructions.

## Development Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```
3. Set up environment variables (see QUICK_START.md)
4. Create a new branch: `git checkout -b feature/your-feature-name`

## Project Structure

- `/frontend` - React application
- `/backend` - NestJS API server
- `/docs` - Documentation

## Code Style

### Frontend (React/JavaScript)

- Use functional components with hooks
- Follow Airbnb JavaScript style guide
- Use meaningful variable names
- Add PropTypes or TypeScript types
- Keep components small and focused

### Backend (NestJS/TypeScript)

- Follow NestJS best practices
- Use decorators appropriately
- Implement proper error handling
- Add JSDoc comments for complex functions
- Write unit tests for services

## Commit Messages

Follow conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example: `feat: add PDF upload functionality`

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass
3. Update README if adding features
4. Request review from maintainers
5. Address review feedback

## Feature Requests

- Open an issue with label "enhancement"
- Describe the feature and use case
- Discuss implementation approach

## Bug Reports

Include:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment details

## Questions?

Open an issue with label "question"

---

Thank you for contributing! 🎉
