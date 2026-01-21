# Cultist - Social Deduction Game Specification

## Overview
Cultist is a real-time multiplayer social deduction game inspired by Mafia/Werewolf. Players are secretly assigned roles and must work to achieve their team's victory.

## Game Modes

### Host Mode (Desktop)
- Control panel for game management
- View all players and their connection status
- Toggle visibility of player roles
- Manual phase progression controls
- Start game (requires ≥3 players) with optional AI narration
- Restart game (new roles, same players)
- Reset players (clear all, return to lobby)
- Toggle presenter QR code visibility

## AI Narration System

### Overview
Hosts can enable AI-generated narration to read aloud during the game. This creates an immersive storytelling experience with dramatic, role-play ready text for each phase.

### Configuration (Before Game Start)
When the host clicks "Start Game", a modal appears with:
- **Enable AI Narration** toggle
- **Village Name** - Custom name for the setting (e.g., "Ravenholm")
- **Cult Name** - Name of the cult (e.g., "The Crimson Order")
- **Tone** - Three options: Dark / Humorous / Neutral
- **Language** - Any language (default: English)

### Narration Generation
- Generated per phase (night-1, day-1, night-2, etc.)
- Includes actual game events:
  - Sacrifice victims and their roles
  - Execution results (success, tie, Village Idiot reveal)
  - Hunter's revenge kills
  - Game over winner announcement
- Written for dramatic oral delivery with pauses and atmosphere

### Host Experience
- "Narration" button appears in header when narration is enabled
- Opens drawer with current phase's script
- Can regenerate narration once per phase
- Script updates automatically when phase changes

### Persistence
- Settings stored in global store
- Narration persists across page refreshes
- Cleared on game restart

### Player Mode (Mobile-first)
- Join via QR code or link
- Name entry and profile creation
- Role reveal screen (shown once at start)
- Night/Day phase participation
- Vote submission and validation
- Game over results

### Presenter Mode (Large Screen)
- Display QR code for player joining
- Show player count and connection status
- Spectator view of game state

## Roles

### Cultist
- **Goal**: Eliminate all non-cultists
- **Night Action**: Vote to sacrifice a villager
- **Special**: Knows other cultists
- **Distribution**: 1 (3-7 players), 2 (8-14 players), 3 (15+ players)

### Simple Villager
- **Goal**: Eliminate all cultists
- **Day Action**: Vote to execute suspects
- **Special**: None
- **Distribution**: All remaining players minus 1 idiot

### Village Idiot
- **Goal**: Survive (aligned with villagers)
- **Night**: Can be sacrificed (dies normally)
- **Day**: Cannot be executed (survives, role revealed)
- **Distribution**: Always 1 per game

## Game Flow

### 1. Lobby Phase
- Players join by scanning QR or clicking link
- Enter name to create profile
- Host sees player count
- Host starts when ≥3 players joined

### 2. Role Assignment
- Randomly distribute roles based on player count
- Each player sees role reveal screen once
- "Continue" button advances to night phase

### 3. Night Phase

**Cultists:**
- See list of alive non-cultist players
- Vote to sacrifice one player
- Can change vote before host validates
- See vote confirmation with target name
- Warning shown if cultists disagree

**Villagers/Idiot:**
- See "Night Falls" message
- Cannot vote or take actions
- Wait for day phase

**Host Actions:**
- See cultist votes in real-time
- "Cultists have decided" indicator when consensus reached
- "Validate Votes" button locks votes
- "Start Day Phase" button processes sacrifice and transitions

**Processing:**
- Target with most cultist votes is sacrificed
- Check win conditions
- Transition to day phase

### 4. Day Phase

**All Living Players:**
- See last night's sacrifice result (victim name and role)
- See list of alive players
- Vote to execute one suspect
- Submit vote (can change before validating)
- "Validate Vote" locks individual vote

**Dead Players:**
- See "You were sacrificed" message
- Cannot vote or interact

**Host Actions:**
- "Validate All Votes" locks all votes
- "Start Night Phase" processes execution and transitions

**Processing:**
- Count validated votes
- If tie: Nobody executed
- If Village Idiot targeted: Survives, role revealed
- Otherwise: Target dies
- Check win conditions
- Increment round number
- Transition to night phase

### 5. Game Over

