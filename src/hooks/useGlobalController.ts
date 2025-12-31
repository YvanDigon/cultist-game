import { kmClient } from '@/services/km-client';
import { globalStore } from '@/state/stores/global-store';
import { useSnapshot } from '@kokimoki/app';
import { useEffect } from 'react';
import { useServerTimer } from './useServerTime';

/**
 * Hook to control and modify the global state
 * @returns A boolean indicating if the current client is the global controller
 */
export function useGlobalController() {
	const { controllerConnectionId, started, players, gamePhase } = useSnapshot(globalStore.proxy);
	const connections = useSnapshot(globalStore.connections);
	const connectionIds = connections.connectionIds;
	const isGlobalController = controllerConnectionId === kmClient.connectionId;
	const serverTime = useServerTimer(1000); // tick every second

	// Maintain connection that is assigned to be the global controller
	useEffect(() => {
		// Check if global controller is online
		if (connectionIds.has(controllerConnectionId)) {
			return;
		}

		// Select new host, sorting by connection id
		kmClient
			.transact([globalStore], ([globalState]) => {
				const connectionIdsArray = Array.from(connectionIds);
				connectionIdsArray.sort();
				globalState.controllerConnectionId = connectionIdsArray[0] || '';
			})
			.then(() => {})
			.catch(() => {});
	}, [connectionIds, controllerConnectionId]);

	// Win condition checking
	useEffect(() => {
		if (!isGlobalController || !started || gamePhase === 'game-over') {
			return;
		}

		const checkWinCondition = async () => {
			const alivePlayers = Object.entries(players).filter(([, player]) => player.isAlive);
			const aliveCultists = alivePlayers.filter(([, player]) => player.role === 'cultist');
			const aliveNonCultists = alivePlayers.filter(([, player]) => player.role !== 'cultist');

			// No players alive - tie/draw
			if (alivePlayers.length === 0) {
				await kmClient.transact([globalStore], ([globalState]) => {
					globalState.gamePhase = 'game-over';
					globalState.winner = null;
				});
				return;
			}

			// Cultists win if all non-cultists are dead
			if (aliveNonCultists.length === 0) {
				await kmClient.transact([globalStore], ([globalState]) => {
					globalState.gamePhase = 'game-over';
					globalState.winner = 'cultists';
				});
				return;
			}

			// Villagers win if all cultists are dead
			if (aliveCultists.length === 0) {
				await kmClient.transact([globalStore], ([globalState]) => {
					globalState.gamePhase = 'game-over';
					globalState.winner = 'villagers';
				});
			}
		};

		checkWinCondition();
	}, [isGlobalController, started, gamePhase, players, serverTime]);

	return isGlobalController;
}
