## 2026-07-30 - Local state file permissions (StateStore)
**Vulnerability:** Local session data saved in `~/.polyagent/state.json` was created with default wide permissions, making it readable by any local user.
**Learning:** Node.js file operations (`mkdirSync`, `writeFileSync`) use process default permissions (often `0o777` or `0o666` modified by umask) if explicit modes are not provided. Local CLI state containing sensitive data (e.g. sessions, prompt text, potential paths) needs explicitly restricted permissions.
**Prevention:** Always pass explicit restrictive modes (`mode: 0o700` for directories, `mode: 0o600` for files) when persisting sensitive local state or credentials.
