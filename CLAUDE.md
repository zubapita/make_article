# CLAUDE.md

This file provides guidance for AI assistants working on the **make_article** project.

## Project Overview

**make_article** is a new project repository in its initial stage. The project name suggests it will involve article creation or generation functionality. The codebase is currently minimal and awaiting implementation.

## Repository Structure

```
make_article/
├── CLAUDE.md          # AI assistant guidance (this file)
└── README.md          # Project title and description
```

## Development Environment

- **Version Control**: Git with GPG commit signing enabled (SSH key)
- **Remote**: Origin hosted via GitHub (`zubapita/make_article`)
- **Branch Strategy**: Feature branches prefixed with `claude/` for AI-assisted development

## Git Workflow

- The default branch contains the initial commit
- Feature branches follow the pattern: `claude/<description>-<session-id>`
- Commits are GPG-signed automatically
- Always push with: `git push -u origin <branch-name>`

## Commands

No build, test, or lint commands are configured yet. This section should be updated as tooling is added.

## Code Conventions

No code or linting/formatting configuration exists yet. As the project develops, document conventions here:

- **Language(s)**: TBD
- **Formatter**: TBD
- **Linter**: TBD
- **Test framework**: TBD

## Key Guidelines for AI Assistants

1. **Read before editing** - Always read existing files before proposing changes
2. **Minimal changes** - Only make changes that are directly requested; avoid over-engineering
3. **Keep this file updated** - When adding new tooling, dependencies, or conventions, update this CLAUDE.md accordingly
4. **Commit messages** - Write clear, descriptive commit messages that explain the "why"
5. **No secrets** - Never commit `.env` files, credentials, or API keys
