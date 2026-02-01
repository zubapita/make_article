# Repository Guidelines

## Project Summary
This repository currently contains the planning and design artifacts for the make_article PoC. The system is intended to run a guided workflow (theme → research → outline → draft → review) and persist results as Markdown files. Refer to `docs/Plan.md` and `docs/design.md` as the source of truth.

## Project Structure & Module Organization
- `docs/`: Requirements and design documentation.
  - Examples: `docs/requirements.md`, `docs/design.md`, `docs/ui_design.md`.
- Source code is not yet initialized. When implementation begins, use the MVC-oriented structure defined in `docs/design.md` (e.g., `src/models/`, `src/controllers/`, `src/app/`).
- Persist project outputs in a per-project directory, as defined in `docs/database_design.md` (e.g., `projects/{project_id}/draft.md`).

## Build, Test, and Development Commands
No build or test commands are defined yet. When the application is scaffolded, update this section with concrete commands (e.g., `npm run dev`, `npm test`) and keep them in sync with the actual tooling.

## Coding Style & Naming Conventions
- Keep the first implementation minimal and explicit (avoid over-engineering).
- Maintain strict MVC separation:
  - Models: data + business rules only
  - Views: UI rendering only
  - Controllers: orchestration only
- Prefer clear, descriptive names (e.g., `workflow_controller`, `article_project`).
- Use ASCII-only identifiers unless the file already uses non-ASCII.

## Testing Guidelines
Testing infrastructure is not yet defined. When added:
- Write minimal unit tests for new functionality.
- Name tests after the behavior they verify (e.g., `article_project.spec.ts`).
- Document how to run tests in this file.

## Commit & Pull Request Guidelines
This repository does not currently include Git history, so no conventions exist yet. If you initialize version control:
- Use concise, imperative commit messages (e.g., `Add workflow controller skeleton`).
- PRs should include: purpose, affected docs/paths, and any manual verification steps.

## Documentation Updates
Any implementation changes must be reflected in the docs under `docs/` (especially `requirements.md`, `design.md`, and `tasks.md`). Keep these documents consistent and current.
