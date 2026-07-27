## 2024-07-27 - Restrictive File Permissions & Secure Error Handling
**Vulnerability:** Weak default file permissions on state files and missing unhandled promise rejection error handlers in CLI scripts.
**Learning:** Default `writeFileSync` and `mkdirSync` without a mode allows sensitive user session data in `~/.polyagent/state.json` to be readable by others depending on the system's `umask`. Furthermore, an unhandled exception at the top-level of a CLI app exposes stack traces containing internal file paths and possibly secrets in variables.
**Prevention:** Always explicitly set file creation masks (`0o700` and `0o600`) when persisting sensitive states, and explicitly `.catch()` root CLI execution points to fail securely.
