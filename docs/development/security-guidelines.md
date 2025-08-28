# Security Guidelines

Security is paramount in the Mahidol888 gambling platform. This document outlines essential security practices that all developers must follow.

## Security-First Mindset

### Core Principles

1. **Never Trust User Input** - Validate everything on both client and server
2. **Defense in Depth** - Implement multiple layers of security
3. **Principle of Least Privilege** - Grant minimum necessary permissions
4. **Fail Securely** - Ensure failures don't compromise security
5. **Security by Design** - Consider security implications in every feature

### Threat Model

Our primary threats include:

- **Financial Fraud** - Manipulation of balances or game outcomes
- **Account Takeover** - Unauthorized access to user accounts
- **DDoS Attacks** - Service disruption through traffic flooding
- **Data Breaches** - Unauthorized access to sensitive information
- **Game Manipulation** - Attempts to predict or influence game outcomes

## Authentication & Authorization

### Session Management

**✅ Secure Implementation:**

```typescript
// Set secure session cookies
export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date) {
	event.cookies.set(sessionCookieName, token, {
		expires: expiresAt,
		path: '/',
		httpOnly: true, // Prevent XSS attacks
		secure: isProduction, // HTTPS only in production
		sameSite: 'strict' // CSRF protection
	});
}
```

**❌ Insecure Patterns:**

```typescript
// Never store sensitive data in localStorage
localStorage.setItem('session', token); // ❌ Vulnerable to XSS

// Never use weak session identifiers
const sessionId = Math.random().toString(); // ❌ Predictable

// Never skip authentication checks
if (user.id) {
	// ❌ User object could be manipulated
	// Protected logic
}
```

### Password Security

**✅ Secure Hashing:**

```typescript
import { hash, verify } from '@node-rs/argon2';

// Hash passwords with strong parameters
const passwordHash = await hash(password, {
	memoryCost: 19456, // 19 MB memory usage
	timeCost: 2, // 2 iterations
	outputLen: 32, // 32 byte output
	parallelism: 1 // Single thread
});

// Verify with constant-time comparison
const isValid = await verify(passwordHash, password, {
	memoryCost: 19456,
	timeCost: 2,
	outputLen: 32,
	parallelism: 1
});
```

### Authentication Checks

**✅ Required Pattern:**

```typescript
export const POST: RequestHandler = async (event) => {
	// ALWAYS check authentication for protected endpoints
	const sessionToken = auth.getSessionToken(event);
	if (!sessionToken) {
		return json({ success: false, error: 'Authentication required' }, { status: 401 });
	}

	const { session, user } = await auth.validateSessionToken(sessionToken);
	if (!session || !user) {
		return json({ success: false, error: 'Invalid session' }, { status: 401 });
	}

	// Continue with authenticated logic
};
```

## Input Validation

### Server-Side Validation

**✅ Comprehensive Validation:**

```typescript
interface BetRequest {
	amount: number;
	gameType: 'dice' | 'flip';
	target?: number;
}

function validateBetRequest(data: unknown): { valid: boolean; error?: string; data?: BetRequest } {
	// Type checking
	if (!data || typeof data !== 'object') {
		return { valid: false, error: 'Invalid request format' };
	}

	const request = data as any;

	// Amount validation
	if (typeof request.amount !== 'number' || isNaN(request.amount)) {
		return { valid: false, error: 'Amount must be a valid number' };
	}

	if (request.amount <= 0) {
		return { valid: false, error: 'Amount must be positive' };
	}

	if (request.amount > 10000) {
		return { valid: false, error: 'Amount exceeds maximum limit' };
	}

	// Game type validation
	if (!['dice', 'flip'].includes(request.gameType)) {
		return { valid: false, error: 'Invalid game type' };
	}

	// Game-specific validation
	if (request.gameType === 'dice') {
		if (typeof request.target !== 'number' || request.target < 0.01 || request.target > 99.99) {
			return { valid: false, error: 'Invalid dice target' };
		}
	}

	return { valid: true, data: request as BetRequest };
}
```

### SQL Injection Prevention

**✅ Use Parameterized Queries:**

