# Making Your First Contribution

Welcome! This guide will walk you through making your first contribution to the Mahidol888 project. We'll start with a simple, safe change to help you understand our workflow.

## Prerequisites

Before starting, make sure you have:

- ✅ Completed [Development Setup](./development-setup.md)
- ✅ Read [Project Overview](./project-overview.md)
- ✅ Reviewed [Coding Standards](../development/coding-standards.md)
- ✅ Understanding of [Security Guidelines](../development/security-guidelines.md)

## Your First Contribution: Add a New Game Mode

We'll implement a simple "Auto Play" toggle for the dice game as your first contribution. This is a perfect starter task because it:

- Involves frontend and backend components
- Follows established patterns
- Has minimal security implications
- Provides visible results

## Step 1: Understanding the Current Code

### Examine the Dice Game Structure

```bash
# Look at the dice game implementation
code src/routes/(require-auth)/game/dice/+page.svelte
```

Find these key components:

- State management for game mode
- UI components for controls
- API integration for placing bets

### Study the Component Architecture

```bash
# Examine the game components
ls src/lib/components/game/
code src/lib/components/game/GameModeToggle.svelte
```

## Step 2: Plan Your Changes

### What We'll Implement

1. **Backend**: Add auto-play validation to the dice game endpoint
2. **Frontend**: Enhance the auto-play functionality with stop conditions
3. **Types**: Add new interfaces for auto-play parameters
4. **Testing**: Add validation tests

### Files We'll Modify

- `src/lib/types/game.ts` - Add auto-play types
- `src/lib/components/game/GameModeToggle.svelte` - Enhanced toggle
- `src/routes/(require-auth)/game/dice/+page.svelte` - Auto-play logic
- `src/routes/api/game/dice/+server.ts` - Backend validation

## Step 3: Create Your Feature Branch

```bash
# Make sure you're on main and up to date
git checkout main
git pull origin main

# Create your feature branch
git checkout -b feature/enhance-dice-autoplay

# Verify you're on the right branch
git branch
```

## Step 4: Implement the Changes

### 4.1 Add Type Definitions

Create enhanced types in `src/lib/types/game.ts`:

```typescript
// Add to existing game.ts file
export interface AutoPlayConfig {
	enabled: boolean;
	stopOnWin?: boolean;
	stopOnLoss?: boolean;
	stopAfterBets?: number;
	stopOnBalance?: number;
}

export interface DiceGameState {
	mode: GameMode;
	autoPlay: AutoPlayConfig;
	isPlaying: boolean;
	currentBet: number;
}
```

### 4.2 Update the Game Mode Toggle

Enhance `src/lib/components/game/GameModeToggle.svelte`:

