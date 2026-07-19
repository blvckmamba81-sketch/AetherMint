# Contributing Guide

Thank you for your interest in contributing to AetherMint! We welcome contributions from everyone.

## How to Contribute

### 1. Finding an Issue
- Look through our open issues to find something you would like to work on.
- If you find an issue you like, leave a comment asking to be assigned to it.

### 2. Development Process
- **Branching Strategy:** Create a new feature branch from the `main` branch before making changes. Use a clear name like `feature/your-feature-name` or `bugfix/issue-number`.
- **Commit Conventions:** All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification. This is enforced automatically via commitlint on every commit.

### 3. Commit Message Convention

We use **Conventional Commits** to power automated changelog generation and semantic versioning.

#### Format

```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

#### Allowed Types

| Type       | Changelog Section    | Description                                         |
|------------|----------------------|-----------------------------------------------------|
| `feat`     | ✨ Features           | A new feature                                       |
| `fix`      | 🐛 Bug Fixes         | A bug fix                                           |
| `docs`     | 📚 Documentation     | Documentation changes only                          |
| `style`    | —                    | Code style changes (formatting, whitespace)         |
| `refactor` | —                    | Code change that neither fixes a bug nor adds a feature |
| `perf`     | ⚡ Performance        | Performance improvements                            |
| `test`     | —                    | Adding or updating tests                            |
| `build`    | 🏗️ Build System      | Build system or external dependency changes         |
| `ci`       | 🔧 CI/CD             | CI/CD configuration changes                         |
| `chore`    | —                    | Maintenance tasks that don't modify src or test     |
| `revert`   | ⏪ Reverts           | Reverts a previous commit                           |

#### Breaking Changes

Append `!` after the type/scope, or include `BREAKING CHANGE:` in the footer:

```
feat(auth)!: change authentication flow to use OAuth2

BREAKING CHANGE: JWT tokens are no longer accepted. Use OAuth2 tokens instead.
```

Breaking changes appear under a dedicated **💥 Breaking Changes** section in the changelog.

#### Scope (Optional)

Use a scope to specify the area of the codebase affected:

```
feat(frontend): add wallet connection button
fix(backend): resolve enrollment race condition
docs(contracts): update deployment guide
ci(changelog): add automated release workflow
```

Common scopes: `frontend`, `backend`, `contracts`, `ci`, `docs`, `scripts`, `deps`

#### Examples

```bash
# Good commit messages
feat(credentials): add batch credential issuance endpoint
fix(auth): resolve token expiry edge case on refresh
docs: add commit convention section to CONTRIBUTING.md
ci(changelog): add automated changelog generation workflow
chore(deps): bump @stellar/stellar-sdk to 11.2.0
feat!: migrate to new Soroban SDK v26 API

# Bad commit messages (will be rejected by commitlint)
fixed stuff
WIP
update
asdfgh
```

### 4. Submitting a Pull Request (PR)
- Push your local changes to your forked repository.
- Open a Pull Request from your feature branch to our `main` branch.
- Ensure your PR description clearly mentions the issue it solves by writing `Closes #IssueNumber` (e.g., `Closes #31`).
- The project maintainers will review your code and provide feedback or merge it once approved.

### 5. Changelog

The `CHANGELOG.md` is **automatically generated** from conventional commits. You do not need to edit it manually.

- On every push to `main`, the changelog GitHub Actions workflow updates `CHANGELOG.md` and creates a version tag.
- To generate the changelog locally:
  ```bash
  npm run changelog
  ```
- To preview the next changelog without writing it:
  ```bash
  npm run changelog:preview
  ```

## Code Style

- **TypeScript/JavaScript:** Follow the ESLint rules defined in each workspace.
- **Rust:** Use `cargo fmt` and `cargo clippy` before committing.
- Keep commits focused and atomic — one logical change per commit.

## Questions?

Open a [GitHub Discussion](https://github.com/jobbykings/aethermint-education/discussions) or join us on [Discord](https://discord.gg/aethermint-education).
