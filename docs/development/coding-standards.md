# Coding Standards

This document outlines the coding standards and conventions for the Mahidol888 project. Following these standards ensures code consistency, maintainability, and security.

## General Principles

### 1. Security First

- Always validate inputs on both client and server
- Use type-safe database queries
- Sanitize error messages
- Follow the principle of least privilege

### 2. Type Safety

- Use TypeScript for all new code
- Define explicit interfaces for all data structures
- Avoid `any` types unless absolutely necessary
- Use strict TypeScript configuration

### 3. Code Quality

- Write self-documenting code with clear variable names
- Add comments for complex business logic
- Keep functions small and focused
- Follow DRY (Don't Repeat Yourself) principles

### 4. Performance

- Optimize database queries
- Use efficient algorithms
- Minimize bundle sizes
- Implement proper caching strategies

## TypeScript Standards

### Interface Definitions

**✅ Good:**

```typescript
interface GameBetRequest {
	amount: number;
	gameType: 'dice' | 'flip';
	clientSeed?: string;
}

interface User {
	id: string;
	username: string;
	balance: number;
	isAdmin: boolean;
}
```

**❌ Bad:**

```typescript
interface Request {
	data: any; // Avoid any types
	stuff: object; // Too generic
}
```

### Function Signatures

**✅ Good:**

```typescript
async function placeBet(
	userId: string,
	request: GameBetRequest
): Promise<ApiResponse<GameBetResult>> {
	// Implementation
}
```

**❌ Bad:**

```typescript
async function placeBet(userId, request) {
	// Missing types
}
```

### Error Handling

**✅ Good:**

```typescript
try {
	const result = await riskyOperation();
	return { success: true, data: result };
} catch (error) {
	console.error('Operation failed:', error);
	return { success: false, error: 'Operation failed' };
}
```

**❌ Bad:**

```typescript
try {
	const result = await riskyOperation();
	return result;
} catch (error) {
	throw error; // Exposes internal details
}
```

## Svelte/SvelteKit Standards

### Component Structure

**✅ Good:**

```svelte
<script lang="ts">
	// Imports first
	import { Button } from '$lib/components/ui/button';
	import { validateInput } from '$lib/utils/validation';

	// Interface definitions
	interface Props {
		value: string;
		onSubmit: (value: string) => void;
	}

	// Component props
	let { value = '', onSubmit }: Props = $props();

	// Local state
	let isLoading = $state(false);
	let errorMessage = $state('');

	// Functions
	function handleSubmit() {
		const validation = validateInput(value);
		if (!validation.valid) {
			errorMessage = validation.error!;
			return;
		}

		onSubmit(value);
	}
</script>

<!-- Template -->
<form onsubmit={handleSubmit}>
	<input bind:value class="input" />
	{#if errorMessage}
		<p class="error">{errorMessage}</p>
	{/if}
	<Button type="submit" disabled={isLoading}>Submit</Button>
</form>

<style>
	.input {
		/* Component-specific styles */
	}
</style>
```

### State Management

**✅ Good:**

```typescript
// Use reactive state properly
let count = $state(0);
let doubled = $derived(count * 2);

// Clear effect dependencies
$effect(() => {
	console.log('Count changed:', count);
});
```

**❌ Bad:**

```typescript
// Avoid unnecessary reactivity
let count = 0; // Should be $state if reactive
let doubled = count * 2; // Should be $derived for reactivity
```

### API Calls

**✅ Good:**

```typescript
import { apiCall, handleApiResponse } from '$lib/utils/error-handling';

async function submitForm(data: FormData) {
	const response = await apiCall<Result>('/api/endpoint', {
		method: 'POST',
		body: JSON.stringify(data)
	});

	return handleApiResponse(response, {
		successMessage: 'Form submitted successfully',
		onError: (error) => console.error('Submit failed:', error)
	});
}
```

## Server-Side Standards

### API Route Structure

**✅ Good:**

```typescript
import type { RequestHandler } from './$types';
import { handleGameBet, type GameLogic } from '$lib/server/game-handler';
import { validateInput } from '$lib/server/validation';

interface BetRequest {
	amount: number;
	target: number;
}

const gameLogic: GameLogic<BetRequest, BetResult> = {
	gameType: 'dice',
	validateBet: (request, balance) => validateInput(request, balance),
	calculateResult: (serverSeed, clientSeed, nonce, request) => {
		// Game logic implementation
	}
};

export const POST: RequestHandler = async (event) => {
	return handleGameBet(event, gameLogic);
};
```

### Database Operations

**✅ Good:**

```typescript
// Use transactions for critical operations
const result = db.transaction((tx) => {
	// Check balance
	const user = tx.select().from(userTable).where(eq(userTable.id, userId)).get();
	if (!user || user.balance < amount) {
		throw new Error('Insufficient balance');
	}

	// Update balance atomically
	tx.update(userTable)
		.set({ balance: sql`${userTable.balance} - ${amount}` })
		.where(eq(userTable.id, userId))
		.run();

	return { success: true };
});
```

**❌ Bad:**

```typescript
// Avoid race conditions
const user = await db.select().from(userTable).where(eq(userTable.id, userId));
if (user.balance < amount) {
	throw new Error('Insufficient balance');
}

// Race condition: balance could change between check and update
await db
	.update(userTable)
	.set({ balance: user.balance - amount })
	.where(eq(userTable.id, userId));
```

### Error Handling

**✅ Good:**

```typescript
import { handleError, ValidationError } from '$lib/server/errors';

export const POST: RequestHandler = async (event) => {
	try {
		const data = await event.request.json();

		if (!isValidData(data)) {
			throw new ValidationError('Invalid input data');
		}

		const result = await processData(data);
		return json({ success: true, result });
	} catch (error) {
		return handleError(error);
	}
};
```

## Security Standards

### Input Validation

**✅ Good:**

```typescript
function validateBetAmount(amount: unknown): { valid: boolean; error?: string } {
	if (typeof amount !== 'number') {
		return { valid: false, error: 'Amount must be a number' };
	}

	if (amount <= 0) {
		return { valid: false, error: 'Amount must be positive' };
	}

	if (amount > 10000) {
		return { valid: false, error: 'Amount exceeds maximum' };
	}

	return { valid: true };
}
```

### Authentication Checks

**✅ Good:**

```typescript
export const POST: RequestHandler = async (event) => {
	// Always check authentication for protected endpoints
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

### Rate Limiting

**✅ Good:**

```typescript
import { isRateLimited, RATE_LIMITS } from '$lib/server/rate-limiter';

export const POST: RequestHandler = async (event) => {
	const identifier = `${event.getClientAddress()}:${event.url.pathname}`;
	const rateLimitResult = isRateLimited(identifier, RATE_LIMITS.api);

	if (rateLimitResult.limited) {
		return json(
			{ success: false, error: 'Rate limit exceeded' },
			{ status: 429, headers: getRateLimitHeaders(identifier, RATE_LIMITS.api) }
		);
	}

	// Continue with request processing
};
```

## CSS/Styling Standards

### TailwindCSS Usage

**✅ Good:**

```svelte
<!-- Use semantic class combinations -->
<button
	class="rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
>
	Submit
</button>

<!-- Use responsive design -->
<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
	<!-- Content -->
</div>
```

**❌ Bad:**

```svelte
<!-- Avoid inline styles -->
<button style="background: blue; padding: 8px;">Submit</button>

<!-- Don't use arbitrary values without good reason -->
<div class="mt-[17px] bg-[#ff0000]">Content</div>
```

### Component Styling

**✅ Good:**

```svelte
<style>
	/* Use CSS custom properties for theming */
	.card {
		background-color: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius);
	}

	/* Scope styles appropriately */
	.card :global(.button) {
		margin-top: 1rem;
	}
