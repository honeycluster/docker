# Security Rules

## Pre-Commit Checklist (MANDATORY)

Before every commit, verify:
- [ ] No hardcoded secrets, API keys, tokens, or passwords
- [ ] No `.env` files staged for commit
- [ ] No private keys or certificates in the repo
- [ ] Environment variables are validated before use
- [ ] User inputs are sanitized before shell execution
- [ ] File paths are validated against traversal attacks

## Secret Management

- Secrets go in `.env` files (gitignored) or CI/CD secret stores
- Never pass secrets as Docker build args — use multi-stage builds with runtime injection
- Use `process.env.SECRET` with validation, never hardcode fallback values for secrets
- CI/CD secrets use GitHub Secrets (`${{ secrets.TOKEN }}`)

## Command Injection Prevention

```typescript
// NEVER: Template strings in shell commands
exec(`docker build -t ${userInput} .`)

// SAFE: Use argument arrays
execFile('docker', ['build', '-t', sanitizedTag, '.'])
```

## Docker Security

- Run as non-root user in production images
- Pin base image versions (never `:latest` in production)
- Don't copy `.env`, `.git`, `node_modules` into images
- Use `.dockerignore` to exclude sensitive files
- Minimize image layers and installed packages
- Set `HEALTHCHECK` in Dockerfiles

## Dependency Security

- Run `pnpm audit` before releases
- Review new dependency additions for supply chain risk
- Prefer well-maintained packages with security policies
- Pin exact versions for critical dependencies

## Response Protocol

If a security vulnerability is found:
1. **CRITICAL** (secrets exposed, injection possible): Stop and fix immediately
2. **HIGH** (Docker misconfig, missing validation): Fix before merge
3. **MEDIUM** (dependency issues, missing headers): Track and fix in next sprint