**Win Conditions:**
- **Cultists Win**: All non-cultists eliminated
- **Villagers Win**: All cultists eliminated

**Manual End:**
- Host can end the game at any time; no winner is shown
- Players see that the host ended the game

**Display:**
- Winner announcement when applicable
- Neutral "game finished" state when ended by host or no winner
- List of all cultist identities
- Restart option (new roles, same players)
- Reset option (clear all, return to lobby)

## Technical Implementation

### State Management

**Global Store (Shared):**
```typescript
{
  started: boolean
  gamePhase: 'lobby' | 'night' | 'day' | 'game-over'
  roundNumber: number
  players: Record<clientId, { name, role?, isAlive }>
  nightVotes: Record<cultistId, targetId>
  nightVotesValidated: boolean
  lastSacrificeTargetId: string | null
  lastSacrificeSuccess: boolean
  dayVotes: { voterId, targetId, validated }[]
  lastExecutedId: string | null
  lastExecutionAttemptedId: string | 'tie' | null
  idiotRevealed: boolean
  endedByHost: boolean
  winner: 'cultists' | 'villagers' | null
  narrationSettings: {
    villageName: string
    cultName: string
    tone: 'dark' | 'humorous' | 'neutral'
    language: string
    enabled: boolean
  }
  phaseNarrations: Record<string, { text: string, regenerated: boolean, isGenerating: boolean }>
}
```

**Player Store (Local):**
```typescript
{
  name: string
  currentView: 'lobby' | 'role-reveal' | 'night' | 'day' | 'game-over'
  roleSeen: boolean
}
```

### Actions

**Global Actions:**
- `startGame()` - Assign roles, start game
- `restartGame()` - Reassign roles, reset game state
- `resetPlayers()` - Clear all players
- `submitNightVote(targetId)` - Cultist submits vote
- `validateNightVotes()` - Host locks night votes
- `startDayPhase()` - Process sacrifice, transition
- `submitDayVote(targetId)` - Player submits day vote
- `validateDayVote()` - Player locks their vote
- `validateAllDayVotes()` - Host locks all votes
- `startNightPhase()` - Process execution, transition
- `togglePresenterQr()` - Show/hide QR code
- `setNarrationSettings(settings)` - Configure AI narration
- `generatePhaseNarration(phaseKey, isRegeneration)` - Generate/regenerate narration

**Player Actions:**
- `setPlayerName(name)` - Create profile
- `markRoleSeen()` - Track role reveal viewed
- `setCurrentView(view)` - Navigate between views

### Win Condition Checking
- Automatic check after every sacrifice and execution
- Runs in global controller hook
- Immediately transitions to game-over when conditions met

## User Experience

### Role Reveal
- Shown only once at game start (round 1)
- Accessible via info button during gameplay
- Color-coded by role (red=cultist, blue=villager, purple=idiot)

### Vote Feedback
- Cultists see "✓ Vote Recorded" after voting
- Day votes show green confirmation after validation
- Warning if cultists disagree on target

### Dead Player Experience
- "You were sacrificed" message
- Cannot vote or interact
- Can still view game state

### Host Controls
- Manual phase progression
- Vote validation controls
- Real-time vote monitoring
- Consensus indicators

### Configuration
- All user-facing text in YAML config
- Easy customization and localization
- Schema validation via Zod

## Files Modified/Created

### State Management
- `src/state/stores/global-store.ts` - Game state
- `src/state/stores/player-store.ts` - Local state
- `src/state/actions/global-actions.ts` - Game actions
- `src/state/actions/player-actions.ts` - Player actions

### Views
- `src/views/role-reveal-view.tsx` - Role assignment screen
- `src/views/night-phase-view.tsx` - Night voting
- `src/views/day-phase-view.tsx` - Day voting
- `src/views/game-over-view.tsx` - Winner display

### Components
- `src/components/narration-settings-modal.tsx` - AI narration configuration modal
- `src/components/narration-drawer.tsx` - Narration script display drawer

### Modes
- `src/modes/app.host.tsx` - Host dashboard
- `src/modes/app.player.tsx` - Player interface
- `src/modes/app.presenter.tsx` - Presenter screen

### Configuration
- `src/config/schema.ts` - Text schema
- `default.config.yaml` - Translations

### Hooks
- `src/hooks/useGlobalController.ts` - Win condition checking