</style>
```

## File Organization

### Directory Structure

```
src/lib/
├── components/
│   ├── game/           # Game-specific components
│   ├── self/           # App-specific components
│   └── ui/             # Reusable UI components
├── server/
│   ├── auth.ts         # Authentication logic
│   ├── db/             # Database layer
│   └── utils/          # Server utilities
├── types/              # TypeScript definitions
└── utils/              # Client utilities
```

### File Naming

- **Components**: PascalCase (e.g., `GameHistory.svelte`)
- **Utilities**: camelCase (e.g., `errorHandling.ts`)
- **API Routes**: lowercase with hyphens (e.g., `rate-limiter.ts`)
- **Types**: PascalCase interfaces (e.g., `GameBetRequest`)

### Import Organization

**✅ Good:**

```typescript
// External libraries first
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

// Internal imports by category
import { db } from '$lib/server/db';
import { validateInput } from '$lib/utils/validation';
import type { GameBetRequest } from '$lib/types/game';
```

## Testing Standards

### Unit Tests

**✅ Good:**

```typescript
import { describe, it, expect } from 'vitest';
import { validateBetAmount } from '$lib/utils/validation';

describe('validateBetAmount', () => {
	it('should accept valid amounts', () => {
		expect(validateBetAmount(100)).toEqual({ valid: true });
	});

	it('should reject negative amounts', () => {
		expect(validateBetAmount(-50)).toEqual({
			valid: false,
			error: 'Amount must be positive'
		});
	});

	it('should reject non-numeric values', () => {
		expect(validateBetAmount('invalid')).toEqual({
			valid: false,
			error: 'Amount must be a number'
		});
	});
});
```

### Integration Tests

**✅ Good:**

```typescript
import { describe, it, expect } from 'vitest';
import { POST } from './+server.js';

