# Troubleshooting Guide

This guide helps you diagnose and resolve common issues in the Mahidol888 platform. Follow the structured approach to identify and fix problems quickly.

## Quick Diagnosis

### System Health Check

```bash
# 1. Check if the application is running
curl http://localhost:5173/health

# 2. Check database connectivity
bun run db:studio

# 3. Check for TypeScript errors
bun run check

# 4. Check for linting issues
bun run lint

# 5. Verify environment configuration
echo $NODE_ENV
cat .env
```

### Common Symptoms and Quick Fixes

| Symptom                 | Quick Fix               | Full Solution                             |
| ----------------------- | ----------------------- | ----------------------------------------- |
| 🔴 Server won't start   | Check `.env` file       | [Server Issues](#server-startup-issues)   |
| 🔴 Database errors      | Verify `DATABASE_URL`   | [Database Issues](#database-issues)       |
| 🔴 Authentication fails | Check session cookies   | [Auth Issues](#authentication-issues)     |
| 🔴 Games not working    | Verify game endpoints   | [Game Issues](#game-functionality-issues) |
| 🔴 CSRF errors          | Check token headers     | [CSRF Issues](#csrf-protection-issues)    |
| 🔴 Rate limit errors    | Check rate limit config | [Rate Limiting](#rate-limiting-issues)    |

## Server Startup Issues

### Problem: Server Won't Start

**Symptoms:**

- Error on `bun run dev`
- Port already in use
- Environment variable errors

**Diagnosis:**

```bash
# Check if port is in use
lsof -ti:5173

# Check environment variables
env | grep -E "(NODE_ENV|DATABASE_URL)"

# Check for syntax errors
bun run check

# Check for missing dependencies
bun install
```

**Solutions:**

1. **Port Already in Use:**

```bash
# Kill process using port 5173
kill -9 $(lsof -ti:5173)

# Or use different port
bun run dev -- --port 3000
```

2. **Missing Environment Variables:**

```bash
# Copy example environment file
cp .env.example .env

# Edit with your values
nano .env
```

3. **Dependency Issues:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm bun.lockb  # or package-lock.json
bun install
```

### Problem: Build Failures

**Symptoms:**

- `bun run build` fails
- TypeScript compilation errors
- Import resolution issues

**Solutions:**

1. **TypeScript Errors:**

```bash
# Clear TypeScript cache
rm -rf .svelte-kit
rm -rf node_modules/.vite

# Regenerate types
bun run check
```

2. **Import Issues:**

```bash
# Check import paths
grep -r "\$lib" src/
grep -r "\$app" src/

# Verify tsconfig.json paths
cat tsconfig.json
```

## Database Issues

### Problem: Database Connection Failures

**Symptoms:**

- "DATABASE_URL is not set" error
- SQLite file permission errors
- Database locked errors

**Diagnosis:**

```bash
# Check database file exists and permissions
ls -la local.db
file local.db

# Test database connectivity
sqlite3 local.db ".tables"

# Check for long-running transactions
sqlite3 local.db ".timeout 1000" ".quit"
```

**Solutions:**

1. **Database File Issues:**

```bash
# Create new database
rm local.db
bun run db:push

# Fix permissions
chmod 664 local.db
```

2. **Database Locked:**

```bash
# Check for zombie processes
ps aux | grep node

# Force unlock (last resort)
sqlite3 local.db ".timeout 5000" "BEGIN IMMEDIATE; ROLLBACK;"
```

### Problem: Migration Issues

**Symptoms:**

- Schema mismatch errors
- Migration failures
- "table already exists" errors

**Solutions:**

1. **Schema Sync Issues:**

```bash
# Generate new migration
bun run db:generate

# Review migration files
ls drizzle/

# Apply migrations
bun run db:push
```

2. **Reset Database:**

```bash
# ⚠️ This will delete all data
rm local.db
bun run db:push
```

## Authentication Issues

### Problem: Login Failures

**Symptoms:**

- "Authentication required" errors
- Session validation failures
- Cookie not being set

**Diagnosis:**

```bash
# Check browser cookies
# Open DevTools > Application > Cookies

# Check session in database
sqlite3 local.db "SELECT * FROM session LIMIT 5;"

# Check authentication logs
grep "auth" logs/app.log
```

**Solutions:**

1. **Cookie Issues:**

```javascript
// In browser console, check cookies
document.cookie;

// Clear cookies for testing
document.cookie.split(';').forEach((c) => {
	document.cookie = c
		.replace(/^ +/, '')
		.replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
});
```

2. **Session Validation:**

```bash
# Check session expiration
sqlite3 local.db "SELECT id, user_id, expires_at FROM session WHERE expires_at > datetime('now');"

# Clean expired sessions
sqlite3 local.db "DELETE FROM session WHERE expires_at < datetime('now');"
```

### Problem: Flip Game Results Display Incorrectly

**Symptoms:**

- Flip game history shows "dog" and "cat" in lowercase
- Game results display inconsistent capitalization
- History shows wrong mapping (1 = Cat, 0 = Dog instead of correct mapping)

**Diagnosis:**

```bash
# Check the result mapping logic
grep -r "result.*1.*Cat" src/routes/game/flip/
grep -r "flipResult.*cat" src/routes/game/flip/
```

**Root Cause:**

The flip game was incorrectly mapping the result values:

- `0 = cat` (should be "Cat")
- `1 = dog` (should be "Dog")
- But the display logic was backwards

**Solution:**

Fixed the result mapping and capitalization:

```typescript
// Before (incorrect mapping and lowercase)
value: bet.result === 1 ? 'Cat' : 'Dog', // Wrong mapping
value: flipResult, // Lowercase

// After (correct mapping and proper capitalization)
value: bet.result === 0 ? 'Cat' : 'Dog', // Correct mapping
value: flipResult === 'cat' ? 'Cat' : 'Dog', // Proper capitalization
```

**Prevention:**

- Ensure consistent capitalization across all UI components
- Test result mapping logic thoroughly
- Use proper TypeScript types for result values

### Problem: Maximum Bet Amount Too Low

**Symptoms:**

- Cannot bet more than 10% of balance
- Error message: "Maximum bet amount is X.XX"
- Want to bet more but validation prevents it
- Balance is sufficient but bet is rejected

**Diagnosis:**

```bash
# Check current validation logic
grep -r "maxBet" src/lib/utils/error-handling.ts

# Check balance vs maximum bet calculation
# Current: maxBet = Math.min(balance * 0.5, 1000)
```

**Root Cause:**

The client-side validation was limiting bets to 10% of the user's balance, which was too restrictive for many users.

**Solution:**

Updated the maximum bet calculation to allow up to 50% of balance:

```typescript
// Before (too restrictive)
const maxBet = Math.min(balance * 0.1, 1000); // 10% of balance

// After (more reasonable)
const maxBet = Math.min(balance * 0.5, 1000); // 50% of balance
```

**Prevention:**

- Review bet limits periodically based on user feedback
- Consider implementing configurable bet limits
- Test with various balance amounts

### Problem: User Balance Not Updating Globally

**Symptoms:**

- Balance updates in game components but not reflected in sidebar
- Need to refresh page to see updated balance
- Balance shows different values in different parts of the UI
- Game results show new balance but sidebar shows old balance

**Diagnosis:**

```bash
# Check if user store is properly initialized
# In browser console, check store state
console.log('User store state:', $userStore);

# Check if balance updates are being called
# Look for userStore.updateBalance() calls in game components
grep -r "updateBalance" src/routes/game/
```

**Root Cause:**

This issue occurs when game components update local balance state instead of the global user store, or when the user store is not properly subscribed to by all components.

**Solution:**

Ensure all balance updates go through the global user store:

```typescript
// ❌ Wrong - local state only
userBalance = newBalance;

// ✅ Correct - global store update
userStore.updateBalance(newBalance);
```

**Prevention:**

- Always use `userStore.updateBalance()` for balance changes
- Subscribe to user store in all components that display balance
- Use `$derived($userStore)` for reactive balance display

### Problem: Authentication Dialog State Not Refreshing

**Symptoms:**

- Login/register succeeds but UI doesn't update to show logged-in state
- Dialog closes but sidebar still shows "Sign In" button
- User appears logged out despite successful authentication
- Need to manually refresh page to see logged-in state

**Diagnosis:**

```bash
# Check browser DevTools > Network tab during login
# Look for successful auth API response (200 status)

# Check browser DevTools > Application > Cookies
# Verify session cookie is being set

# Check if invalidateAll() is being called in auth dialog
grep -r "invalidateAll" src/lib/components/self/auth-dialog.svelte
```

**Root Cause:**

This issue was caused by the `handleApiResponse` function in `src/lib/utils/error-handling.ts` only calling the `onSuccess` callback when response data existed. Since the auth API returns `{ success: true, message: '...' }` without a `data` field, the callback was never executed.

**Solution:**

The issue has been fixed by updating the `handleApiResponse` function to always call the `onSuccess` callback for successful responses:

```typescript
// Before (problematic)
if (onSuccess && data) {
	onSuccess(data);
}

// After (fixed)
if (onSuccess) {
	onSuccess(data);
}
```

**Prevention:**

- Ensure API success callbacks are always executed for successful responses
- Test authentication flow end-to-end including UI state updates
- Monitor that `invalidateAll()` is properly refreshing page data

### Problem: Permission Errors

**Symptoms:**

- "Access denied" errors
- Users can access unauthorized content
- Admin features not working

**Solutions:**

1. **Check User Permissions:**

```sql
-- In database studio or SQLite CLI
SELECT id, username, is_admin FROM user WHERE username = 'your_username';
```

2. **Reset User Permissions:**

```sql
-- Make user admin (be careful!)
UPDATE user SET is_admin = 1 WHERE username = 'admin_user';
```

## Game Functionality Issues

### Problem: Bets Not Processing

**Symptoms:**

- "Failed to place bet" errors
- Balance not updating
- Game results not appearing

**Diagnosis:**

```bash
# Check game API endpoints
curl -X POST http://localhost:5173/api/game/dice \
  -H "Content-Type: application/json" \
  -d '{"amount": 10, "betType": "over", "target": 50}'

# Check bet history
sqlite3 local.db "SELECT * FROM bet ORDER BY created_at DESC LIMIT 5;"

# Check user balance
sqlite3 local.db "SELECT username, balance FROM user;"
```

**Solutions:**

1. **Balance Issues:**

```sql
-- Check user balance
SELECT username, balance FROM user WHERE id = 'user_id';

-- Add balance for testing (development only!)
UPDATE user SET balance = 1000 WHERE username = 'test_user';
```

2. **Game Logic Issues:**

```bash
# Check provably fair implementation
node -e "
const { generateGameResult } = require('./src/lib/server/provably-fair.ts');
console.log(generateGameResult('test_server', 'test_client', 1));
"
```

### Problem: Provably Fair Verification

**Symptoms:**

- Verification fails
- Hash mismatches
- Incorrect game results

**Solutions:**

1. **Verify Implementation:**

```javascript
// Test provably fair function
import { generateGameResult, verifyGameResult } from '$lib/server/provably-fair';

const serverSeed = 'test_server_seed';
const clientSeed = 'test_client_seed';
const nonce = 1;

const result = generateGameResult(serverSeed, clientSeed, nonce);
const verified = verifyGameResult(serverSeed, clientSeed, nonce, result);

console.log('Result:', result, 'Verified:', verified);
```

2. **Check Bet Verification:**

```sql
-- Get bet details for verification
SELECT
  server_seed,
  client_seed,
  nonce,
  result
FROM bet
WHERE id = 'bet_id';
```

## CSRF Protection Issues

### Problem: CSRF Token Validation Failed

**Symptoms:**

- "CSRF token validation failed" errors
- Forms not submitting
- API calls failing
- Game bets failing with CSRF errors

**Diagnosis:**

```bash
# Check CSRF token endpoint
curl http://localhost:5173/api/csrf

# Check browser headers
# In DevTools > Network > Headers

# Check if API functions are using apiCall
grep -r "apiCall" src/lib/api.ts
```

**Root Cause:**

This issue occurs when API functions don't include CSRF tokens in their requests. The game API functions were using direct `fetch` calls instead of the `apiCall` utility that automatically handles CSRF tokens.

**Solutions:**

1. **Use apiCall Utility:**

```typescript
// ❌ Wrong - direct fetch without CSRF
const response = await fetch('/api/game/flip', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify(request)
});

// ✅ Correct - using apiCall with automatic CSRF
return apiCall<CoinFlipBetResult>('/api/game/flip', {
	method: 'POST',
	body: JSON.stringify(request)
});
```

2. **Manual CSRF Token:**

```javascript
// Get CSRF token manually if needed
const csrfResponse = await fetch('/api/csrf');
const { token } = await csrfResponse.json();

// Include in request headers
fetch('/api/game/flip', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'X-CSRF-Token': token
	},
	body: JSON.stringify(request)
});
```

**Prevention:**

- Always use `apiCall` utility for state-changing API requests
- The `apiCall` function automatically fetches and includes CSRF tokens
- Test API endpoints with proper CSRF token handling

## Rate Limiting Issues

### Problem: Rate Limit Exceeded

**Symptoms:**

- 429 "Too Many Requests" errors
- Legitimate requests being blocked
- Inconsistent rate limiting

**Diagnosis:**

```bash
# Check rate limit headers
curl -I http://localhost:5173/api/auth

# Look for:
# X-RateLimit-Limit: 5
# X-RateLimit-Remaining: 3
# X-RateLimit-Reset: 1640995200
```

**Solutions:**

1. **Adjust Rate Limits:**

```typescript
// In rate-limiter.ts, temporarily increase limits for testing
export const RATE_LIMITS = {
	auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // Increased from 5
	betting: { windowMs: 60 * 1000, maxRequests: 20 }, // Increased from 10
	api: { windowMs: 60 * 1000, maxRequests: 200 } // Increased from 100
};
```

2. **Clear Rate Limit Cache:**

```bash
# Restart server to clear in-memory rate limits
# Or implement cache clearing endpoint for development
```

## Performance Issues

### Problem: Slow Response Times

**Symptoms:**

- Long page load times
- API timeouts
- Database query slowness

**Diagnosis:**

```bash
# Check response times
time curl http://localhost:5173/

# Monitor database queries
sqlite3 local.db ".timer ON" "SELECT COUNT(*) FROM bet;"

# Check bundle size
bun run build
ls -lh build/client/_app/immutable/chunks/
```

**Solutions:**

1. **Database Optimization:**

```sql
-- Add indexes if missing
CREATE INDEX IF NOT EXISTS idx_bet_user_id ON bet(user_id);
CREATE INDEX IF NOT EXISTS idx_bet_created_at ON bet(created_at);
CREATE INDEX IF NOT EXISTS idx_session_expires ON session(expires_at);

-- Analyze query performance
EXPLAIN QUERY PLAN SELECT * FROM bet WHERE user_id = 'user123';
```

2. **Frontend Optimization:**

```bash
# Analyze bundle size
bunx vite-bundle-analyzer

# Check for large dependencies
bunx npm-check-updates
```

### Problem: Memory Leaks

**Symptoms:**

- Increasing memory usage over time
- Server crashes after extended use
- Slow garbage collection

**Solutions:**

1. **Monitor Memory Usage:**

```bash
# Monitor Node.js memory
node --expose-gc --inspect server.js

# Check for memory leaks
process.memoryUsage()
```

2. **Clean Up Resources:**

```typescript
// Check for unclosed database connections
// Verify event listeners are removed
// Clear timeouts and intervals
```

## Development Issues

### Problem: Hot Reload Not Working

**Symptoms:**

- Changes not reflected in browser
- Need to manually refresh
- Build cache issues

**Solutions:**

1. **Clear Caches:**

```bash
# Clear SvelteKit cache
rm -rf .svelte-kit

# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
bun run dev
```

2. **Check File Watchers:**

```bash
# On Linux, increase file watcher limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Problem: TypeScript Import Errors

**Symptoms:**

- Cannot find module errors
- Path alias not working
- Type import failures

**Solutions:**

1. **Check Path Configuration:**

```json
// In tsconfig.json
{
	"compilerOptions": {
		"paths": {
			"$lib": ["src/lib"],
			"$lib/*": ["src/lib/*"]
		}
	}
}
```

2. **Verify File Extensions:**

```typescript
// Use explicit extensions for imports
import { something } from './file.js'; // Not .ts
```

## Production Issues

### Problem: Environment Configuration

**Symptoms:**

- Features working in development but not production
- Environment variable issues
- Security features not enabled

**Solutions:**

1. **Verify Production Environment:**

```bash
# Check environment variables
echo $NODE_ENV
echo $DATABASE_URL

# Verify production build
NODE_ENV=production bun run build
NODE_ENV=production bun run preview
```

2. **Security Configuration:**

```bash
# Ensure security features are enabled
grep -E "(ENABLE_RATE_LIMITING|SESSION_SECRET)" .env
```

## Debugging Tools

### Database Debugging

```bash
# Open Drizzle Studio
bun run db:studio

# SQLite CLI commands
sqlite3 local.db
.tables
.schema user
.headers on
.mode column
SELECT * FROM user LIMIT 5;
```

### Network Debugging

```bash
# Test API endpoints
curl -v http://localhost:5173/api/health

# Check with authentication
curl -v -H "Cookie: auth-session=your_token" \
  http://localhost:5173/api/game/history
```

### Browser Debugging

```javascript
// In browser console
// Check local storage
localStorage;

// Check session storage
sessionStorage;

// Check cookies
document.cookie;

// Monitor API calls
// Open DevTools > Network tab
```

## Logging and Monitoring

### Enable Debug Logging

```bash
# Development debugging
DEBUG=* bun run dev

# Specific module debugging
DEBUG=auth,game bun run dev
```

### Log Analysis

```bash
# Check application logs
tail -f logs/app.log

# Filter for errors
grep ERROR logs/app.log

# Monitor authentication events
grep "auth" logs/app.log | tail -20
```

### Health Monitoring

```bash
# Basic health check
curl http://localhost:5173/health

# Detailed system status
curl http://localhost:5173/health/detailed

# Database connectivity
curl http://localhost:5173/health/database
```

## Emergency Procedures

### System Recovery

1. **Service Down:**

```bash
# Quick restart
pm2 restart mahidol888

# Or manual restart
pkill -f node
bun run build
bun run preview
```

2. **Database Corruption:**

```bash
# Backup current database
cp local.db local.db.backup

# Check integrity
sqlite3 local.db "PRAGMA integrity_check;"

# Restore from backup if needed
cp backup/production.db local.db
```

3. **Security Incident:**

```bash
# Revoke all sessions
sqlite3 local.db "DELETE FROM session;"

# Disable affected user accounts
sqlite3 local.db "UPDATE user SET password_hash = 'DISABLED' WHERE username = 'compromised_user';"
```

## Getting Help

### Before Asking for Help

1. **Gather Information:**
   - Error messages (full stack trace)
   - Steps to reproduce
   - Environment details
   - Recent changes

2. **Check Documentation:**
   - Review relevant documentation
   - Search existing issues
   - Check troubleshooting guides

3. **Provide Context:**
   - What were you trying to do?
   - What did you expect to happen?
   - What actually happened?
   - What debugging steps have you tried?

### Support Channels

- **Documentation**: Check `/docs` folder first
- **Code Comments**: Review inline documentation
- **Git History**: Check recent commits for context
- **Team Chat**: Ask specific questions with context

### Emergency Contacts

- **Critical Issues**: Follow incident response procedure
- **Security Issues**: Use responsible disclosure process
- **System Down**: Check monitoring alerts first

Remember: Most issues have been encountered before. Check logs, review documentation, and follow the systematic debugging approach outlined in this guide.
