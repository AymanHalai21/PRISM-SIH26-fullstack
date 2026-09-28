# PRISM seed data

Run `alembic upgrade head`, then `python -m app.db.seed`. The database seeds
four role-specific accounts and three explicitly assigned cases.

| Role | Email | Password |
|---|---|---|
| Police | `police@prism.demo` | `PrismDemo!2026` |
| Judge | `judge@prism.demo` | `PrismDemo!2026` |
| Lawyer | `lawyer@prism.demo` | `PrismDemo!2026` |
| Forensic | `forensic@prism.demo` | `PrismDemo!2026` |

The first seed run prints a development-only TOTP secret for each account to
the API container log. Add it to an authenticator application. Production
requires KMS-backed encryption for those secrets and must never log them.
