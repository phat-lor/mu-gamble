# Development Setup Guide

This guide will help you set up your development environment for the Mahidol888 project.

## Prerequisites

### Required Software

- **Node.js** 18+ or **Bun** (recommended for faster performance)
- **Git** for version control
- **VS Code** (recommended) with Svelte extension
- **SQLite** (included with Node.js/Bun)

### Recommended VS Code Extensions

```json
{
	"recommendations": [
		"svelte.svelte-vscode",
		"bradlc.vscode-tailwindcss",
		"ms-vscode.vscode-typescript-next",
		"esbenp.prettier-vscode",
		"ms-vscode.vscode-eslint",
		"formulahendry.auto-rename-tag",
		"christian-kohler.path-intellisense"
	]
}
```

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/mahidol888.git
cd mahidol888
```

### 2. Install Dependencies

Using Bun (recommended):

```bash
bun install
```

Using npm:

```bash
npm install
```

### 3. Environment Configuration

Create your environment file:

```bash
cp .env.example .env
```

Edit `.env` with your local settings:

```env
# Database Configuration
DATABASE_URL="./local.db"

# Security Configuration (Use random strings in production)
SESSION_SECRET="your-dev-session-secret-here"
CSRF_SECRET="your-dev-csrf-secret-here"

# Development Settings
NODE_ENV=development
ENABLE_RATE_LIMITING=false
MAX_LOGIN_ATTEMPTS=10
MAX_BET_ATTEMPTS=50

# Local Development
PUBLIC_SITE_URL=http://localhost:5173
ADMIN_EMAIL=dev@localhost
```

### 4. Database Setup

Generate and apply database migrations:

```bash
# Generate migration files
bun run db:generate

# Apply migrations to create tables
bun run db:push

# Optional: Open database studio to view data
bun run db:studio
```

### 5. Start Development Server

```bash
bun run dev
```

The application will be available at `http://localhost:5173`

## Development Tools

### Available Scripts

| Command               | Description                  |
| --------------------- | ---------------------------- |
| `bun run dev`         | Start development server     |
| `bun run build`       | Build for production         |
| `bun run preview`     | Preview production build     |
| `bun run check`       | Run TypeScript checks        |
| `bun run lint`        | Run ESLint                   |
| `bun run format`      | Format code with Prettier    |
| `bun run db:generate` | Generate database migrations |
| `bun run db:push`     | Apply database changes       |
| `bun run db:studio`   | Open database studio         |

### Code Quality Tools

#### TypeScript

```bash
# Check types
bun run check

# Watch mode for continuous checking
bun run check:watch
```

#### Linting and Formatting

```bash
# Check code style
bun run lint

# Auto-fix linting issues
bunx eslint . --fix

# Format code
bun run format
```

### Database Management

#### Viewing Data

```bash
# Open Drizzle Studio (recommended)
bun run db:studio

# Or use SQLite CLI
sqlite3 local.db
```

#### Schema Changes

```bash
# 1. Modify schema in src/lib/server/db/schema.ts
# 2. Generate migration
bun run db:generate

# 3. Review migration in drizzle/ folder
# 4. Apply migration
bun run db:push
```

## Development Workflow

### 1. Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes and test
bun run dev

# 3. Run quality checks
bun run check
bun run lint
bun run format

# 4. Commit changes
git add .
git commit -m "feat: add your feature description"

# 5. Push and create PR
git push origin feature/your-feature-name
```

### 2. Testing Your Changes

```bash
# Check TypeScript compilation
bun run check

# Verify linting passes
bun run lint

# Test production build
bun run build
bun run preview
```

### 3. Database Testing

Create test data:

```sql
-- Open database studio or SQLite CLI
INSERT INTO user (id, username, password_hash, balance)
VALUES ('test123', 'testuser', '$argon2id$v=19$m=19456,t=2,p=1$...', 1000.0);
```

## Environment-Specific Configuration

### Development Environment

```env
NODE_ENV=development
ENABLE_RATE_LIMITING=false
DATABASE_URL="./local.db"
PUBLIC_SITE_URL=http://localhost:5173
```

**Features in Development:**

- Rate limiting disabled for easier testing
- Detailed error messages
- Hot reloading
- Database studio access

### Production Environment

```env
NODE_ENV=production
ENABLE_RATE_LIMITING=true
DATABASE_URL="./production.db"
SESSION_SECRET="your-secure-random-string"
CSRF_SECRET="your-secure-random-string"
PUBLIC_SITE_URL=https://yourdomain.com
```

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port 5173
lsof -ti:5173

# Kill the process
kill -9 $(lsof -ti:5173)

# Or use different port
bun run dev -- --port 3000
```

#### Database Issues

```bash
# Reset database
rm local.db
bun run db:push

# Check database file permissions
ls -la local.db
```

#### TypeScript Errors

```bash
# Clear TypeScript cache
rm -rf .svelte-kit
bun run check
```

#### Dependency Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm bun.lockb  # or package-lock.json
bun install
```

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
	"svelte.enable-ts-plugin": true,
	"files.associations": {
		"*.svelte": "svelte"
	}
}
```

## Security Considerations

### Development Security

- Never commit `.env` files
- Use weak secrets for local development
- Rate limiting disabled for easier testing
- Debug logging enabled

### Local Testing

Test security features:

```bash
# Test with rate limiting enabled
ENABLE_RATE_LIMITING=true bun run dev

# Test production build
NODE_ENV=production bun run build
bun run preview
```

## Performance Tips

### Faster Development

1. **Use Bun instead of npm** for faster package management
2. **Enable TypeScript incremental compilation**
3. **Use SvelteKit's hot reloading** effectively
4. **Minimize database operations** during development

### Memory Usage

```bash
# Check memory usage
node --max-old-space-size=4096 bun run dev

# Monitor performance
bun run dev --profile
```

## Next Steps

After setup, check out:

- [Coding Standards](../development/coding-standards.md)
- [Project Overview](./project-overview.md)
- [First Contribution](./first-contribution.md)

## Getting Help

- **Setup Issues**: Check this guide's troubleshooting section
- **Code Questions**: Review [Coding Standards](../development/coding-standards.md)
- **Security Questions**: See [Security Guidelines](../development/security-guidelines.md)

Happy coding! 🚀
