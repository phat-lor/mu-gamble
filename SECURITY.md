# Security Documentation

## Overview

This document outlines the security measures implemented in the Mahidol888 gambling application to protect against common vulnerabilities and ensure fair gameplay.

## Security Measures Implemented

### 1. Authentication & Session Management

- **Secure Session Tokens**: Uses cryptographically secure random tokens
- **Session Security**: 
  - HttpOnly cookies to prevent XSS
  - Secure flag in production
  - SameSite=strict to prevent CSRF
  - 30-day expiration with automatic renewal
- **Password Security**: 
  - Argon2 hashing with high memory/time costs
  - Timing attack protection with delays
  - Strong password requirements

### 2. Rate Limiting

- **Authentication Endpoints**: 5 attempts per 15 minutes per IP
- **Betting Endpoints**: 10 bets per minute per user
- **API Endpoints**: 100 requests per minute per IP
- **Headers**: Proper rate limit headers (X-RateLimit-*)

### 3. CSRF Protection

- **Double Submit Cookie Pattern**: Implemented for all state-changing requests
- **Token Validation**: Constant-time comparison to prevent timing attacks
- **Automatic Token Management**: Tokens generated and validated automatically

### 4. Input Validation & Sanitization

- **Server-side Validation**: All inputs validated on the server
- **Type Safety**: TypeScript for compile-time type checking
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **XSS Prevention**: Proper escaping and Content Security Policy

### 5. Database Security

- **Transaction Isolation**: Database transactions prevent race conditions
- **Foreign Key Constraints**: Referential integrity enforced
- **Balance Protection**: Atomic balance updates with re-checks
- **WAL Mode**: Write-Ahead Logging for better concurrency

### 6. Provably Fair Gaming

- **Server Seed**: Cryptographically secure random generation
- **Client Seed**: User-provided or auto-generated randomness
- **Nonce System**: Sequential numbers prevent replay attacks
- **Verification**: Complete audit trail for all bets
- **Hash Commitment**: Server seed hashed before reveal

### 7. Error Handling

- **Information Disclosure**: Sanitized error messages in production
- **Logging**: Comprehensive error logging with timestamps
- **Response Codes**: Proper HTTP status codes
- **Client Feedback**: User-friendly error messages

## Security Best Practices

### Environment Configuration

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="./production.db"

# Security (Generate random 64-character strings)
SESSION_SECRET="your-super-secure-session-secret-here"
CSRF_SECRET="your-super-secure-csrf-secret-here"

# Production settings
NODE_ENV=production
ENABLE_RATE_LIMITING=true
PUBLIC_SITE_URL=https://your-domain.com
```

### Production Deployment

1. **HTTPS Only**: Always use HTTPS in production
2. **Environment Variables**: Never commit secrets to version control
3. **Database Backups**: Regular automated backups
4. **Monitoring**: Log monitoring and alerting
5. **Updates**: Keep dependencies up to date

### Content Security Policy

Implement a strict CSP header:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'
```

## Vulnerability Assessments

### Regular Security Checks

1. **Dependency Scanning**: Use `npm audit` or similar tools
2. **Code Review**: Regular security-focused code reviews
3. **Penetration Testing**: External security assessments
4. **Monitoring**: Real-time security monitoring

### Common Attack Vectors Addressed

- ✅ **SQL Injection**: Parameterized queries
- ✅ **XSS**: Input sanitization and CSP
- ✅ **CSRF**: Token-based protection
- ✅ **Session Hijacking**: Secure session management
- ✅ **Rate Limiting**: DDoS and brute force protection
- ✅ **Information Disclosure**: Error sanitization
- ✅ **Race Conditions**: Database transactions
- ✅ **Timing Attacks**: Constant-time comparisons

## Incident Response

### Security Incident Procedure

1. **Detection**: Monitor logs for suspicious activity
2. **Assessment**: Determine severity and impact
3. **Containment**: Isolate affected systems
4. **Investigation**: Analyze attack vectors
5. **Recovery**: Restore systems and data
6. **Prevention**: Update security measures

### Contact Information

- **Security Team**: security@mahidol888.com
- **Emergency Contact**: +1-XXX-XXX-XXXX

## Compliance & Auditing

### Audit Trail

- All user actions logged with timestamps
- Complete betting history maintained
- Session activity tracked
- Database changes auditable

### Data Protection

- **Personal Data**: Minimal collection, secure storage
- **Financial Data**: Encrypted at rest and in transit
- **Retention**: Data retention policies enforced
- **Right to Deletion**: User data deletion procedures

## Additional Security Recommendations

### For Developers

1. **Code Reviews**: All security-related code must be reviewed
2. **Testing**: Security tests for all critical paths
3. **Documentation**: Keep security docs updated
4. **Training**: Regular security awareness training

### For Operations

1. **Monitoring**: 24/7 security monitoring
2. **Backups**: Regular encrypted backups
3. **Updates**: Automated security updates
4. **Access Control**: Principle of least privilege

## Reporting Security Issues

If you discover a security vulnerability, please report it to:

- **Email**: security@mahidol888.com
- **Subject**: "Security Vulnerability Report"
- **Include**: Detailed description and steps to reproduce

We take security seriously and will respond to verified reports within 24 hours.

## Security Changelog

### Version 1.0.0 (Current)

- Initial security implementation
- Rate limiting system
- CSRF protection
- Secure session management
- Input validation framework
- Error handling system
- Provably fair gaming implementation
