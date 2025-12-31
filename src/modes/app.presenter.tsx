import { config } from '@/config';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useGlobalController } from '@/hooks/useGlobalController';
import { generateLink } from '@/kit/generate-link';
import { HostPresenterLayout } from '@/layouts/host-presenter';
import { kmClient } from '@/services/km-client';
import { globalStore } from '@/state/stores/global-store';
import { cn } from '@/utils/cn';
import { ConnectionsView } from '@/views/connections-view';
import { useSnapshot } from '@kokimoki/app';
import { KmQrCode } from '@kokimoki/shared';
import * as React from 'react';
import cultistsVictoryImg from '/cultistsVictory.jpg';
import villagersVictoryImg from '/villagersVictory.jpg';
import nightVillageImg from '/nightVillage.jpg';
import dayVillageImg from '/dayVillage.jpg';

const App: React.FC = () => {
	const { title } = config;
	const { 
		started, 
		gamePhase, 
		players,
		dayVotes,
		lastSacrificeTargetId,
		roundNumber
	} = useSnapshot(globalStore.proxy);

	useGlobalController();
	useDocumentTitle(title);

	if (kmClient.clientContext.mode !== 'presenter') {
		throw new Error('App presenter rendered in non-presenter mode');
	}

	const playerLink = generateLink(kmClient.clientContext.playerCode, {
		mode: 'player'
	});

	// Get eliminated players
	const eliminatedPlayers = Object.entries(players).filter(([, player]) => !player.isAlive);

	// Calculate vote counts for day phase
	const voteCounts: Record<string, { count: number; voters: string[] }> = {};
	dayVotes.forEach((vote) => {
		if (!voteCounts[vote.targetId]) {
			voteCounts[vote.targetId] = { count: 0, voters: [] };
		}
		voteCounts[vote.targetId].count += 1;
		voteCounts[vote.targetId].voters.push(players[vote.voterId]?.name || 'Unknown');
	});

	// Sort by vote count
	const sortedVotes = Object.entries(voteCounts)
		.sort(([, a], [, b]) => b.count - a.count)
		.map(([targetId, data]) => ({
			targetId,
			targetName: players[targetId]?.name || 'Unknown',
			count: data.count,
			voters: data.voters
		}));

	const getRoleName = (role?: string) => {
		switch (role) {
			case 'cultist': return `🔥 ${config.cultistRoleName}`;
			case 'villager': return `👤 ${config.villagerRoleName}`;
			case 'idiot': return `🤪 ${config.idiotRoleName}`;
			case 'medium': return `🔮 ${config.mediumRoleName}`;
			case 'hunter': return `🏹 ${config.hunterRoleName}`;
			default: return 'Unknown';
		}
	};

	// Lobby phase
	if (!started || gamePhase === 'lobby') {
		return (
			<HostPresenterLayout.Root>
				<HostPresenterLayout.Main>
					<div className="relative w-full h-full">
						<ConnectionsView />
						{/* QR Code - Bottom Right */}
						<div className="fixed bottom-8 right-8">
							<KmQrCode data={playerLink} size={200} />
						</div>
					</div>
				</HostPresenterLayout.Main>
			</HostPresenterLayout.Root>
		);
	}

	// Game Over phase
	if (gamePhase === 'game-over') {
		// Get all players with their roles
		const allPlayersWithRoles = Object.entries(players);

		return (
			<HostPresenterLayout.Root>
				<HostPresenterLayout.Main>
					<div className="relative w-full">
						<div className="w-full space-y-8 text-center">
							{/* Victory Banner with Background Image */}
							{globalStore.proxy.winner && (
								<div className="relative">
									{/* Background Image with Gradient Overlay */}
									<div className="relative h-64 rounded-2xl overflow-hidden">
										<img 
											src={globalStore.proxy.winner === 'cultists' ? cultistsVictoryImg : villagersVictoryImg}
											alt={globalStore.proxy.winner === 'cultists' ? 'Cultists Victory' : 'Villagers Victory'}
											className="w-full h-full object-cover opacity-50"
										/>
										{/* Dark gradient overlay */}
										<div className="absolute inset-0 bg-gradient-to-b from-cult-dark/60 via-cult-dark/80 to-cult-dark" />
										{/* Victory Text Overlay */}
										<div className="absolute inset-0 flex flex-col items-center justify-center">
											<h1 className="text-8xl font-bold text-slate-100 tracking-wider mb-4" style={{ fontFamily: 'serif' }}>{config.gameOverTitle}</h1>
											<div className="text-6xl font-bold text-cult-red-bright">
												{globalStore.proxy.winner === 'cultists' ? config.cultistsWin : config.villagersWin}
											</div>
										</div>
									</div>
								</div>
							)}

							{!globalStore.proxy.winner && (
								<>
									<h1 className="text-6xl font-bold text-slate-100">{config.gameOverTitle}</h1>
									<div className="text-5xl font-bold text-slate-300">
										{config.gameEndedNoWinner}
									</div>
								</>
							)}
							
							{/* Show all players and their roles */}
							<div className="mt-12">
								<h2 className="text-3xl font-bold text-slate-100 mb-6">{config.allPlayerRoles}</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
									{allPlayersWithRoles.map(([id, player]) => (
										<div 
											key={id} 
											className={`rounded-xl p-4 border ${
												player.role === 'cultist' 
													? 'bg-cult-red/30 border-cult-red-bright' 
													: 'bg-cult-blue border-cult-red/30'
											}`}
										>
											<p className="text-2xl text-slate-100">
												{player.name} - {getRoleName(player.role)}
												{!player.isAlive && ' (Eliminated)'}
											</p>
										</div>
									))}
								</div>
							</div>
						</div>

						{/* QR Code - Bottom Right */}
						<div className="fixed bottom-8 right-8">
							<KmQrCode data={playerLink} size={200} />
						</div>
					</div>
				</HostPresenterLayout.Main>
			</HostPresenterLayout.Root>
		);
	}

	// Night Phase
	if (gamePhase === 'night') {
		return (
			<HostPresenterLayout.Root>
				<HostPresenterLayout.Main>
					<div className="relative w-full max-w-6xl mx-auto space-y-12">
						{/* QR Code - Fixed Bottom Right */}
						<div className="fixed bottom-8 right-8 z-50">
							<KmQrCode data={playerLink} size={200} />
						</div>
						{/* Phase Header with Banner */}
						<div className="relative">
							{/* Background Image with Gradient Overlay */}
							<div className="relative h-64 rounded-2xl overflow-hidden">
								<img 
							src={nightVillageImg} 
									alt="Night Village" 
									className="w-full h-full object-cover opacity-40"
								/>
								{/* Dark gradient overlay */}
								<div className="absolute inset-0 bg-gradient-to-b from-cult-dark/60 via-cult-dark/80 to-cult-dark" />
								{/* Phase Title Overlay */}
								<div className="absolute inset-0 flex flex-col items-center justify-center">
									<h1 className="text-8xl font-bold text-slate-100 tracking-wider" style={{ fontFamily: 'serif' }}>NIGHT PHASE</h1>
									<p className="text-3xl text-slate-300 mt-3">Round {roundNumber}</p>
								</div>
							</div>
						</div>

						{/* Night Event Message */}
						<div className="bg-cult-blue/60 backdrop-blur-sm rounded-2xl p-8 border border-cult-red/20 text-center">
							<p className="text-3xl text-slate-300 leading-relaxed">
								The cultists are making their choice...
							</p>
						</div>

						{/* Eliminated Players Block */}
						{eliminatedPlayers.length > 0 && (
							<div className="space-y-6">
								<h2 className="text-4xl font-semibold text-slate-200 text-center tracking-wide">Eliminated Players</h2>
								<div className="grid grid-cols-4 gap-4">
									{eliminatedPlayers.map(([id, player]) => (
										<div 
											key={id} 
											className="relative rounded-xl bg-cult-blue/30 border border-slate-700 p-4 text-center opacity-60"
										>
											{/* Tombstone effect */}
											<div className="absolute inset-0 flex items-center justify-center opacity-20">
												<span className="text-6xl">✝</span>
											</div>
										<div className="relative z-10">
											<p className="text-xl text-slate-400 font-medium">{player.name}</p>
											<p className="text-sm text-slate-500 mt-1">{getRoleName(player.role)}</p>
										</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</HostPresenterLayout.Main>
			</HostPresenterLayout.Root>
		);
	}

	// Day Phase
	if (gamePhase === 'day') {
		return (
			<HostPresenterLayout.Root className="bg-gradient-to-b from-amber-950 to-cult-dark">
				<HostPresenterLayout.Main>
					<div className="relative w-full max-w-6xl mx-auto space-y-10 pb-64">
						{/* QR Code - Fixed Bottom Right */}
						<div className="fixed bottom-8 right-8 z-50">
							<KmQrCode data={playerLink} size={200} />
						</div>
						{/* Phase Header with Banner */}
						<div className="relative">
							{/* Background Image with Gradient Overlay */}
							<div className="relative h-64 rounded-2xl overflow-hidden">
								<img 
								src={dayVillageImg} 
									alt="Day Village" 
									className="w-full h-full object-cover opacity-50"
								/>
								{/* Lighter gradient overlay for day */}
								<div className="absolute inset-0 bg-gradient-to-b from-amber-950/40 via-cult-dark/70 to-cult-dark" />
								{/* Phase Title Overlay */}
								<div className="absolute inset-0 flex flex-col items-center justify-center">
									<h1 className="text-8xl font-bold text-slate-100 tracking-wider" style={{ fontFamily: 'serif' }}>DAY PHASE</h1>
									<p className="text-3xl text-amber-200 mt-3">Round {roundNumber}</p>
								</div>
							</div>
						</div>

						{/* Day Event Block - Last Night's Sacrifice */}
						{lastSacrificeTargetId && players[lastSacrificeTargetId] && (
							<div className="bg-cult-blue/60 backdrop-blur-sm rounded-2xl p-6 border border-cult-red/40 shadow-lg shadow-cult-red/20">
								<p className="text-3xl text-center text-slate-200">
									Last night:{' '}
									<span className="font-bold text-cult-red-bright drop-shadow-[0_0_8px_rgba(220,38,38,0.6)] animate-pulse">
										{players[lastSacrificeTargetId].name}
									</span>
									{' '}was sacrificed
								</p>
								<p className="text-xl text-center text-slate-400 mt-2">
									{getRoleName(players[lastSacrificeTargetId].role)}
								</p>
							</div>
						)}

						{/* Public Voting Block */}
						<div className="space-y-6">
							<h2 className="text-5xl font-semibold text-slate-100 text-center tracking-wide" style={{ fontFamily: 'serif' }}>Public Voting</h2>
							
							{/* Execution Result Preview (after votes validated) */}
							{dayVotes.length > 0 && dayVotes.every(v => v.validated) && (() => {
								// Calculate who would be executed
								const validatedVoteCounts: Record<string, number> = {};
								dayVotes.forEach((vote) => {
									validatedVoteCounts[vote.targetId] = (validatedVoteCounts[vote.targetId] || 0) + 1;
								});

								let maxVotes = 0;
								let executionTargetId: string | null = null;
								const tieCandidates: string[] = [];

								Object.entries(validatedVoteCounts).forEach(([targetId, count]) => {
									if (count > maxVotes) {
										maxVotes = count;
										executionTargetId = targetId;
										tieCandidates.length = 0;
										tieCandidates.push(targetId);
									} else if (count === maxVotes && count > 0) {
										tieCandidates.push(targetId);
									}
								});

								const isTie = tieCandidates.length > 1;
								const targetPlayer = executionTargetId ? players[executionTargetId] : null;

								return (
									<div className="bg-cult-blue/60 backdrop-blur-sm rounded-2xl p-6 border border-cult-red/40 shadow-lg shadow-cult-red/20">
										{isTie ? (
											<p className="text-3xl text-center text-slate-200">
												The votes are tied. No one will be executed.
											</p>
										) : targetPlayer ? (
											<>
												<p className="text-3xl text-center text-slate-200">
													The village has decided:{' '}
													<span className="font-bold text-cult-red-bright drop-shadow-[0_0_8px_rgba(220,38,38,0.6)] animate-pulse">
														{targetPlayer.name}
													</span>
													{targetPlayer.role === 'idiot' ? ' will be revealed as the Village Idiot!' : ' will be executed'}
												</p>
												<p className="text-xl text-center text-slate-400 mt-2">
													{getRoleName(targetPlayer.role)}
												</p>
											</>
										) : (
											<p className="text-3xl text-center text-slate-200">
												No votes were cast.
											</p>
										)}
									</div>
								);
							})()}
							
							{sortedVotes.length > 0 ? (
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
									{sortedVotes.map((vote, index) => {
										const isLeading = index === 0 && vote.count > 0;
										return (
											<div 
												key={vote.targetId} 
												className={cn(
													"relative rounded-2xl p-6 border transition-all",
													isLeading
														? "bg-cult-red/20 border-cult-red-bright shadow-lg shadow-cult-red-bright/40 ring-2 ring-cult-red-bright/50"
														: "bg-cult-blue/40 border-cult-red/20"
												)}
											>
												<div className="flex items-center justify-between">
													<div className="flex-1">
														<p className="text-4xl font-bold text-slate-100 mb-2">{vote.targetName}</p>
														<p className="text-lg text-slate-400">
															Votes: {vote.voters.join(', ')}
														</p>
													</div>
													<div className={cn(
														"text-7xl font-bold ml-8",
														isLeading ? "text-cult-red-bright" : "text-slate-500"
													)}>
														{vote.count}
													</div>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<p className="text-3xl text-slate-400 text-center py-8">No votes yet...</p>
							)}
						</div>

						{/* Eliminated Players Block */}
						{eliminatedPlayers.length > 0 && (
							<div className="space-y-6">
								<h2 className="text-4xl font-semibold text-slate-200 text-center tracking-wide">Eliminated Players</h2>
								<div className="grid grid-cols-4 gap-4">
									{eliminatedPlayers.map(([id, player]) => (
										<div 
											key={id} 
											className="relative rounded-xl bg-cult-blue/30 border border-slate-700 p-4 text-center opacity-60"
										>
											{/* Tombstone effect */}
											<div className="absolute inset-0 flex items-center justify-center opacity-20">
												<span className="text-6xl">✝</span>
											</div>
										<div className="relative z-10">
											<p className="text-xl text-slate-400 font-medium">{player.name}</p>
											<p className="text-sm text-slate-500 mt-1">{getRoleName(player.role)}</p>
										</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</HostPresenterLayout.Main>
			</HostPresenterLayout.Root>
		);
	}

	// Fallback
	return (
		<HostPresenterLayout.Root>
			<HostPresenterLayout.Main>
				<div className="relative w-full h-full">
					<ConnectionsView />
					{/* QR Code - Bottom Right */}
					<div className="fixed bottom-8 right-8">
						<KmQrCode data={playerLink} size={200} />
					</div>
				</div>
			</HostPresenterLayout.Main>
		</HostPresenterLayout.Root>
	);
};

export default App;
