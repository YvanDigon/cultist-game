import { kmClient } from '@/services/km-client';
import { globalStore, type Role } from '../stores/global-store';
import { config } from '@/config';

// Helper function to assign roles based on player count
function assignRoles(playerCount: number): Role[] {
	const roles: Role[] = [];
	
	// Determine number of cultists based on player count
	let cultistCount = 1; // Default
	if (playerCount <= config.oneCultistsMaxPlayers) {
		cultistCount = 1;
	} else if (playerCount <= config.twoCultistsMaxPlayers) {
		cultistCount = 2;
	} else if (playerCount <= config.threeCultistsMaxPlayers) {
		cultistCount = 3;
	} else {
		cultistCount = 4;
	}
	
	// Add cultists first
	for (let i = 0; i < cultistCount; i++) {
		roles.push('cultist');
	}
	
	// Define special roles (can be expanded in the future)
	const specialRoles: Role[] = ['idiot', 'medium', 'hunter'];
	
	// Shuffle special roles
	const shuffledSpecialRoles = [...specialRoles];
	for (let i = shuffledSpecialRoles.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffledSpecialRoles[i], shuffledSpecialRoles[j]] = [shuffledSpecialRoles[j], shuffledSpecialRoles[i]];
	}
	
	// Add special roles until we run out of slots or special roles
	for (const specialRole of shuffledSpecialRoles) {
		if (roles.length >= playerCount) break;
		roles.push(specialRole);
	}
	
	// Fill remaining slots with villagers
	while (roles.length < playerCount) {
		roles.push('villager');
	}

	// Shuffle all roles
	for (let i = roles.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[roles[i], roles[j]] = [roles[j], roles[i]];
	}

	return roles;
}