```svelte
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Input } from '$lib/components/ui/input';
	import type { GameMode, AutoPlayConfig } from '$lib/types/game';

	interface Props {
		gameMode: GameMode;
		autoPlayConfig: AutoPlayConfig;
		onModeChange: (mode: GameMode) => void;
		onAutoPlayConfigChange: (config: AutoPlayConfig) => void;
	}

	let { gameMode, autoPlayConfig, onModeChange, onAutoPlayConfigChange }: Props = $props();

	function handleModeChange(mode: GameMode) {
		onModeChange(mode);
	}

	function updateAutoPlayConfig(updates: Partial<AutoPlayConfig>) {
		const newConfig = { ...autoPlayConfig, ...updates };
		onAutoPlayConfigChange(newConfig);
	}
</script>

<div class="space-y-4">
	<!-- Game Mode Toggle -->
	<div class="flex space-x-2">
		<Button
			variant={gameMode === 'manual' ? 'default' : 'outline'}
			size="sm"
			onclick={() => handleModeChange('manual')}
		>
			Manual
		</Button>
		<Button
			variant={gameMode === 'auto' ? 'default' : 'outline'}
			size="sm"
			onclick={() => handleModeChange('auto')}
		>
			Auto
		</Button>
	</div>

	<!-- Auto Play Configuration -->
	{#if gameMode === 'auto'}
		<div class="space-y-3 rounded-lg border p-3">
			<h4 class="text-sm font-medium">Auto Play Settings</h4>

			<!-- Stop Conditions -->
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label for="stop-on-win" class="text-sm">Stop on Win</Label>
					<Switch
						id="stop-on-win"
						checked={autoPlayConfig.stopOnWin}
						onCheckedChange={(checked) => updateAutoPlayConfig({ stopOnWin: checked })}
					/>
				</div>

				<div class="flex items-center justify-between">
					<Label for="stop-on-loss" class="text-sm">Stop on Loss</Label>
					<Switch
						id="stop-on-loss"
						checked={autoPlayConfig.stopOnLoss}
						onCheckedChange={(checked) => updateAutoPlayConfig({ stopOnLoss: checked })}
					/>
				</div>
			</div>

			<!-- Stop After X Bets -->
			<div class="space-y-1">
				<Label for="stop-after-bets" class="text-sm">Stop after bets (optional)</Label>
				<Input
					id="stop-after-bets"
					type="number"
					min="1"
					max="1000"
					value={autoPlayConfig.stopAfterBets || ''}
					oninput={(e) => {
						const value = parseInt(e.currentTarget.value) || undefined;
						updateAutoPlayConfig({ stopAfterBets: value });
					}}
					placeholder="Enter number of bets"
					class="h-8"
				/>
			</div>
		</div>
	{/if}
</div>
```

### 4.3 Enhance the Dice Game Page

Update `src/routes/(require-auth)/game/dice/+page.svelte`:

```typescript
// Add to the existing script section
import type { AutoPlayConfig, DiceGameState } from '$lib/types/game';

// Replace the existing gameMode state with enhanced state
let gameState = $state<DiceGameState>({
	mode: 'manual',
	autoPlay: {
		enabled: false,
		stopOnWin: false,
		stopOnLoss: false,
		stopAfterBets: undefined,
		stopOnBalance: undefined
	},
	isPlaying: false,
	currentBet: 0
});

// Auto-play logic
let autoPlayBetsCount = $state(0);

function handleModeChange(mode: GameMode) {
	gameState.mode = mode;
	if (mode === 'manual' && gameState.isPlaying) {
		stopAutoPlay();
	}
}

function handleAutoPlayConfigChange(config: AutoPlayConfig) {
	gameState.autoPlay = config;
}

function startAutoPlay() {
	if (gameState.mode !== 'auto' || gameState.isPlaying) return;

	gameState.isPlaying = true;
	autoPlayBetsCount = 0;
	playNextAutoBet();
}

function stopAutoPlay() {
	gameState.isPlaying = false;
}

async function playNextAutoBet() {
	if (!gameState.isPlaying || gameState.mode !== 'auto') return;

	// Check stop conditions
	if (shouldStopAutoPlay()) {
		stopAutoPlay();
		return;
	}

	try {
		const result = await handleBet();
		autoPlayBetsCount++;

		// Check post-bet stop conditions
		if (result && shouldStopAutoPlay(result.win)) {
			stopAutoPlay();
			return;
		}

		// Continue with next bet after a delay
		if (gameState.isPlaying) {
			setTimeout(() => playNextAutoBet(), 1000);
		}
	} catch (error) {
		console.error('Auto-play error:', error);
		stopAutoPlay();
	}
}

function shouldStopAutoPlay(lastBetWin?: boolean): boolean {
	const { autoPlay } = gameState;

	// Stop if max bets reached
	if (autoPlay.stopAfterBets && autoPlayBetsCount >= autoPlay.stopAfterBets) {
		return true;
	}

	// Stop on win/loss conditions
	if (lastBetWin !== undefined) {
		if (autoPlay.stopOnWin && lastBetWin) return true;
		if (autoPlay.stopOnLoss && !lastBetWin) return true;
	}

	// Stop if balance too low
	if (autoPlay.stopOnBalance && userBalance <= autoPlay.stopOnBalance) {
		return true;
	}

	return false;
}
```

