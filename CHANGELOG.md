# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [0.1.4] - 2026-01-21

### Added
- AI Narration system for hosts to create immersive storytelling experience
  - Settings modal appears when starting or restarting a game
  - Configurable village name, cult name, tone (Dark/Humorous/Neutral), length (Short/Long), and language
  - Phase-by-phase narration generation with actual game events (sacrifices, executions, special roles)
  - Narration drawer accessible via button in host header during active games
  - Regeneration option (once per phase) for narration scripts
  - All narration written at 12-year-old reading level for accessibility
  - Settings persist across page refreshes
- Hide/Show roles toggle button on host view to conceal or reveal player roles in the player list

### Changed
- "Start Game" button now opens narration settings modal before starting
- "New Ritual" (restart) button now opens narration settings modal with previous settings pre-filled
- Narration settings can be adjusted for each new game

## [0.1.3] - 2026-01-14

### Added
- Game instructions display on host screen in lobby phase
- Info button on host screen to view game instructions during active game

### Fixed
- Hunter elimination during day phase now properly triggers choice menu and prevents premature night phase transition
- Players sacrificed by cultists no longer see incorrect "eliminated by Hunter" message

## [0.1.2] - 2025-12-31

### Added
- Hunter choice menu now appears when hunter is executed during day phase
- Visual indicator on host screen when waiting for hunter to make their choice

### Changed
- Players can no longer change their votes after host validates all day votes
- Host cannot transition to night phase until hunter makes their elimination choice (when hunter is executed)

### Fixed
- Dead cultists can no longer vote during night phase sacrifice

## [0.1.1] - 2025-12-31

### Added
- Real-time vote count display for cultists during night phase (shows how many votes each player has)
- Multi-column grid layout on presenter screen for better readability with many players
- Silence reminder message for all alive players during night phase
- Random tie-breaking for cultist night votes with feedback notification
- UTF-8 charset meta tag for proper emoji display

### Changed
- Execution voting interface now shows voting options before results (player view)
- Execution result preview now appears above player list (presenter view)
- Players can no longer vote for themselves during day phase execution
- Images converted to Vite module imports for proper production deployment (instead of direct path references)

### Fixed
- Dead player message no longer appears during game over screen
- Previous day execution results removed from presenter view during active voting
- Build errors related to unused imports

## [0.1.0] - 2025-12-31

### Added
- Initial game setup with Cultist social deduction gameplay
- Three display modes: host (control), player (mobile), presenter (spectator)
- Five player roles: Cultist, Villager, Village Idiot, Medium, Hunter
- Night phase with cultist voting and medium investigations
- Day phase with public execution voting
- Dynamic role assignment based on player count
- Win condition checking for cultists vs villagers
- Real-time synchronization across all players