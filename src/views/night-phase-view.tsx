import { config } from '@/config';
import { kmClient } from '@/services/km-client';
import { globalActions } from '@/state/actions/global-actions';
import { globalStore } from '@/state/stores/global-store';
import { useSnapshot } from '@kokimoki/app';
import { Users } from 'lucide-react';
import * as React from 'react';

export const NightPhaseView: React.FC = () => {
	const { players, nightVotes, nightVotesValidated, mediumInvestigations, mediumKnowledge, hunterEliminatedId, hunterTargetChoice, sacrificeWasRandomlyChosen, roundNumber } = useSnapshot(globalStore.proxy);
	const myRole = players[kmClient.id]?.role;
	const isAlive = players[kmClient.id]?.isAlive ?? false;
	const myVote = nightVotes[kmClient.id];
	const myInvestigation = mediumInvestigations[kmClient.id];
	const myKnowledge = mediumKnowledge[kmClient.id] || {};

	// Check if this player is the hunter who was just eliminated
	const isEliminatedHunter = hunterEliminatedId === kmClient.id && myRole === 'hunter' && !isAlive;

	// Check if this player was just killed by the Hunter
	const wasKilledByHunter = hunterTargetChoice === kmClient.id && !isAlive;

	const alivePlayers = Object.entries(players).filter(([id, player]) => {
		if (!player.isAlive) return false;
		// Cultists can't vote for other cultists
		if (myRole === 'cultist' && players[id]?.role === 'cultist') return false;
		// Medium can't investigate themselves
		if (myRole === 'medium' && id === kmClient.id) return false;
		// Hunter can't target themselves
		if (isEliminatedHunter && id === kmClient.id) return false;
		return true;
	});

	// Get other cultists for display
	const otherCultists = myRole === 'cultist' 
		? Object.entries(players).filter(([id, player]) => 
			player.role === 'cultist' && id !== kmClient.id
		)
		: [];

	const handleVote = async (targetId: string) => {
		await globalActions.submitNightVote(targetId);
	};

	const handleInvestigate = async (targetId: string) => {
		await globalActions.submitMediumInvestigation(targetId);
	};

	// Check if all cultists agree
	const cultistVotes = Object.entries(nightVotes).filter(([voterId]) => 
		players[voterId]?.role === 'cultist'
	);
	const uniqueTargets = new Set(cultistVotes.map(([, targetId]) => targetId));
	const allAgree = uniqueTargets.size === 1 && cultistVotes.length > 0;

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

	// Hunter elimination view - show when hunter was just eliminated
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

	// Medium view
	if (myRole === 'medium' && isAlive) {
		return (
			<div className="w-full space-y-6">
				<h1 className="text-center text-3xl font-bold text-slate-100">{config.nightPhaseTitle}</h1>
				
				<div className="rounded-2xl bg-cult-blue/80 border border-cult-red/50 p-4 text-slate-300">
					<p className="text-center">{config.nightPhaseSilenceMessage}</p>
				</div>
				
				<div className="rounded-xl bg-purple-900 border border-purple-500 p-4 text-purple-50">
					<p className="text-center font-semibold">{config.nightPhaseMediumInstructions}</p>
				</div>

				{myInvestigation && players[myInvestigation] && (
					<div className="rounded-xl bg-purple-100 p-4 text-purple-900">
						<p className="font-semibold">🔮 Your medium power reveals the truth...</p>
						<p className="text-sm mt-2">
							{config.mediumInvestigationResult
								.replace('{name}', players[myInvestigation].name)
								.replace('{role}', getRoleName(myKnowledge[myInvestigation]))}
						</p>
					</div>
				)}

				{/* Show all past investigations */}
				{Object.keys(myKnowledge).length > 0 && (
					<div className="rounded-xl bg-cult-blue border border-purple-500/30 p-4">
						<p className="font-semibold text-purple-200 mb-3">Your Investigations:</p>
						<div className="space-y-2">
							{Object.entries(myKnowledge).map(([targetId, role]) => (
								<div key={targetId} className="flex justify-between items-center text-slate-200">
									<span>{players[targetId]?.name || 'Unknown'}</span>
									<span className="font-semibold">{getRoleName(role)}</span>
								</div>
							))}
						</div>
					</div>
				)}

				<div className="space-y-2">
					{alivePlayers.map(([id, player]) => (
						<button
							key={id}
							type="button"
							className={`w-full rounded-xl p-4 text-left transition-colors border ${
								myInvestigation === id
									? 'bg-purple-600 text-white border-purple-500 shadow-lg'
									: 'bg-purple-900/80 text-slate-100 border-purple-700 hover:bg-purple-600'
							}`}
							onClick={() => handleInvestigate(id)}
							disabled={!!myInvestigation}
						>
							<div className="flex items-center justify-between">
								<span className="font-medium">{player.name}</span>
								{myInvestigation === id && <span className="text-sm">✓</span>}
							</div>
						</button>
					))}
				</div>
			</div>
		);
	}

	// Villager/Idiot view (non-cultist, non-medium)
	if (myRole !== 'cultist') {
		return (
			<div className="w-full space-y-6 text-center">
				<h1 className="text-3xl font-bold text-slate-100">{config.nightPhaseTitle}</h1>
				<div className="rounded-2xl bg-cult-blue border border-cult-red/30 p-8 text-slate-50">
					<p className="text-xl">{config.nightPhaseVillagerWait}</p>
				</div>
				{isAlive && (
					<div className="rounded-2xl bg-cult-blue/80 border border-cult-red/50 p-6 text-slate-300">
						<p className="text-lg">{config.nightPhaseSilenceMessage}</p>
					</div>
				)}
			</div>
		);
	}

	// Dead cultist view
	if (myRole === 'cultist' && !isAlive) {
		return (
			<div className="w-full space-y-6 text-center">
				<h1 className="text-3xl font-bold text-slate-100">{config.nightPhaseTitle}</h1>
				<div className="rounded-2xl bg-cult-blue border border-cult-red/30 p-8 text-slate-50">
					<p className="text-xl">{config.youAreDead}</p>
				</div>
				<div className="rounded-2xl bg-red-900/80 border border-red-500 p-6 text-red-50">
					<p className="text-lg">{config.deadPlayerMessage}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full space-y-6">
			<h1 className="text-center text-3xl font-bold text-slate-100">{config.nightPhaseTitle}</h1>
			
			<div className="rounded-2xl bg-cult-blue/80 border border-cult-red/50 p-4 text-slate-300">
				<p className="text-center">{config.nightPhaseSilenceMessage}</p>
			</div>
			
			{sacrificeWasRandomlyChosen && roundNumber > 1 && (
				<div className="rounded-xl bg-yellow-900 border border-yellow-500 p-4 text-yellow-100">
					<p className="font-semibold text-center">⚠️ {config.sacrificeRandomMessage}</p>
				</div>
			)}
			
			{otherCultists.length > 0 && (
				<div className="rounded-xl bg-red-900 p-4 text-red-50">
					<p className="font-semibold">Your Fellow Cultists:</p>
					<ul className="mt-2 space-y-1">
						{otherCultists.map(([id, player]) => (
							<li key={id} className="flex items-center gap-2">
								<Users className="size-4" />
								{player.name}
							</li>
						))}
					</ul>
				</div>
			)}

			<div className="rounded-xl bg-cult-blue border border-cult-red/30 p-4 text-slate-50">
				<p className="text-center font-semibold">{config.nightPhaseCultistInstructions}</p>
			</div>

			{myVote && (
				<div className="rounded-xl bg-green-100 p-4 text-green-900">
					<p className="font-semibold">✅ {config.voteRecorded}</p>
					<p className="text-sm">{config.yourVote} {players[myVote]?.name}</p>
				</div>
			)}

			{!allAgree && cultistVotes.length > 1 && (
				<div className="rounded-xl bg-yellow-100 p-4 text-yellow-900">
					<p className="font-semibold">{config.cultistsAgreeWarning}</p>
				</div>
			)}

			<div className="space-y-2">
				{alivePlayers.map(([id, player]) => {
					// Count how many cultists voted for this player
					const votesForThisPlayer = Object.values(nightVotes).filter(targetId => targetId === id).length;
					
					return (
						<button
							key={id}
							type="button"
							className={`w-full rounded-xl p-4 text-left transition-colors border ${
								myVote === id
									? 'bg-cult-red-bright text-white border-cult-red shadow-lg'
									: 'bg-cult-red/80 text-slate-100 border-cult-red hover:bg-cult-red-bright'
							}`}
							onClick={() => handleVote(id)}
							disabled={nightVotesValidated}
						>
							<div className="flex items-center justify-between">
								<span className="font-medium">{player.name}</span>
								<div className="flex items-center gap-2">
									{votesForThisPlayer > 0 && !nightVotesValidated && (
										<span className="text-sm">🗳️ {votesForThisPlayer}</span>
									)}
									{myVote === id && (
										<span className="text-sm">✓</span>
									)}
								</div>
							</div>
						</button>
					);
				})}
			</div>
		</div>
	);
};