### 4.4 Add Backend Validation

Update `src/routes/api/game/dice/+server.ts` to handle auto-play validation:

```typescript
// Add to the existing DiceBetRequest interface
interface DiceBetRequest extends GameBetRequest {
	betType: 'over' | 'under';
	target: number;
	isAutoPlay?: boolean; // New field
}

// Update validation function
const diceGameLogic: GameLogic<DiceBetRequest, DiceBetResult> = {
	gameType: 'dice',
	validateBet: (request, userBalance) => {
		// Existing validation
		const basicValidation = validateDiceBet(
			request.amount,
			request.betType,
			request.target,
			userBalance
		);
		if (!basicValidation.valid) {
			return basicValidation;
		}

		// Auto-play specific validation
		if (request.isAutoPlay) {
			// Limit auto-play bet amounts for safety
			if (request.amount > userBalance * 0.1) {
				return { valid: false, error: 'Auto-play bet amount too high (max 10% of balance)' };
			}
		}

		return { valid: true };
	},
	calculateResult: (serverSeed, clientSeed, nonce, request) => {
		// Existing logic remains the same
		const roll = generateDiceRoll(serverSeed, clientSeed, nonce);
		const win = isDiceWin(roll, request.betType, request.target);
		const winChance = calculateDiceWinChance(request.betType, request.target);
		const multiplier = calculateMultiplier(winChance);
		const payout = win ? request.amount * multiplier : 0;

		return {
			win,
			payout,
			multiplier,
			result: roll,
			roll: Math.round(roll * 100) / 100,
			gameData: {
				betType: request.betType,
				target: request.target,
				winChance,
				isAutoPlay: request.isAutoPlay || false
			}
		};
	}
};
```

## Step 5: Test Your Changes

### 5.1 Manual Testing

```bash
# Start the development server
bun run dev

# Test your changes:
# 1. Navigate to the dice game
# 2. Switch to auto mode
# 3. Configure auto-play settings
# 4. Test start/stop functionality
```

### 5.2 Code Quality Checks

```bash
# Check TypeScript compilation
bun run check

# Run linting
bun run lint

# Format code
bun run format
```

### 5.3 Test Edge Cases

1. **Large bet amounts** - Should be limited in auto-play
2. **Balance depletion** - Auto-play should stop when balance is insufficient
3. **Network errors** - Auto-play should handle API failures gracefully
4. **Mode switching** - Switching from auto to manual should stop auto-play

## Step 6: Document Your Changes

### 6.1 Update Component Documentation

Add comments to your new component:

```typescript
/**
 * Enhanced GameModeToggle with auto-play configuration
 *
 * Features:
 * - Manual/Auto mode switching
 * - Stop conditions (win/loss/bet count/balance)
 * - Input validation for auto-play parameters
 *
 * @param gameMode - Current game mode
 * @param autoPlayConfig - Auto-play configuration
 * @param onModeChange - Callback when mode changes
 * @param onAutoPlayConfigChange - Callback when auto-play config changes
 */
```

### 6.2 Update CHANGELOG

Add an entry about your changes:

```markdown
## [Unreleased]

### Added

- Enhanced auto-play functionality for dice game
- Auto-play stop conditions (win/loss/bet count)
- Backend validation for auto-play bets
- Improved user safety with bet amount limits
```

## Step 7: Commit Your Changes

### 7.1 Review Your Changes

```bash
# See what files you've changed
git status

# Review your changes
git diff
```

### 7.2 Stage and Commit

```bash
# Stage your changes
git add .

# Commit with a descriptive message
git commit -m "feat: enhance dice game auto-play functionality

- Add auto-play configuration options (stop on win/loss/bet count)
- Implement backend validation for auto-play bets
- Add safety limits for auto-play bet amounts
- Improve user experience with configurable stop conditions

Fixes #123" # If there was an issue number
```

