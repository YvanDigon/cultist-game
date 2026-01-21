import { config } from '@/config';
import { kmClient } from '@/services/km-client';
import { globalStore } from '@/state/stores/global-store';
import { useSnapshot } from '@kokimoki/app';
import * as React from 'react';

export const GameOverView: React.FC = () => {
	const { winner, players, endedByHost } = useSnapshot(globalStore.proxy);

	const cultists = Object.entries(players).filter(([, player]) => player.role === 'cultist');
	
	// Check if current player won
	const myRole = players[kmClient.id]?.role;
	const didIWin = Boolean(
		winner &&
		((myRole === 'cultist' && winner === 'cultists') ||
			(myRole !== 'cultist' && winner === 'villagers'))
	);

	const showOutcomeCards = !endedByHost && winner !== null;

	const outcomeMessage = endedByHost
		? config.hostEndedGamePlayerMessage
		: winner === 'cultists'
			? config.cultistsWin
			: winner === 'villagers'
				? config.villagersWin
				: config.gameEndedNoWinner;

	return (
		<div className="w-full space-y-8 text-center">
			<h1 className="text-4xl font-bold text-slate-100">{config.gameOverTitle}</h1>

			{showOutcomeCards ? (
				<>
					<div className={`rounded-2xl p-6 text-3xl font-bold shadow-lg ${
						didIWin
							? 'bg-green-900 text-green-50'
							: 'bg-red-900 text-red-50'
					}`}
					>
						{didIWin ? 'You Won! 🎉' : 'You Lost'}
					</div>

					<div className={`rounded-2xl p-8 text-4xl font-bold shadow-lg ${
						winner === 'cultists'
							? 'bg-red-900 text-red-50'
							: 'bg-blue-900 text-blue-50'
					}`}
					>
						{outcomeMessage}
					</div>
				</>
			) : (
				<div className="rounded-2xl bg-cult-blue/70 border border-cult-red/30 p-6 text-2xl font-semibold text-slate-100 shadow-lg">
					{outcomeMessage}
				</div>
			)}

			<div className="rounded-xl bg-cult-blue border border-cult-red/30 p-6">
				<p className="mb-4 text-xl font-semibold text-slate-100">{config.theCultistsWere}</p>
				<div className="space-y-2">
					{cultists.map(([id, player]) => (
						<div key={id} className="rounded-lg bg-red-100 p-3 text-red-900">
							<p className="font-medium">{player.name}</p>
						</div>
					))}
				</div>
			</div>

			<div className="rounded-xl bg-cult-blue/60 border border-cult-red/30 p-4">
				<p className="text-lg text-slate-300">{config.awaitingNewRitual}</p>
			</div>
		</div>
	);
};
