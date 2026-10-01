# Project architecture

- Keep the preview authentication broker's exact origin allowlist and message types: they are an external protocol required for shared preview login, not user-facing branding.
- Keep existing seeded demo account identifiers stable: changing them would create duplicate accounts or break existing sign-ins.
- Keep the development-only component inspection plugin active: the editor uses it to select elements in the preview.