```typescript
// Drizzle ORM provides automatic parameterization
const user = await db.select().from(userTable).where(eq(userTable.username, username)); // ✅ Safe

// Never use string concatenation
const query = `SELECT * FROM users WHERE username = '${username}'`; // ❌ Vulnerable
```

### XSS Prevention

**✅ Proper Output Encoding:**

```svelte
<!-- ⚠️ Only if trustedHtml is sanitized -->

<!-- Never use user input directly in script context -->
<script>
	const data = { userInput }; // ❌ XSS vulnerability
</script>

<!-- Svelte automatically escapes variables -->
<p>{userInput}</p>
<!-- ✅ Safe -->

<!-- Use @html only for trusted content -->
<div>{@html trustedHtml}</div>
```

## Rate Limiting

### Implementation

**✅ Multi-Layer Rate Limiting:**

```typescript
import { isRateLimited, RATE_LIMITS } from '$lib/server/rate-limiter';

export const POST: RequestHandler = async (event) => {
	// Different limits for different endpoints
	const identifier = event.getClientAddress();
	const endpoint = event.url.pathname;

	let rateLimit;
	if (endpoint.includes('/auth')) {
		rateLimit = RATE_LIMITS.auth; // 5 attempts per 15 minutes
	} else if (endpoint.includes('/game')) {
		rateLimit = RATE_LIMITS.betting; // 60 bets per minute
	} else {
		rateLimit = RATE_LIMITS.api; // 100 requests per minute
	}

	const result = isRateLimited(identifier, rateLimit);
	if (result.limited) {
		return json(
			{ success: false, error: 'Rate limit exceeded' },
			{
				status: 429,
				headers: getRateLimitHeaders(identifier, rateLimit)
			}
		);
	}

	// Continue processing
};
```

### Rate Limit Configuration

```typescript
export const RATE_LIMITS = {
	auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // Auth: 5/15min
	betting: { windowMs: 60 * 1000, maxRequests: 60 }, // Betting: 60/min
	api: { windowMs: 60 * 1000, maxRequests: 100 } // API: 100/min
} as const;
```

## CSRF Protection

### Implementation

**✅ Double Submit Cookie Pattern:**

```typescript
// Server-side token generation
export function generateCSRFToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Validation with constant-time comparison
export function validateCSRFToken(event: RequestEvent): boolean {
	const cookieToken = getCSRFTokenFromCookie(event);
	const headerToken = event.request.headers.get('X-CSRF-Token');

	if (!cookieToken || !headerToken) {
		return false;
	}

	return constantTimeEqual(cookieToken, headerToken);
}
```

**✅ Client-side Integration:**

```typescript
// Automatic CSRF token inclusion
export async function apiCall<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
	if (options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method)) {
		const csrfToken = await getCSRFToken();
		if (csrfToken) {
			options.headers = {
				...options.headers,
				'X-CSRF-Token': csrfToken
			};
		}
	}

	return fetch(url, options);
}
```

## Database Security

### Transaction Safety

**✅ Use Transactions for Critical Operations:**

```typescript
// Balance updates must be atomic
const result = db.transaction((tx) => {
	// Check current balance within transaction
	const currentUser = tx
		.select({ balance: table.user.balance })
		.from(table.user)
		.where(eq(table.user.id, userId))
		.all();

	if (currentUser.length === 0 || currentUser[0].balance < amount) {
		throw new Error('Insufficient balance');
	}

	// Update balance atomically
	tx.update(table.user)
		.set({
			balance: sql`${table.user.balance} + ${balanceChange}`
		})
		.where(eq(table.user.id, userId))
		.run();

	// Insert bet record
	tx.insert(table.bet)
		.values({
			id: betId,
			userId,
			amount
			// ... other fields
		})
		.run();

	return { success: true, newBalance: currentUser[0].balance + balanceChange };
});
```

### Sensitive Data Protection

**✅ Data Minimization:**

