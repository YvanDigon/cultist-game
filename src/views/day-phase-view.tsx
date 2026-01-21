import { config } from '@/config';
import { kmClient } from '@/services/km-client';
import { globalActions } from '@/state/actions/global-actions';
import { globalStore } from '@/state/stores/global-store';
import { useSnapshot } from '@kokimoki/app';
import * as React from 'react';

export const DayPhaseView: React.FC = () => {
	const { 
		players, 
		dayVotes, 
		lastSacrificeTargetId, 
		lastExecutedId,
		lastExecutionAttemptedId,
		idiotRevealed,
		roundNumber,
		hunterEliminatedId,
		hunterTargetChoice
	} = useSnapshot(globalStore.proxy);
	
	const myPlayer = players[kmClient.id];
	const myRole = myPlayer?.role;
	const isAlive = myPlayer?.isAlive ?? false;
	const myVote = dayVotes.find(v => v.voterId === kmClient.id);

	// Check if all votes have been validated by the host
	const allVotesValidated = dayVotes.length > 0 && dayVotes.every(v => v.validated);

	// Check if this player is the hunter who was just eliminated
	const isEliminatedHunter = hunterEliminatedId === kmClient.id && myRole === 'hunter' && !isAlive;

	// Check if this player was just killed by the Hunter (only when hunter was eliminated)
	const wasKilledByHunter = hunterEliminatedId !== null && hunterTargetChoice === kmClient.id && !isAlive && kmClient.id !== hunterEliminatedId;

	const alivePlayers = Object.entries(players).filter(([id, player]) => {
		if (!player.isAlive) return false;
		// Players can't vote for themselves
		if (id === kmClient.id) return false;
		return true;
	});

	// Count alive cultists
	const aliveCultistsCount = Object.values(players).filter(
		player => player.isAlive && player.role === 'cultist'
	).length;

	const handleVote = async (targetId: string) => {
		await globalActions.submitDayVote(targetId);
	};

	const getRoleName = (role?: string) => {
		switch (role) {
			case 'cultist': return config.cultistRoleName;
			case 'villager': return config.villagerRoleName;
			case 'idiot': return config.idiotRoleName;
			case 'medium': return config.mediumRoleName;
			case 'hunter': return config.hunterRoleName;
			default: return 'Unknown';
		}
	};

	// Show message if player was killed by the Hunter
	if (wasKilledByHunter) {
		return (
			<div className="w-full space-y-6 text-center">
				<h1 className="text-3xl font-bold text-red-400">{config.hunterYouWereEliminated}</h1>
				<div className="rounded-2xl bg-red-900/80 border border-red-500 p-8 text-red-50">
					<p className="text-xl">{config.deadPlayerMessage}</p>
				</div>
			</div>
		);
	}

	// Hunter elimination view - show when hunter was just eliminated during day
	if (isEliminatedHunter) {
		return (
			<div className="w-full space-y-6">
				<h1 className="text-center text-3xl font-bold text-red-400">{config.hunterEliminatedTitle}</h1>
				
				<div className="rounded-xl bg-green-900 border border-green-500 p-4 text-green-50">
					<p className="text-center font-semibold">{config.hunterChooseTarget}</p>
				</div>

				{hunterTargetChoice && players[hunterTargetChoice] && (
					<div className="rounded-xl bg-green-100 p-4 text-green-900">
						<p className="font-semibold">{config.hunterChoiceConfirmed}</p>
					<p className="text-sm mt-2">
						{config.hunterTargetEliminated.replace('{name}', players[hunterTargetChoice].name)}
					</p>
				</div>
			)}

				<div className="space-y-2">
					{alivePlayers.map(([id, player]) => (
						<button
							key={id}
							type="button"
							className={`w-full rounded-xl p-4 text-left transition-colors border ${
								hunterTargetChoice === id
									? 'bg-green-600 text-white border-green-500 shadow-lg'
									: 'bg-green-900/80 text-slate-100 border-green-700 hover:bg-green-600'
							}`}
							onClick={() => globalActions.submitHunterTarget(id)}
							disabled={!!hunterTargetChoice}
						>
							<div className="flex items-center justify-between">
								<span className="font-medium">{player.name}</span>
								{hunterTargetChoice === id && <span className="text-sm">✓</span>}
							</div>
						</button>
					))}
				</div>
			</div>
		);
	}

	if (!isAlive) {
		return (
			<div className="w-full space-y-6 text-center">
				<h1 className="text-3xl font-bold text-slate-100">{config.dayPhaseTitle}</h1>
				<div className="rounded-2xl bg-cult-blue border border-cult-red/30 p-8 text-slate-50">
					<p className="text-2xl">{config.youAreDead}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full space-y-6">
			<h1 className="text-center text-3xl font-bold text-slate-100">{config.dayPhaseTitle}</h1>

			{/* Last night's results */}
			{roundNumber > 1 && (
				<div className="rounded-xl bg-cult-blue border border-cult-red/30 p-4 text-slate-100">
					{lastSacrificeTargetId && players[lastSacrificeTargetId] ? (
						<p className="text-center">
							{config.lastNightSacrifice
								.replace('{name}', players[lastSacrificeTargetId].name)
								.replace('{role}', getRoleName(players[lastSacrificeTargetId].role))}
						</p>
					) : (
						<p className="text-center">{config.noSacrificeLastNight}</p>
					)}
				</div>
			)}

			{/* Previous day execution results (only shown from round 2+) */}
			{roundNumber > 1 && (
				<div className="rounded-xl bg-cult-blue border border-cult-red/30 p-4 text-slate-100">
					{lastExecutionAttemptedId === 'tie' ? (
						<p className="text-center">{config.lastDayExecutionTie}</p>
					) : lastExecutionAttemptedId && idiotRevealed && !lastExecutedId ? (
						<p className="text-center">
							{config.lastDayIdiotRevealed.replace('{name}', players[lastExecutionAttemptedId]?.name || '')}
						</p>
					) : lastExecutedId && players[lastExecutedId] ? (
						<p className="text-center">
							{config.lastDayExecution
								.replace('{name}', players[lastExecutedId].name)
								.replace('{role}', getRoleName(players[lastExecutedId].role))}
						</p>
					) : roundNumber > 1 && (
						<p className="text-center">{config.noExecutionYesterday}</p>
					)}
				</div>
			)}

			{/* Current day idiot reveal message */}
			{idiotRevealed && lastExecutionAttemptedId && !lastExecutedId && players[lastExecutionAttemptedId] && (
				<div className="rounded-xl bg-yellow-900 border border-yellow-500 p-4 text-yellow-100">
					<p className="text-center font-semibold">
						{config.idiotRevealedCurrentDay.replace('{name}', players[lastExecutionAttemptedId].name)}
					</p>
				</div>
			)}

			<div className="rounded-xl bg-cult-blue border border-cult-red/30 p-4 text-slate-50">
				<p className="text-center font-semibold">{config.voteToExecute}</p>
				<p className="text-center text-lg mt-2">
					{config.cultistsLeftLabel} {'🦹'.repeat(aliveCultistsCount)}
				</p>
			</div>

			<div className="space-y-2">
				{alivePlayers.map(([id, player]) => (
					<button
						key={id}
						type="button"
						className={`w-full rounded-xl p-4 text-left transition-colors border ${
							myVote?.targetId === id
								? 'bg-cult-red-bright text-white border-cult-red shadow-lg'
								: 'bg-cult-red/80 text-slate-100 border-cult-red hover:bg-cult-red-bright'
						}`}
						onClick={() => handleVote(id)}
						disabled={allVotesValidated}
					>
						<div className="flex items-center justify-between">
							<span className="font-medium">{player.name}</span>
							{myVote?.targetId === id && (
								<span className="text-sm">✓</span>
							)}
						</div>
					</button>
				))}
			</div>

			{myVote && (
				<div className="rounded-xl p-4 bg-green-900 text-green-100 border border-green-700">
					<p className="font-semibold">✓ {config.voteRecorded}</p>
					<p className="text-sm">{players[myVote.targetId]?.name}</p>
				</div>
			)}
		</div>
	);
};