describe('/api/game/dice', () => {
	it('should place a valid bet', async () => {
		const request = new Request('http://localhost/api/game/dice', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				amount: 100,
				betType: 'over',
				target: 50
			})
		});

		const response = await POST({ request } as any);
		const result = await response.json();

		expect(result.success).toBe(true);
		expect(result.result).toBeDefined();
	});
});
```

## Documentation Standards

### Code Comments

**✅ Good:**

```typescript
/**
 * Generates a provably fair game result using HMAC-SHA256
 * @param serverSeed - Cryptographically secure server seed
 * @param clientSeed - User-provided or generated client seed
 * @param nonce - Sequential number to prevent replay attacks
 * @returns Normalized result between 0 and 99.99
 */
function generateGameResult(serverSeed: string, clientSeed: string, nonce: number): number {
	// Create HMAC using server seed as key
	const hmac = createHmac('sha256', serverSeed);

	// Update with client seed and nonce for uniqueness
	hmac.update(`${clientSeed}-${nonce}`);

	// Convert first 8 hex characters to decimal and normalize
	const hash = hmac.digest('hex');
	return (parseInt(hash.substring(0, 8), 16) % 10000) / 100;
}
```

### README Files

- Include purpose and usage examples
- Document environment variables
- Provide troubleshooting steps
- Keep examples up to date

## Git Standards

### Commit Messages

**✅ Good:**

```
feat: add rate limiting to authentication endpoints
fix: prevent race condition in balance updates
docs: update security guidelines for new developers
refactor: extract shared game logic into handler
```

**❌ Bad:**

```
update stuff
fix bug
changes
working on it
```

### Branch Naming

- `feature/add-dice-game`
- `fix/auth-rate-limiting`
- `docs/update-coding-standards`
- `refactor/extract-game-handler`

## Code Review Checklist

### Security Review

- [ ] Input validation on client and server
- [ ] Authentication checks for protected routes
- [ ] Rate limiting applied appropriately
- [ ] Error messages don't leak sensitive information
- [ ] Database transactions used for critical operations

### Code Quality Review

- [ ] TypeScript types are explicit and correct
- [ ] Functions are focused and testable
- [ ] Error handling is comprehensive
- [ ] Code follows established patterns
- [ ] Documentation is clear and current

### Performance Review

- [ ] Database queries are optimized
- [ ] Bundle size impact is minimal
- [ ] Memory usage is reasonable
- [ ] No unnecessary re-renders or computations

## Tools and Automation

### VS Code Configuration

Create `.vscode/settings.json`:

```json
{
	"typescript.preferences.includePackageJsonAutoImports": "on",
	"editor.formatOnSave": true,
	"editor.defaultFormatter": "esbenp.prettier-vscode",
	"editor.codeActionsOnSave": {
		"source.fixAll.eslint": true
	},
	"files.associations": {
		"*.svelte": "svelte"
	}
}
```

### Pre-commit Hooks

```bash
# Install pre-commit hooks
npm install -D husky lint-staged

# Configure in package.json
{
  "lint-staged": {
    "*.{ts,js,svelte}": ["eslint --fix", "prettier --write"],
    "*.{md,json}": ["prettier --write"]
  }
}
```

## Common Patterns

### Error Handling Pattern

```typescript
import { handleError, ValidationError } from '$lib/server/errors';

export const POST: RequestHandler = async (event) => {
	try {
		// Request processing logic
		return json({ success: true, result });
	} catch (error) {
		return handleError(error);
	}
};
```

### API Response Pattern

```typescript
interface ApiResponse<T> {
	success: boolean;
	result?: T;
	error?: string;
	timestamp?: string;
}
```

### Component Props Pattern

```typescript
interface Props {
	required: string;
	optional?: number;
	callback: (value: string) => void;
}

let { required, optional = 0, callback }: Props = $props();
```

Following these standards ensures code quality, security, and maintainability across the Mahidol888 project. When in doubt, prioritize security and clarity over cleverness.