```typescript
// Only select necessary fields
const publicUser = await db
	.select({
		id: table.user.id,
		username: table.user.username,
		balance: table.user.balance,
		isAdmin: table.user.isAdmin
		// Don't select passwordHash
	})
	.from(table.user)
	.where(eq(table.user.id, userId));

// Define public types
export type PublicUser = Omit<User, 'passwordHash'>;
```

## Error Handling & Information Disclosure

### Secure Error Responses

**✅ Sanitized Error Messages:**

```typescript
import { handleError, AppError, ValidationError } from '$lib/server/errors';

export const POST: RequestHandler = async (event) => {
	try {
		// Business logic
		return json({ success: true, result });
	} catch (error) {
		// Centralized error handling with sanitization
		return handleError(error);
	}
};

// Error handler automatically sanitizes based on environment
export function handleError(error: unknown): Response {
	if (error instanceof AppError) {
		return json(
			{
				success: false,
				error: error.message, // Safe to expose
				timestamp: error.timestamp.toISOString()
			},
			{ status: error.statusCode }
		);
	}

	// Never expose internal errors in production
	return json(
		{
			success: false,
			error: isDevelopment ? String(error) : 'Internal server error',
			timestamp: new Date().toISOString()
		},
		{ status: 500 }
	);
}
```

### Logging Security Events

**✅ Comprehensive Security Logging:**

```typescript
// Log authentication events
export async function handleLogin(event: RequestEvent, username: string, password: string) {
	const clientIP = event.getClientAddress();

	try {
		const user = await authenticateUser(username, password);

		// Log successful login
		console.log(`Login success: ${username} from ${clientIP}`);

		return { success: true };
	} catch (error) {
		// Log failed login attempts
		console.warn(`Login failed: ${username} from ${clientIP} - ${error.message}`);

		// Add delay to prevent timing attacks
		await new Promise((resolve) => setTimeout(resolve, 1000));

		throw error;
	}
}
```

## Game Security

### Provably Fair Implementation

**✅ Cryptographically Secure:**

```typescript
import { createHash, createHmac, randomBytes } from 'crypto';

// Generate cryptographically secure server seed
export function generateServerSeed(): { seed: string; hash: string } {
	const seed = randomBytes(32).toString('hex');
	const hash = createHash('sha256').update(seed).digest('hex');
	return { seed, hash };
}

// Deterministic result generation
export function generateGameResult(serverSeed: string, clientSeed: string, nonce: number): number {
	const hmac = createHmac('sha256', serverSeed);
	hmac.update(`${clientSeed}-${nonce}`);
	const hash = hmac.digest('hex');
	return (parseInt(hash.substring(0, 8), 16) % 10000) / 100;
}

// Verification function for transparency
export function verifyGameResult(
	serverSeed: string,
	clientSeed: string,
	nonce: number,
	expectedResult: number
): boolean {
	const calculatedResult = generateGameResult(serverSeed, clientSeed, nonce);
	return Math.abs(calculatedResult - expectedResult) < 0.01;
}
```

### Balance Protection

**✅ Multiple Validation Layers:**

```typescript
export const POST: RequestHandler = async (event) => {
	// 1. Authentication check
	const { user } = await validateSession(event);

	// 2. Input validation
	const { amount } = await validateGameRequest(event);

	// 3. Rate limiting
	await checkRateLimit(event, user.id);

	// 4. Balance validation with transaction
	const result = db.transaction((tx) => {
		// Re-check balance within transaction
		const currentBalance = getCurrentBalance(tx, user.id);
		if (currentBalance < amount) {
			throw new Error('Insufficient balance');
		}

		// Process game and update balance atomically
		return processGame(tx, user.id, amount);
	});

	return json({ success: true, result });
};
```

## Environment Security

### Production Configuration

**✅ Secure Environment Variables:**

```env
# Production .env
NODE_ENV=production
DATABASE_URL="./production.db"

# Use strong, random secrets (64+ characters)
SESSION_SECRET="your-cryptographically-secure-session-secret-here"
CSRF_SECRET="your-cryptographically-secure-csrf-secret-here"

# Enable security features
ENABLE_RATE_LIMITING=true
PUBLIC_SITE_URL=https://yourdomain.com

# Security headers
SECURE_COOKIES=true
FORCE_HTTPS=true
```

