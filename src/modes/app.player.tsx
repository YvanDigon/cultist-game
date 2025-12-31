import { PlayerMenu } from '@/components/menu';
import { NameLabel } from '@/components/name-label';
import { RoleButton } from '@/components/role-button';
import { withKmProviders } from '@/components/with-km-providers';
import { config } from '@/config';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useGlobalController } from '@/hooks/useGlobalController';
import { PlayerLayout } from '@/layouts/player';
import { kmClient } from '@/services/km-client';
import { playerActions } from '@/state/actions/player-actions';
import { globalStore } from '@/state/stores/global-store';
import { playerStore } from '@/state/stores/player-store';
import { CreateProfileView } from '@/views/create-profile-view';
import { DayPhaseView } from '@/views/day-phase-view';
import { GameLobbyView } from '@/views/game-lobby-view';
import { GameOverView } from '@/views/game-over-view';
import { NightPhaseView } from '@/views/night-phase-view';
import { RoleRevealView } from '@/views/role-reveal-view';
import { WaitingForGameView } from '@/views/waiting-for-game-view';
import { useSnapshot } from '@kokimoki/app';
import * as React from 'react';

const App: React.FC = () => {
	const { title } = config;
	const { name, currentView, roleSeen } = useSnapshot(playerStore.proxy);
	const { started, gamePhase, roundNumber, players } = useSnapshot(globalStore.proxy);

	useGlobalController();
	useDocumentTitle(title);

	// Check if current player is alive
	const isAlive = players[kmClient.id]?.isAlive ?? true;

	// Track previous round number to detect restarts (initialize to -1 to detect first game properly)
	const prevRoundNumberRef = React.useRef(-1);

	// Reset player name if they were removed from the game (host reset players)
	React.useEffect(() => {
		if (name && !players[kmClient.id]) {
			kmClient.transact([playerStore], ([playerState]) => {
				playerState.name = '';
				playerState.currentView = 'lobby';
				playerState.roleSeen = false;
			});
		}
	}, [name, players]);

	// Reset roleSeen when game ends so it's ready for restart
	React.useEffect(() => {
		if (gamePhase === 'game-over') {
			kmClient.transact([playerStore], ([playerState]) => {
				playerState.roleSeen = false;
			});
		}
	}, [gamePhase]);

	// Reset roleSeen when game restarts (roundNumber back to 1 from higher number)
	React.useEffect(() => {
		const prevRound = prevRoundNumberRef.current;
		
		// Reset if roundNumber went from >1 back to 1 (game restart)
		if (started && roundNumber === 1 && prevRound > 1) {
			// Game restarted - reset roleSeen and set view in same transaction
			kmClient.transact([playerStore], ([playerState]) => {
				playerState.roleSeen = false;
				playerState.currentView = 'role-reveal';
			});
		}
		
		// Update ref AFTER checking for restart
		prevRoundNumberRef.current = roundNumber;
	}, [started, roundNumber]);

	React.useEffect(() => {
		// Handle game phase changes
		if (!started) {
			playerActions.setCurrentView('lobby');
			return;
		}

		if (gamePhase === 'game-over') {
			playerActions.setCurrentView('game-over');
			return;
		}

		// CRITICAL: Show role reveal on round 1 if not seen yet and player is alive
		// This must be checked BEFORE phase-based navigation
		if (roundNumber === 1 && !roleSeen && players[kmClient.id]?.role && isAlive) {
			playerActions.setCurrentView('role-reveal');
			return;
		}

		// Otherwise follow game phase
		if (gamePhase === 'night') {
			playerActions.setCurrentView('night');
		} else if (gamePhase === 'day') {
			playerActions.setCurrentView('day');
		}
	}, [started, gamePhase, roundNumber, roleSeen, players, isAlive]);

	if (!name) {
		return (
			<PlayerLayout.Root>
				<PlayerLayout.Header />
				<PlayerLayout.Main>
					<CreateProfileView />
				</PlayerLayout.Main>
			</PlayerLayout.Root>
		);
	}

	// Check if player is registered in the game
	const isRegistered = !!players[kmClient.id];

	// If game started and player not registered OR player has no role assigned, show waiting view
	if (started && (!isRegistered || !players[kmClient.id]?.role)) {
		return (
			<PlayerLayout.Root>
				<PlayerLayout.Header>
					<PlayerMenu />
				</PlayerLayout.Header>

				<PlayerLayout.Main>
					<WaitingForGameView />
				</PlayerLayout.Main>

				<PlayerLayout.Footer>
					<NameLabel name={name} />
				</PlayerLayout.Footer>
			</PlayerLayout.Root>
		);
	}

	if (!started) {
		return (
			<PlayerLayout.Root>
				<PlayerLayout.Header>
					<PlayerMenu />
				</PlayerLayout.Header>

				<PlayerLayout.Main>
					<GameLobbyView />
				</PlayerLayout.Main>

				<PlayerLayout.Footer>
					<NameLabel name={name} />
				</PlayerLayout.Footer>
			</PlayerLayout.Root>
		);
	}

	return (
		<PlayerLayout.Root className={!isAlive ? 'bg-gradient-to-b from-red-950 to-cult-dark' : (gamePhase === 'day' ? 'bg-gradient-to-b from-amber-950 to-cult-dark' : undefined)}>
			<PlayerLayout.Header className="justify-between">
				<RoleButton />
				<PlayerMenu />
			</PlayerLayout.Header>

			<PlayerLayout.Main>
				{!isAlive && gamePhase !== 'game-over' && (
					<div className="fixed top-20 left-0 right-0 z-20 mx-auto max-w-2xl px-4">
						<div className="rounded-xl bg-red-900/90 border border-red-500 p-4 text-center shadow-lg backdrop-blur-sm">
							<p className="text-lg font-semibold text-white">{config.deadPlayerMessage}</p>
						</div>
					</div>
				)}
				{currentView === 'role-reveal' && <RoleRevealView />}
				{currentView === 'night' && <NightPhaseView />}
				{currentView === 'day' && <DayPhaseView />}
				{currentView === 'game-over' && <GameOverView />}
			</PlayerLayout.Main>

			<PlayerLayout.Footer>
				<NameLabel name={name} />
			</PlayerLayout.Footer>
		</PlayerLayout.Root>
	);
};

export default withKmProviders(App);
