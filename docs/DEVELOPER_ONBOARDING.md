# Developer Onboarding Guide

Welcome to the Mahidol888 development team! This guide will help you get up to speed quickly and contribute effectively to our secure gambling platform.

## 🎯 Your First Week Plan

### Day 1: Understanding & Setup

**Goal**: Get familiar with the project and set up your development environment

**Tasks**:

- [ ] Read [Project Overview](./getting-started/project-overview.md)
- [ ] Complete [Development Setup](./getting-started/development-setup.md)
- [ ] Clone repository and get the app running locally
- [ ] Create test user account and explore the platform
- [ ] Review [System Architecture](./architecture/system-architecture.md)

**Success Criteria**: You can run the app locally and understand what it does

### Day 2: Security & Standards

**Goal**: Understand our security-first approach and coding standards

**Tasks**:

- [ ] Study [Security Guidelines](./development/security-guidelines.md) thoroughly
- [ ] Review [Coding Standards](./development/coding-standards.md)
- [ ] Read the main [SECURITY.md](../SECURITY.md) document
- [ ] Set up your IDE with recommended extensions
- [ ] Review recent git commits to understand code patterns

**Success Criteria**: You understand our security requirements and coding style

### Day 3: Deep Dive

**Goal**: Understand the technical implementation details

**Tasks**:

- [ ] Explore the codebase structure (`src/lib/`, `src/routes/`)
- [ ] Read [Database Design](./architecture/database-design.md)
- [ ] Study the provably fair gaming implementation
- [ ] Review API endpoints and their security measures
- [ ] Understand the component architecture
- [ ] Explore the leaderboard system implementation (/leaderboard page and /api/leaderboard endpoint)

**Success Criteria**: You can navigate the codebase confidently

### Day 4-5: First Contribution

**Goal**: Make your first meaningful contribution

**Tasks**:

- [ ] Follow [First Contribution Guide](./getting-started/first-contribution.md)
- [ ] Pick a small enhancement or bug fix
- [ ] Create feature branch and implement changes
- [ ] Test thoroughly and ensure security compliance
- [ ] Submit pull request with proper documentation

**Success Criteria**: Your first PR is merged successfully

## 📚 Essential Documentation

### Must Read (Priority 1)

1. **[Project Overview](./getting-started/project-overview.md)** - Understand what we're building
2. **[Security Guidelines](./development/security-guidelines.md)** - Our most important practices
3. **[Coding Standards](./development/coding-standards.md)** - How we write code
4. **[Development Setup](./getting-started/development-setup.md)** - Get your environment ready

### Important (Priority 2)

5. **[System Architecture](./architecture/system-architecture.md)** - How everything fits together
6. **[First Contribution](./getting-started/first-contribution.md)** - Make your first change
7. **[Troubleshooting](./operations/troubleshooting.md)** - Fix common issues

### Reference (Priority 3)

8. **[Database Design](./architecture/database-design.md)** - Data structure and relationships
9. **[API Documentation](./api/)** - Endpoint specifications
10. **[Deployment Guide](./operations/deployment.md)** - Production deployment

## 🔐 Security Mindset

As a gambling platform handling real money, security is our top priority. Every decision should consider:

### Security Questions to Ask

- **Input Validation**: "Is this input validated on both client and server?"
- **Authentication**: "Can only authorized users access this?"
- **Data Integrity**: "Could this operation be manipulated or cause inconsistency?"
- **Error Handling**: "Does this error message leak sensitive information?"
- **Rate Limiting**: "Could this endpoint be abused?"

### Red Flags to Watch For

- ❌ Using user input without validation
- ❌ Skipping authentication checks
- ❌ Exposing internal error details
- ❌ Missing rate limiting on public endpoints
- ❌ Direct database queries without parameterization

## 🛠️ Development Workflow

### Daily Development Process

1. **Start of Day**:

   ```bash
   git checkout main
   git pull origin main
   bun run check  # Verify everything works
   ```

2. **Feature Development**:

   ```bash
   git checkout -b feature/your-feature-name
   # Make changes following our standards
   bun run check && bun run lint
   git commit -m "feat: descriptive commit message"
   ```

3. **Before Submitting PR**:
   ```bash
   bun run check     # TypeScript compilation
   bun run lint      # Code style
   bun run build     # Production build test
   bun run preview   # Test production build
   ```

### Code Review Process

**When Submitting PRs**:

- Write clear descriptions explaining what and why
- Include screenshots for UI changes
- Test edge cases and error conditions
- Verify security implications
- Update documentation if needed

**When Reviewing PRs**:

- Focus on security and correctness first
- Check for code style consistency
- Verify tests cover important cases
- Ensure documentation is updated

## 🎮 Understanding Our Games

### Provably Fair System

Our games use cryptographic methods to ensure fairness:

```typescript
// Every game result is generated like this:
const result = HMAC_SHA256(serverSeed, clientSeed + nonce);
```

**Key Concepts**:

- **Server Seed**: Random, hashed before game
- **Client Seed**: User-provided randomness
- **Nonce**: Prevents replay attacks
- **Verification**: Players can verify any result

### Game Types

1. **Dice Game**: Roll 0-99.99, bet over/under target
2. **Coin Flip**: Cat vs Dog, 50/50 with house edge

Both games follow the same security and fairness principles.

## 🏗️ Architecture Patterns

### Component Structure

```
components/
├── ui/           # Generic reusable components
├── game/         # Game-specific components
└── self/         # App-specific components
```