### Security Headers

**✅ Implement Security Headers:**

```typescript
// In hooks.server.ts
export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	if (isProduction) {
		// Security headers
		response.headers.set('X-Frame-Options', 'DENY');
		response.headers.set('X-Content-Type-Options', 'nosniff');
		response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
		response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

		// Content Security Policy
		response.headers.set(
			'Content-Security-Policy',
			"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
		);

		// HSTS (HTTPS only)
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}

	return response;
};
```

## Security Testing

### Test Cases

**✅ Security Test Examples:**

```typescript
import { describe, it, expect } from 'vitest';

describe('Security Tests', () => {
	it('should reject requests without authentication', async () => {
		const response = await fetch('/api/game/dice', {
			method: 'POST',
			body: JSON.stringify({ amount: 100 })
		});

		expect(response.status).toBe(401);
	});

	it('should enforce rate limiting', async () => {
		// Make multiple requests rapidly
		const requests = Array(10)
			.fill(null)
			.map(() =>
				fetch('/api/auth', {
					method: 'POST',
					body: JSON.stringify({ action: 'login', username: 'test', password: 'wrong' })
				})
			);

		const responses = await Promise.all(requests);
		const rateLimited = responses.some((r) => r.status === 429);

		expect(rateLimited).toBe(true);
	});

	it('should validate input data', async () => {
		const response = await authenticatedRequest('/api/game/dice', {
			amount: -100, // Invalid amount
			target: 50
		});

		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.error).toContain('positive');
	});
});
```

## Security Checklist

### Pre-deployment Security Review

- [ ] **Authentication**: All protected endpoints check authentication
- [ ] **Authorization**: Users can only access their own data
- [ ] **Input Validation**: All inputs validated on client and server
- [ ] **Rate Limiting**: Appropriate limits for all endpoints
- [ ] **CSRF Protection**: State-changing requests protected
- [ ] **XSS Prevention**: All user content properly escaped
- [ ] **SQL Injection**: Only parameterized queries used
- [ ] **Error Handling**: No sensitive information in error messages
- [ ] **Logging**: Security events properly logged
- [ ] **HTTPS**: All production traffic encrypted
- [ ] **Security Headers**: CSP, HSTS, and other headers configured
- [ ] **Environment**: Production secrets properly configured

### Code Review Security Checklist

- [ ] **New Endpoints**: Authentication and validation implemented
- [ ] **Database Operations**: Transactions used for critical operations
- [ ] **User Input**: Validated and sanitized
- [ ] **Error Handling**: Doesn't leak sensitive information
- [ ] **Dependencies**: No known vulnerabilities
- [ ] **Secrets**: No hardcoded credentials
- [ ] **Permissions**: Principle of least privilege followed

## Incident Response

### Security Incident Procedure

1. **Immediate Response**
   - Assess severity and impact
   - Contain the incident (disable affected features if necessary)
   - Document all actions taken

2. **Investigation**
   - Analyze logs for attack vectors
   - Identify affected users/data
   - Determine root cause

3. **Remediation**
   - Fix vulnerable code
   - Update security measures
   - Deploy patches

4. **Communication**
   - Notify affected users if data compromised
   - Update security documentation
   - Conduct post-incident review

### Contact Information

- **Security Team**: security@mahidol888.com
- **Emergency Response**: Follow incident response procedure
- **Vulnerability Reports**: Use responsible disclosure process

## Continuous Security

### Regular Security Practices

- **Dependency Updates**: Regularly update packages for security fixes
- **Security Audits**: Regular code reviews focusing on security
- **Penetration Testing**: Periodic third-party security assessments
- **Log Monitoring**: Continuous monitoring for suspicious activity
- **Security Training**: Keep team updated on latest security practices

### Tools and Resources

- `npm audit` - Check for vulnerable dependencies
- ESLint security rules - Automated security linting
- Drizzle ORM - Prevents SQL injection by design
- OWASP Top 10 - Industry standard security risks

Remember: Security is everyone's responsibility. When in doubt, choose the more secure option and consult the security guidelines or team.
