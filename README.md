# Cultist - Social Deduction Game

A real-time multiplayer social deduction game built with Kokimoki SDK. Players are secretly assigned roles and must work to achieve their team's victory through strategic voting and deduction.

## Quick Start

### Prerequisites

- Node.js (v22 or higher)
- npm or yarn

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:5173` to access the host dashboard.

## Game Overview

Cultist is inspired by classic social deduction games like Mafia and Werewolf. The game alternates between night and day phases:

- **Night**: Cultists secretly vote to sacrifice a villager
- **Day**: All players openly vote to execute a suspect

The game continues until one team achieves victory.

## Roles

### Cultist
- **Goal**: Eliminate all non-cultists
- **Ability**: Vote to sacrifice villagers at night
- **Info**: Knows all other cultists

### Simple Villager  
- **Goal**: Eliminate all cultists
- **Ability**: Vote to execute suspects during day
- **Info**: No special knowledge

### Village Idiot
- **Goal**: Survive (helps villagers)
- **Ability**: Cannot be executed during day (but can be sacrificed at night)
- **Info**: No special knowledge

## Role Distribution

- **3-7 players**: 1 cultist, 1 idiot, rest villagers
- **8-14 players**: 2 cultists, 1 idiot, rest villagers
- **15+ players**: 3 cultists, 1 idiot, rest villagers

## How to Play

### Setup (Host)
1. Open the host dashboard
2. Share the player link or QR code with participants
3. Wait for at least 3 players to join
4. Click "Start Game" when ready

### Joining (Players)
1. Scan the QR code or click the join link
2. Enter your name
3. Wait in the lobby until the host starts

### Gameplay

**Round 1: Night Phase**
- Role reveal screen shows your assignment
- Cultists select a target to sacrifice
- Villagers and idiot wait
- Host validates votes and starts day phase

**Day Phase**
- Results from last night are revealed
- All living players vote to execute a suspect
- Players validate their individual votes
- Host validates all votes and starts next night

**Subsequent Rounds**
- Continue alternating between night and day
- Game ends when one team achieves victory

### Winning

- **Cultists win**: All non-cultists are eliminated
- **Villagers win**: All cultists are eliminated

## Display Modes

### Host Mode (Desktop)
Control panel with:
- Player count and connection status
- Real-time vote monitoring
- Phase transition controls
- Game management (start/restart/reset)

### Player Mode (Mobile)
Interactive gameplay interface:
- Role reveal and information
- Vote submission
- Phase-specific actions
- Game state updates

### Presenter Mode (Large Screen)
Spectator display showing:
- QR code for joining
- Player count
- Connection status

## Configuration

All game text is customizable via `default.config.yaml`. Edit this file to:
- Change button labels
- Modify instructions
- Translate to other languages
- Adjust messaging

After editing `src/config/schema.ts`, run `npm run build` to regenerate the YAML schema.

## Building

Build the concept for production:

```bash
npm run build
```

## Uploading to Kokimoki

To upload your concept to Kokimoki, run:

```bash
kokimoki upload
```

**Important:** Before uploading again, you must update the version in `package.json`:

```bash
npm version patch  # for bug fixes
npm version minor  # for new features
npm version major  # for breaking changes
```

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Structure

```
src/
  state/
    stores/        # Global and player state
    actions/       # State modification functions
  views/           # Game screen components
  modes/           # Host/player/presenter apps
  hooks/           # Custom React hooks
  config/          # Configuration schema
  layouts/         # Layout components
```

## Learn More

- Visit [kokimoki.com](https://kokimoki.com) for Kokimoki documentation
- See [spec.md](./spec.md) for detailed game mechanics