### API Pattern

```typescript
// All API routes follow this pattern:
export const POST: RequestHandler = async (event) => {
	// 1. Authentication
	// 2. Rate limiting
	// 3. Input validation
	// 4. Business logic
	// 5. Error handling
};
```

### Database Transactions

```typescript
// Critical operations use transactions:
const result = db.transaction((tx) => {
	// All operations are atomic
	// Either all succeed or all fail
});
```

## 🧪 Testing Strategy

### What to Test

**Security Features**:

- Authentication and authorization
- Input validation edge cases
- Rate limiting behavior
- CSRF protection

**Game Logic**:

- Provably fair calculations
- Balance updates
- Edge cases (insufficient funds, etc.)

**API Endpoints**:

- Happy path functionality
- Error handling
- Security controls

### Testing Commands

```bash
# Type checking
bun run check

# Linting
bun run lint

# Unit tests (when implemented)
bun run test

# Integration testing
bun run build && bun run preview
```

## 🚨 Common Pitfalls

### Security Pitfalls

1. **Client-Side Validation Only**

   ```typescript
   // ❌ Never trust client-side validation alone
   if (clientValidation.valid) {
   	// Process request
   }

   // ✅ Always validate on server
   const serverValidation = validateOnServer(input);
   if (!serverValidation.valid) {
   	return error(400, serverValidation.error);
   }
   ```

2. **Missing Authentication**

   ```typescript
   // ❌ Forgetting authentication checks
   export const POST = async (event) => {
   	const data = await event.request.json();
   	// Process without checking auth
   };

   // ✅ Always check authentication first
   export const POST = async (event) => {
   	const { user } = await validateSession(event);
   	if (!user) return unauthorized();
   	// Continue with authenticated logic
   };
   ```

### Performance Pitfalls

1. **Missing Database Transactions**

   ```typescript
   // ❌ Race condition possible
   const user = await getUser(id);
   await updateBalance(id, user.balance - amount);

   // ✅ Atomic transaction
   db.transaction((tx) => {
   	const user = tx.getUser(id);
   	tx.updateBalance(id, user.balance - amount);
   });
   ```

2. **Inefficient Queries**

   ```sql
   -- ❌ Missing indexes, inefficient
   SELECT * FROM bet WHERE user_id = ? ORDER BY created_at DESC;

   -- ✅ Proper indexing
   CREATE INDEX idx_bet_user_created ON bet(user_id, created_at);
   ```

## 🎓 Learning Resources

### Internal Resources

- **Code Comments**: Most complex logic is well-documented
- **Git History**: See how features were implemented
- **PR Reviews**: Learn from feedback on past changes
- **Team Knowledge**: Ask questions in team chat

### External Resources

- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Security best practices
- [SQLite Documentation](https://www.sqlite.org/docs.html)

## 🤝 Team Culture

### Communication

**Ask Questions**: No question is too basic when it comes to security
**Share Knowledge**: Document solutions you find
**Collaboration**: Code review is learning, not criticism
**Security First**: When in doubt, choose the more secure option

### Best Practices

- **Commit Early and Often**: Small, focused commits
- **Document Decisions**: Explain why, not just what
- **Test Thoroughly**: Especially security-related changes
- **Monitor Production**: Watch for issues after deployment

## 📋 Onboarding Checklist

### Setup (Day 1)

- [ ] Development environment working
- [ ] Can run app locally
- [ ] IDE configured with recommended extensions
- [ ] Access to repository and documentation
- [ ] Test user account created

### Understanding (Day 2-3)

- [ ] Read all priority 1 documentation
- [ ] Understand security requirements
- [ ] Know the coding standards
- [ ] Familiar with project structure
- [ ] Understand our games and provably fair system

### First Contribution (Day 4-5)

- [ ] Identified first task
- [ ] Created feature branch
- [ ] Implemented changes following standards
- [ ] Tested thoroughly
- [ ] Submitted PR with proper documentation
- [ ] Addressed review feedback

### Integration (Week 2+)

- [ ] Comfortable with development workflow
- [ ] Can review others' code effectively
- [ ] Contributing meaningful features
- [ ] Helping other new team members
- [ ] Suggesting improvements to documentation

## 🆘 Getting Help

### When You're Stuck

1. **Check Documentation**: Start with relevant docs
2. **Search Code**: Look for similar implementations
3. **Review Git History**: See how similar problems were solved
4. **Ask Specific Questions**: Include context and what you've tried

### Emergency Situations

- **Security Incident**: Follow [Troubleshooting Guide](./operations/troubleshooting.md)
- **Production Issues**: Check monitoring first, then escalate
- **Build Failures**: Clear cache, check dependencies
- **Database Issues**: Backup first, then investigate

## 🎉 Welcome to the Team!

You're joining a team that builds secure, fair, and innovative gambling experiences. Your fresh perspective and questions will help us improve both our code and our documentation.

### Your Goals

- **Week 1**: Understand the system and make first contribution
- **Month 1**: Comfortable with our patterns and security practices
- **Month 3**: Contributing significant features and mentoring new developers

### Remember

- **Security is everyone's responsibility**
- **No question is too basic when it involves security or user safety**
- **Documentation improvements are always welcome**
- **We're here to help you succeed**

Good luck, and welcome to Mahidol888! 🎰✨

---

**Next Steps**: Start with [Development Setup](./getting-started/development-setup.md) and begin your journey!
