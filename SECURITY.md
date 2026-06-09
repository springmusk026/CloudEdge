# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.x     | ✅ Active support  |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **DO NOT** open a public GitHub issue for security vulnerabilities.
2. Email **springmusk@gmail.com** with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. You will receive a response within **48 hours** acknowledging receipt.
4. A fix will be developed and released within **7 days** for critical issues.

## Scope

The following are in scope:
- Authentication bypass or privilege escalation
- SQL injection (D1 prepared statement bypass)
- XSS in rendered content or admin panel
- CSRF on state-changing endpoints
- Unauthorized access to R2 objects or KV data
- JWT token leakage or forging
- Rate limiting bypass

## Out of Scope

- Denial of service (Cloudflare handles this at the edge)
- Issues requiring physical access
- Social engineering
- Vulnerabilities in third-party dependencies (report upstream)

## Security Best Practices

This project follows these security measures:
- PBKDF2 password hashing via `crypto.subtle`
- JWT with HMAC-SHA256 signing
- KV-based session management with TTL
- Prepared statements for all D1 queries (no string concatenation)
- IP hashing (never storing raw IPs)
- Rate limiting on all public endpoints
- CORS allowlist enforcement
- Stripe webhook signature verification (HMAC-SHA256)
- CSP headers via Hono `secureHeaders` middleware