export const globalActions = {
	async startGame() {
		await kmClient.transact([globalStore], ([globalState]) => {
			const playerIds = Object.keys(globalState.players);
			const roles = assignRoles(playerIds.length);

			// Assign roles to players
			playerIds.forEach((playerId, index) => {
				globalState.players[playerId].role = roles[index];
				globalState.players[playerId].isAlive = true;
			});

			globalState.started = true;
			globalState.startTimestamp = kmClient.serverTimestamp();
			globalState.gamePhase = 'night';
			globalState.roundNumber = 1;
			globalState.nightVotes = {};
			globalState.nightVotesValidated = false;
			globalState.mediumInvestigations = {};
			globalState.mediumKnowledge = {};
			globalState.dayVotes = [];
			globalState.lastSacrificeTargetId = null;
			globalState.lastSacrificeSuccess = false;
			globalState.lastExecutedId = null;
			globalState.lastExecutionAttemptedId = null;
			globalState.idiotRevealed = false;
			globalState.winner = null;
		});
	},

	async restartGame() {
		await kmClient.transact([globalStore], ([globalState]) => {
			const playerIds = Object.keys(globalState.players);
			const roles = assignRoles(playerIds.length);

			// Reassign new roles to players
			playerIds.forEach((playerId, index) => {
				globalState.players[playerId].role = roles[index];
				globalState.players[playerId].isAlive = true;
			});

			globalState.gamePhase = 'night';
			globalState.roundNumber = 1;
			globalState.nightVotes = {};
			globalState.nightVotesValidated = false;
			globalState.mediumInvestigations = {};
			globalState.mediumKnowledge = {};
			globalState.dayVotes = [];
			globalState.lastSacrificeTargetId = null;
			globalState.lastSacrificeSuccess = false;
			globalState.sacrificeWasRandomlyChosen = false;
			globalState.lastExecutedId = null;
			globalState.lastExecutionAttemptedId = null;
			globalState.idiotRevealed = false;
			globalState.winner = null;
		});
	},

	async resetPlayers() {
		await kmClient.transact([globalStore], ([globalState]) => {
			globalState.started = false;
			globalState.startTimestamp = 0;
			globalState.gamePhase = 'lobby';
			globalState.roundNumber = 0;
			globalState.players = {};
			globalState.nightVotes = {};
			globalState.nightVotesValidated = false;
			globalState.dayVotes = [];
			globalState.lastSacrificeTargetId = null;
			globalState.lastSacrificeSuccess = false;
			globalState.lastExecutedId = null;
			globalState.lastExecutionAttemptedId = null;
			globalState.idiotRevealed = false;
			globalState.winner = null;
		});
	},

	async submitNightVote(targetId: string) {
		await kmClient.transact([globalStore], ([globalState]) => {
			globalState.nightVotes[kmClient.id] = targetId;
		});
	},

	async submitMediumInvestigation(targetId: string) {
		await kmClient.transact([globalStore], ([globalState]) => {
			globalState.mediumInvestigations[kmClient.id] = targetId;
			// Store the investigation result
			if (!globalState.mediumKnowledge[kmClient.id]) {
				globalState.mediumKnowledge[kmClient.id] = {};
			}
			const targetRole = globalState.players[targetId]?.role;
			if (targetRole) {
				globalState.mediumKnowledge[kmClient.id][targetId] = targetRole;
			}
		});
	},

	async submitHunterTarget(targetId: string) {
		await kmClient.transact([globalStore], ([globalState]) => {
			globalState.hunterTargetChoice = targetId;
			
			// Immediately eliminate the target
			if (globalState.players[targetId]) {
				globalState.players[targetId].isAlive = false;
			}
			
			// Check win conditions
			const alivePlayers = Object.entries(globalState.players).filter(([, player]) => player.isAlive);
			const aliveCultists = alivePlayers.filter(([, player]) => player.role === 'cultist');
			const aliveNonCultists = alivePlayers.filter(([, player]) => player.role !== 'cultist');

			// Cultists win if all non-cultists are dead
			if (aliveNonCultists.length === 0 && aliveCultists.length > 0) {
				globalState.gamePhase = 'game-over';
				globalState.winner = 'cultists';
			}
			// Villagers win if all cultists are dead
			else if (aliveCultists.length === 0 && aliveNonCultists.length > 0) {
				globalState.gamePhase = 'game-over';
				globalState.winner = 'villagers';
			}
		});
	},

	async validateNightVotes() {
		await kmClient.transact([globalStore], ([globalState]) => {
			globalState.nightVotesValidated = true;
		});
	},

		async startDayPhase() {
		await kmClient.transact([globalStore], ([globalState]) => {
			// Count votes
			const voteCounts: Record<string, number> = {};
			Object.values(globalState.nightVotes).forEach((targetId) => {
				voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
			});

			// Find target with most votes
			let maxVotes = 0;
			const tiedCandidates: string[] = [];
			Object.entries(voteCounts).forEach(([targetId, count]) => {
				if (count > maxVotes) {
					maxVotes = count;
					tiedCandidates.length = 0;
					tiedCandidates.push(targetId);
				} else if (count === maxVotes && count > 0) {
					tiedCandidates.push(targetId);
				}
			});

			// Handle tie by random selection
			let sacrificeTargetId: string | null = null;
			let wasRandomlyChosen = false;
			if (tiedCandidates.length > 1) {
				const randomIndex = Math.floor(Math.random() * tiedCandidates.length);
				sacrificeTargetId = tiedCandidates[randomIndex];
				wasRandomlyChosen = true;
			} else if (tiedCandidates.length === 1) {
				sacrificeTargetId = tiedCandidates[0];
				wasRandomlyChosen = false;
			}

			globalState.sacrificeWasRandomlyChosen = wasRandomlyChosen;

			// Process sacrifice
			if (sacrificeTargetId && globalState.players[sacrificeTargetId]) {
				const sacrificedPlayer = globalState.players[sacrificeTargetId];
				sacrificedPlayer.isAlive = false;
				globalState.lastSacrificeTargetId = sacrificeTargetId;
				globalState.lastSacrificeSuccess = true;
				
				// Check if sacrificed player was a hunter
				if (sacrificedPlayer.role === 'hunter') {
					globalState.hunterEliminatedId = sacrificeTargetId;
					globalState.hunterTargetChoice = null; // Reset choice for new hunter
				}
			} else {
				globalState.lastSacrificeSuccess = false;
			}

			// Check win conditions after sacrifice
			const alivePlayers = Object.entries(globalState.players).filter(([, player]) => player.isAlive);
			const aliveCultists = alivePlayers.filter(([, player]) => player.role === 'cultist');
			const aliveNonCultists = alivePlayers.filter(([, player]) => player.role !== 'cultist');

			// Cultists win if all non-cultists are dead
			if (aliveNonCultists.length === 0 && aliveCultists.length > 0) {
				globalState.gamePhase = 'game-over';
				globalState.winner = 'cultists';
				return;
			}

			// Villagers win if all cultists are dead
			if (aliveCultists.length === 0 && aliveNonCultists.length > 0) {
				globalState.gamePhase = 'game-over';
				globalState.winner = 'villagers';
				return;
			}

			// Transition to day phase
			globalState.gamePhase = 'day';
			globalState.dayVotes = [];
			globalState.mediumInvestigations = {}; // Clear current night investigations
			// Note: Don't reset hunter state here - if hunter was sacrificed at night, they need to make their choice during day phase
		});
	},

	async submitDayVote(targetId: string) {
		await kmClient.transact([globalStore], ([globalState]) => {
			// Remove existing vote from this player
			globalState.dayVotes = globalState.dayVotes.filter(
				(v) => v.voterId !== kmClient.id
			);
			// Add new vote
			globalState.dayVotes.push({
				voterId: kmClient.id,
				targetId,
				validated: false
			});
		});
	},

	async validateDayVote() {
		await kmClient.transact([globalStore], ([globalState]) => {
			const vote = globalState.dayVotes.find(
				(v) => v.voterId === kmClient.id
			);
			if (vote) {
				vote.validated = true;
			}
		});
	},

	async validateAllDayVotes() {
		await kmClient.transact([globalStore], ([globalState]) => {
			globalState.dayVotes.forEach((vote) => {
				vote.validated = true;
			});
		});
	},

	async startNightPhase() {
		await kmClient.transact([globalStore], ([globalState]) => {
			// Count validated votes
			const voteCounts: Record<string, number> = {};
			globalState.dayVotes
				.filter((v) => v.validated)
				.forEach((vote) => {
					voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
				});

			// Find target with most votes
			let maxVotes = 0;
			let executionTargetId: string | null = null;
			const tieCandidates: string[] = [];

			Object.entries(voteCounts).forEach(([targetId, count]) => {
				if (count > maxVotes) {
					maxVotes = count;
					executionTargetId = targetId;
					tieCandidates.length = 0;
					tieCandidates.push(targetId);
				} else if (count === maxVotes && count > 0) {
					tieCandidates.push(targetId);
				}
			});

			// Check for tie
			if (tieCandidates.length > 1) {
				globalState.lastExecutionAttemptedId = 'tie';
				globalState.lastExecutedId = null;
			} else if (executionTargetId && globalState.players[executionTargetId]) {
				globalState.lastExecutionAttemptedId = executionTargetId;
				const target = globalState.players[executionTargetId];

				// Check if target is idiot
				if (target.role === 'idiot') {
					globalState.idiotRevealed = true;
					globalState.lastExecutedId = null; // Idiot survives
				} else {
					target.isAlive = false;
					globalState.lastExecutedId = executionTargetId;
					
					// Check if executed player was a hunter
					if (target.role === 'hunter') {
						globalState.hunterEliminatedId = executionTargetId;
						globalState.hunterTargetChoice = null; // Reset choice for new hunter
					}
				}
			} else {
				globalState.lastExecutionAttemptedId = null;
				globalState.lastExecutedId = null;
			}

			// Check win conditions after execution
			const alivePlayers = Object.entries(globalState.players).filter(([, player]) => player.isAlive);
			const aliveCultists = alivePlayers.filter(([, player]) => player.role === 'cultist');
			const aliveNonCultists = alivePlayers.filter(([, player]) => player.role !== 'cultist');

			// Cultists win if all non-cultists are dead
			if (aliveNonCultists.length === 0 && aliveCultists.length > 0) {
				globalState.gamePhase = 'game-over';
				globalState.winner = 'cultists';
				return;
			}

			// Villagers win if all cultists are dead
			if (aliveCultists.length === 0 && aliveNonCultists.length > 0) {
				globalState.gamePhase = 'game-over';
				globalState.winner = 'villagers';
				return;
			}

			// Increment round and transition to night
			globalState.roundNumber += 1;
			globalState.gamePhase = 'night';
			globalState.nightVotes = {};
			globalState.nightVotesValidated = false;
			globalState.sacrificeWasRandomlyChosen = false;
			globalState.hunterEliminatedId = null; // Reset hunter state
			globalState.hunterTargetChoice = null;
		});
	},

	async endGame() {
		await kmClient.transact([globalStore], ([globalState]) => {
			globalState.gamePhase = 'game-over';
			globalState.winner = null;
		});
	}
};
