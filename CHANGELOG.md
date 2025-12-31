# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

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
- Image paths fixed for production deployment (removed leading slashes)

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