### 7.3 Push Your Branch

```bash
# Push your feature branch
git push origin feature/enhance-dice-autoplay
```

## Step 8: Create a Pull Request

### 8.1 Pull Request Description

When creating your PR, use this template:

```markdown
## What This PR Does

Enhances the dice game auto-play functionality with configurable stop conditions and improved safety measures.

## Changes Made

- **Frontend**: Enhanced GameModeToggle with auto-play configuration options
- **Backend**: Added validation for auto-play bets with safety limits
- **Types**: Added AutoPlayConfig and DiceGameState interfaces
- **UX**: Added stop conditions for win/loss/bet count/balance

## Testing

- [x] Manual testing of all auto-play configurations
- [x] Edge case testing (balance depletion, network errors)
- [x] TypeScript compilation passes
- [x] Linting passes
- [x] Code follows established patterns

## Security Considerations

- Auto-play bets are limited to 10% of user balance for safety
- All inputs are validated on both client and server
- Auto-play stops on errors to prevent unexpected behavior
- Rate limiting still applies to auto-play bets

## Screenshots

[Add screenshots of the new auto-play interface]

## Breaking Changes

None - this is a backward-compatible enhancement.
```

### 8.2 Request Review

Tag appropriate reviewers and request feedback on:

- Code quality and patterns
- Security implications
- User experience
- Performance impact

## Step 9: Address Review Feedback

### 9.1 Common Review Comments

Be prepared to address feedback like:

- **Code Style**: Follow existing patterns more closely
- **Security**: Add additional validation or safety measures
- **Performance**: Optimize expensive operations
- **UX**: Improve user experience or error handling

### 9.2 Making Changes

```bash
# Make requested changes
# Edit files as needed

# Stage and commit changes
git add .
git commit -m "fix: address PR review feedback

- Add additional input validation
- Improve error handling
- Update component documentation"

# Push updates
git push origin feature/enhance-dice-autoplay
```

## Step 10: After Merge

### 10.1 Clean Up

```bash
# Switch back to main
git checkout main

# Pull the latest changes
git pull origin main

# Delete your feature branch
git branch -d feature/enhance-dice-autoplay
git push origin --delete feature/enhance-dice-autoplay
```

### 10.2 Monitor Production

After your changes are deployed:

- Monitor for any error logs related to your changes
- Watch user feedback and usage patterns
- Be ready to address any issues quickly

## Best Practices for Future Contributions

### 1. Start Small

- Begin with bug fixes or small enhancements
- Gradually work on larger features as you become more familiar

### 2. Security Focus

- Always consider security implications
- Test edge cases and error conditions
- Follow the principle of least privilege

### 3. Code Quality

- Write tests for your changes when possible
- Follow existing code patterns
- Document complex logic

### 4. Communication

- Ask questions when unsure
- Provide clear PR descriptions
- Respond promptly to review feedback

## Getting Help

### If You Get Stuck

1. **Check Documentation**: Review relevant docs in the `/docs` folder
2. **Look at Similar Code**: Find existing implementations to use as examples
3. **Ask Questions**: Reach out to the team for guidance
4. **Start Smaller**: Break down complex changes into smaller steps

### Common Issues and Solutions

**TypeScript Errors**:

```bash
# Clear cache and recheck
rm -rf .svelte-kit
bun run check
```

**Build Failures**:

```bash
# Test production build
bun run build
bun run preview
```

**Database Issues**:

```bash
# Reset database if needed
rm local.db
bun run db:push
```

## Next Steps

After completing your first contribution:

1. **Explore More Features**: Look for other areas to contribute
2. **Improve Testing**: Add unit tests for your components
3. **Performance Optimization**: Profile and optimize your changes
4. **Documentation**: Help improve project documentation
5. **Mentoring**: Help other new contributors

Congratulations on your first contribution! 🎉

The Mahidol888 team appreciates your work in making the platform better and more secure.
