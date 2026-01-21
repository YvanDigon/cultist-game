import { NarrationDrawer } from '@/components/narration-drawer';
import { NarrationSettingsModal } from '@/components/narration-settings-modal';
import { withKmProviders } from '@/components/with-km-providers';
import { config } from '@/config';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useGlobalController } from '@/hooks/useGlobalController';
import { usePlayersWithStatus } from '@/hooks/usePlayersWithStatus';
import { generateLink } from '@/kit/generate-link';
import { HostPresenterLayout } from '@/layouts/host-presenter';
import { kmClient } from '@/services/km-client';
import { globalActions } from '@/state/actions/global-actions';
import { globalStore } from '@/state/stores/global-store';
import { useSnapshot } from '@kokimoki/app';
import { useKmModal } from '@kokimoki/shared';
import { CirclePlay, RotateCcw, Trash2, SquareArrowOutUpRight, Info, Eye, EyeOff, Sparkles } from 'lucide-react';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';

const App: React.FC = () => {
	useGlobalController();
	const { title, hostInstructionsTitleMd, hostInstructionsMd, hostInstructionsButton } = config;
	const isHost = kmClient.clientContext.mode === 'host';
	const { openDrawer } = useKmModal();
	const { 
		started, 
		gamePhase, 
		roundNumber,
		players,
		nightVotes,
		nightVotesValidated,
		dayVotes,
		winner,
		hunterEliminatedId,
		hunterTargetChoice,
		narrationSettings
	} = useSnapshot(globalStore.proxy);
	const [buttonCooldown, setButtonCooldown] = React.useState(true);
	const [showRoles, setShowRoles] = React.useState(true);
	const [showNarrationModal, setShowNarrationModal] = React.useState(false);
	const [showNarrationDrawer, setShowNarrationDrawer] = React.useState(false);
	const playersWithStatus = usePlayersWithStatus();
	useDocumentTitle(title);

	// Button cooldown to prevent accidentally spamming start/stop
	React.useEffect(() => {
		setButtonCooldown(true);
		const timeout = setTimeout(() => {
			setButtonCooldown(false);
		}, 1000);

		return () => clearTimeout(timeout);
	}, [started]);

	const handleShowInstructions = () => {
		openDrawer({
			title: '',
			content: (
				<div className="space-y-4">
					<div className="prose prose-sm max-w-none">
						<ReactMarkdown>
							{hostInstructionsTitleMd}
						</ReactMarkdown>
					</div>
					<div className="prose prose-sm max-w-none">
						<ReactMarkdown>
							{hostInstructionsMd}
						</ReactMarkdown>
					</div>
				</div>
			)
		});
	};

	if (kmClient.clientContext.mode !== 'host') {
		throw new Error('App host rendered in non-host mode');
	}

	const playerLink = generateLink(kmClient.clientContext.playerCode, {
		mode: 'player'
	});

	const presenterLink = generateLink(kmClient.clientContext.presenterCode, {
		mode: 'presenter',
		playerCode: kmClient.clientContext.playerCode
	});

	// Get cultist vote consensus
	const cultistVotes = Object.entries(nightVotes).filter(([voterId]) => 
		players[voterId]?.role === 'cultist'
	);
	const uniqueTargets = new Set(cultistVotes.map(([, targetId]) => targetId));
	const cullistsDecided = uniqueTargets.size === 1 && cultistVotes.length > 0;

	const allDayVotesValidated = dayVotes.length > 0 && dayVotes.every(v => v.validated);
	
	// Check if hunter was eliminated and hasn't made their choice yet
	const hunterNeedsToChoose = hunterEliminatedId !== null && hunterTargetChoice === null;

	const getRoleEmoji = (role?: string) => {
		switch (role) {
			case 'cultist': return '🔥';
			case 'villager': return '👤';
			case 'idiot': return '🤪';
			case 'medium': return '🔮';
			case 'hunter': return '🏹';
			default: return '❓';
		}
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

	return (
		<HostPresenterLayout.Root>
			<HostPresenterLayout.Header>
				<div className="flex gap-4">
					{started && (
						<button
							type="button"
							className="km-btn-secondary"
							onClick={() => setShowRoles(!showRoles)}
							aria-label={showRoles ? config.hideRolesButton : config.showRolesButton}
						>
							{showRoles ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
							{showRoles ? config.hideRolesButton : config.showRolesButton}
						</button>
					)}
					{started && narrationSettings.enabled && (
						<button
							type="button"
							className="km-btn-secondary"
							onClick={() => setShowNarrationDrawer(true)}
						>
							<Sparkles className="size-5" />
							{config.narrationDrawerButton}
						</button>
					)}
					{started && (
						<button
							type="button"
							className="km-btn-secondary"
							onClick={handleShowInstructions}
							aria-label={hostInstructionsButton}
						>
							<Info className="size-5" />
							{hostInstructionsButton}
						</button>
					)}
				</div>
			</HostPresenterLayout.Header>

			<HostPresenterLayout.Main>
				<div className="w-full space-y-6">
					{/* Lobby Instructions */}
					{!started && (
						<div className="rounded-xl bg-cult-blue border border-cult-red/30 p-8 space-y-6">
							<div className="prose prose-lg max-w-none">
								<ReactMarkdown>
									{hostInstructionsTitleMd}
								</ReactMarkdown>
							</div>
							<div className="prose max-w-none">
								<ReactMarkdown>
									{hostInstructionsMd}
								</ReactMarkdown>
							</div>
						</div>
					)}

					{/* Player Count */}
					<div className="rounded-xl bg-cult-blue border border-cult-red/30 p-6">
						<h2 className="text-2xl font-bold text-slate-100">{config.players}</h2>
						<p className="text-4xl font-bold text-cult-red-bright">
							{playersWithStatus.players.filter(p => p.isOnline).length}
						</p>
					</div>

					{/* Player List with Roles */}
					{started && playersWithStatus.players.length > 0 && (
						<div className="rounded-xl bg-cult-blue border border-cult-red/30 p-6">
							<h2 className="text-xl font-bold text-slate-100 mb-4">{config.playersLabel}</h2>
							<div className="space-y-2">
								{playersWithStatus.players.map((player) => (
									<div
										key={player.id}
										className="flex items-center justify-between rounded-lg bg-cult-dark p-3 border border-cult-red/20"
									>
										<div className="flex items-center gap-3">
										{showRoles && <span className="text-2xl">{getRoleEmoji(player.role)}</span>}
										<div>
											<p className="font-semibold text-slate-100">{player.name}</p>
											{showRoles && (
												<p className="text-sm text-slate-400">
													{getRoleName(player.role)}
													{!player.isAlive && ' (Eliminated)'}
												</p>
											)}
											</div>
										</div>
										<div className="flex items-center gap-2">
											<span
												className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
													player.isOnline
														? 'bg-green-900 text-green-100'
														: 'bg-slate-700 text-slate-300'
												}`}
											>
												{player.isOnline ? config.online : config.offline}
											</span>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Game Phase Info */}
					{started && gamePhase !== 'game-over' && (
						<div className="rounded-xl bg-cult-blue border border-cult-red/30 p-6">
							<h2 className="text-xl font-bold">
								{gamePhase === 'night' 
									? config.hostNightPhaseTitle.replace('{round}', roundNumber.toString())
									: config.hostDayPhaseTitle.replace('{round}', roundNumber.toString())
								}
							</h2>

							{/* Night Phase Host Controls */}
							{gamePhase === 'night' && (
								<div className="mt-4 space-y-4">
									<div>
											<p className="font-semibold text-slate-100">{config.cultistVotes}</p>
										<ul className="mt-2 space-y-1">
											{cultistVotes.map(([voterId, targetId]) => (
												<li key={voterId} className="text-sm">
													{players[voterId]?.name} → {players[targetId]?.name}
												</li>
											))}
										</ul>
									</div>

									{cullistsDecided && (
										<div className="rounded-lg bg-green-100 p-3 text-green-900">
											{config.cultistsDecided}
										</div>
									)}

									<div className="flex gap-2">
										<button
											type="button"
												className="flex-1 inline-flex items-center justify-center gap-3 rounded-xl px-5 py-3 font-medium transition-colors not-disabled:cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-50 not-disabled:bg-blue-600 not-disabled:text-white not-disabled:hover:bg-blue-700"
												onClick={globalActions.validateNightVotes}
												disabled={!cullistsDecided || nightVotesValidated}
											>
												{config.validateVotesButton}
											</button>
											<button
												type="button"
												className="flex-1 inline-flex items-center justify-center gap-3 rounded-xl px-5 py-3 font-medium transition-colors not-disabled:cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-50 not-disabled:bg-green-600 not-disabled:text-white not-disabled:hover:bg-green-700"
											onClick={globalActions.startDayPhase}
											disabled={!nightVotesValidated}
										>
											{config.startDayPhaseButton}
										</button>
									</div>
								</div>
							)}

							{/* Day Phase Host Controls */}
							{gamePhase === 'day' && (
								<div className="mt-4 space-y-4">
									<div>
										<p className="font-semibold text-slate-100">{config.dayVotesLabel} {dayVotes.length}</p>
									<p className="text-sm">{config.validatedLabel} {dayVotes.filter(v => v.validated).length}</p>
								</div>

								{hunterNeedsToChoose && (
									<div className="rounded-lg bg-yellow-100 p-3 text-yellow-900">
										<p className="font-semibold">{config.waitingForHunterMessage}</p>
									</div>
								)}

								<div className="flex gap-2">
						<button
							type="button"
								className="flex-1 inline-flex items-center justify-center gap-3 rounded-xl px-5 py-3 font-medium transition-colors not-disabled:cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-50 not-disabled:bg-blue-600 not-disabled:text-white not-disabled:hover:bg-blue-700"
								onClick={globalActions.validateAllDayVotes}
								disabled={allDayVotesValidated}
											>
												{config.validateAllVotesButton}
											</button>
											<button
												type="button"
												className="flex-1 inline-flex items-center justify-center gap-3 rounded-xl px-5 py-3 font-medium transition-colors not-disabled:cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-50 not-disabled:bg-green-600 not-disabled:text-white not-disabled:hover:bg-green-700"
											onClick={globalActions.startNightPhase}
											disabled={!allDayVotesValidated || hunterNeedsToChoose}
										>
											{config.startNightPhaseButton}
										</button>
									</div>
								</div>
							)}
						</div>
					)}

					{/* Game Over */}
					{gamePhase === 'game-over' && (
						<div className="rounded-xl bg-cult-red-bright border border-cult-red-bright p-8 shadow-lg">
							<h2 className="text-4xl font-bold text-white text-center">{config.gameOverTitle}</h2>
							<p className="mt-4 text-3xl font-bold text-white text-center">
								{winner === 'cultists' ? config.cultistsWin : config.villagersWin}
							</p>
							<p className="mt-6 text-xl text-center text-slate-100">
								Use the buttons below to restart or reset the game
							</p>
						</div>
					)}
				</div>
			</HostPresenterLayout.Main>

			<HostPresenterLayout.Footer>
				<div className="inline-flex gap-4">
					{!started && isHost && (
						<button
							type="button"
							className="inline-flex items-center justify-center gap-3 rounded-xl px-5 py-3 font-medium transition-colors not-disabled:cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-50 not-disabled:bg-green-600 not-disabled:text-white not-disabled:hover:bg-green-700"
							onClick={() => setShowNarrationModal(true)}
							disabled={buttonCooldown || Object.keys(players).length < 3}
						>
							<CirclePlay className="size-5" />
							{config.startButton}
						</button>
					)}
					{started && isHost && gamePhase !== 'game-over' && (
						<button
							type="button"
							className="km-btn-error"
							onClick={globalActions.endGame}
							disabled={buttonCooldown}
						>
							{config.endGameButton}
						</button>
					)}
					{started && isHost && gamePhase === 'game-over' && (
						<>
							<button
								type="button"
								className="inline-flex items-center justify-center gap-3 rounded-xl px-5 py-3 font-medium transition-colors not-disabled:cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-50 not-disabled:bg-blue-600 not-disabled:text-white not-disabled:hover:bg-blue-700"
								onClick={() => setShowNarrationModal(true)}
								disabled={buttonCooldown}
							>
								<RotateCcw className="size-5" />
								{config.newRitualButton}
							</button>
							<button
								type="button"
								className="km-btn-error"
								onClick={globalActions.resetPlayers}
								disabled={buttonCooldown}
							>
								<Trash2 className="size-5" />
								{config.dismissParticipantsButton}
							</button>
						</>
					)}
				</div>
				<div className="inline-flex gap-4">
					<a
						href={playerLink}
						target="_blank"
						rel="noreferrer"
						className="km-btn-secondary"
					>
						{config.playerLinkLabel}
						<SquareArrowOutUpRight className="size-5" />
					</a>

					<a
						href={presenterLink}
						target="_blank"
						rel="noreferrer"
						className="km-btn-secondary"
					>
						{config.presenterLinkLabel}
						<SquareArrowOutUpRight className="size-5" />
					</a>
				</div>
			</HostPresenterLayout.Footer>

			{/* Narration Settings Modal */}
			<NarrationSettingsModal
				isOpen={showNarrationModal}
				onClose={() => setShowNarrationModal(false)}
				onStartGame={() => {
					setShowNarrationModal(false);
					if (started) {
						globalActions.restartGame();
					} else {
						globalActions.startGame();
					}
				}}
			/>

			{/* Narration Drawer */}
			<NarrationDrawer
				isOpen={showNarrationDrawer}
				onClose={() => setShowNarrationDrawer(false)}
			/>
		</HostPresenterLayout.Root>
	);
};

export default withKmProviders(App);
