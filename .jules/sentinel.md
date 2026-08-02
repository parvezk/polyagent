## 2026-08-02 - Local State Storage Permissions

**Vulnerability:** Local state file (`~/.polyagent/state.json`) was created with default OS permissions, potentially exposing sensitive session data to other users on the system.
**Learning:** Node.js file system methods (`mkdirSync`, `writeFileSync`) do not default to secure permissions. Sensitive data storage must explicitly restrict access.
**Prevention:** Always specify `mode: 0o700` for directories and `mode: 0o600` for files when creating local configuration or state directories. Use `chmodSync` to enforce permissions on existing files.
