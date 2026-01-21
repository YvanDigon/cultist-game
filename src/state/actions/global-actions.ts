import { kmClient } from '@/services/km-client';
import { globalStore, type Role, type NarrationTone, type NarrationLength } from '../stores/global-store';
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
			globalState.endedByHost = false;
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
			globalState.endedByHost = false;
			globalState.winner = null;
			globalState.phaseNarrations = {};
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
			globalState.endedByHost = false;
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
				// Reset hunter carry-over; will be set again if a hunter is sacrificed this night
				globalState.hunterEliminatedId = null;
				globalState.hunterTargetChoice = null;

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
			console.log('[SUBMIT DAY VOTE] Player:', kmClient.id, 'voting for:', targetId);
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
			console.log('[SUBMIT DAY VOTE] Total votes after submission:', globalState.dayVotes.length);
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
			console.log('[VALIDATE ALL VOTES] Votes before validation:', globalState.dayVotes.length);
			console.log('[VALIDATE ALL VOTES] Votes:', globalState.dayVotes.map(v => ({ voterId: v.voterId, targetId: v.targetId, validated: v.validated })));
			globalState.dayVotes.forEach((vote) => {
				vote.validated = true;
			});
			console.log('[VALIDATE ALL VOTES] All votes validated');
		});
	},

	async startNightPhase() {
		await kmClient.transact([globalStore], ([globalState]) => {
			// Normalize hunter fields for older sessions that may lack these keys
			if (globalState.hunterEliminatedId === undefined) {
				globalState.hunterEliminatedId = null;
			}
			if (globalState.hunterTargetChoice === undefined) {
				globalState.hunterTargetChoice = null;
			}

			console.log('[START NIGHT PHASE] Beginning night phase transition');
			console.log('[START NIGHT PHASE] Day votes at start:', globalState.dayVotes.length);
			console.log('[START NIGHT PHASE] Votes:', globalState.dayVotes.map(v => ({ voterId: v.voterId, targetId: v.targetId, validated: v.validated })));
			console.log('[START NIGHT PHASE] Hunter eliminated ID:', globalState.hunterEliminatedId);
			console.log('[START NIGHT PHASE] Hunter target choice:', globalState.hunterTargetChoice);
			
			// If hunter was eliminated and made their choice, just proceed to night phase
			if (
				globalState.hunterEliminatedId !== null &&
				globalState.hunterTargetChoice !== null
			) {
				console.log('[START NIGHT PHASE] Taking hunter early-return path');
				// Check win conditions after hunter's choice
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

				// Proceed to night phase
				globalState.roundNumber += 1;
				globalState.gamePhase = 'night';
				globalState.nightVotes = {};
				globalState.nightVotesValidated = false;
				globalState.sacrificeWasRandomlyChosen = false;
				globalState.hunterEliminatedId = null;
				globalState.hunterTargetChoice = null;
				return;
			}

			console.log('[START NIGHT PHASE] Proceeding to vote counting (hunter check passed)');

			// Count validated votes
			const voteCounts: Record<string, number> = {};
			// Prefer validated votes; if none are validated but exactly one vote exists,
			// treat that single vote as the effective vote.
			const validatedVotes = globalState.dayVotes.filter((v) => v.validated);
			const effectiveVotes =
				validatedVotes.length > 0
					? validatedVotes
					: globalState.dayVotes.length === 1
						? globalState.dayVotes
						: [];

			console.log('[DAY EXECUTION] Effective votes:', effectiveVotes.map(v => ({ voterId: v.voterId, targetId: v.targetId, validated: v.validated })));

			effectiveVotes.forEach((vote) => {
				voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
			});

		console.log('[DAY EXECUTION] Total votes:', globalState.dayVotes.length);
		console.log('[DAY EXECUTION] Validated votes:', globalState.dayVotes.filter(v => v.validated).length);
		console.log('[DAY EXECUTION] Vote counts:', voteCounts);

		// Find target with most votes
			let maxVotes = 0;
			let executionTargetId: string | null = null;
			const tieCandidates: string[] = [];

			// Explicitly handle single effective vote to avoid edge cases
			if (effectiveVotes.length === 1) {
				executionTargetId = effectiveVotes[0].targetId;
				maxVotes = 1;
				tieCandidates.length = 0;
				tieCandidates.push(executionTargetId);
			}

			Object.entries(voteCounts).forEach(([targetId, count]) => {
				if (count > maxVotes) {
					maxVotes = count;
					executionTargetId = targetId;
					tieCandidates.length = 0;
					tieCandidates.push(targetId);
				} else if (count === maxVotes && count > 0 && executionTargetId !== targetId) {
					// Only add distinct candidates to tie list
					tieCandidates.push(targetId);
				}
			});

			console.log('[DAY EXECUTION] Max votes:', maxVotes);
			console.log('[DAY EXECUTION] Execution target:', executionTargetId);
			console.log('[DAY EXECUTION] Tie candidates:', tieCandidates);
			console.log('[DAY EXECUTION] Target exists in players?', executionTargetId ? !!globalState.players[executionTargetId] : 'N/A');

			// Robust fallback: if no max votes registered but exactly one raw vote exists, execute that target
			if (maxVotes === 0 && globalState.dayVotes.length === 1) {
				const fallbackTarget = globalState.dayVotes[0].targetId;
				console.log('[DAY EXECUTION] Fallback to single raw vote:', fallbackTarget);
				executionTargetId = fallbackTarget;
				maxVotes = 1;
				tieCandidates.length = 0;
				tieCandidates.push(fallbackTarget);
			}
		console.log('[DAY EXECUTION] All players:', Object.keys(globalState.players));

		// Process execution based on vote results
		if (maxVotes === 0) {
			// No votes cast or validated
			console.log('[DAY EXECUTION] No votes - skipping execution');
			globalState.lastExecutionAttemptedId = null;
			globalState.lastExecutedId = null;
		} else if (tieCandidates.length > 1) {
			// Tie - multiple players with same highest vote count
			console.log('[DAY EXECUTION] Tie detected');
			globalState.lastExecutionAttemptedId = 'tie';
			globalState.lastExecutedId = null;
		} else if (executionTargetId && globalState.players[executionTargetId]) {
			// Single target with most votes - execute them
			console.log('[DAY EXECUTION] Executing player:', executionTargetId, globalState.players[executionTargetId].name);
			globalState.lastExecutionAttemptedId = executionTargetId;
			const target = globalState.players[executionTargetId];

			// Check if target is idiot
			if (target.role === 'idiot') {
				console.log('[DAY EXECUTION] Target is idiot - survives');
				globalState.idiotRevealed = true;
				globalState.lastExecutedId = null; // Idiot survives
			} else {
				console.log('[DAY EXECUTION] Target executed, role:', target.role);
				target.isAlive = false;
				globalState.lastExecutedId = executionTargetId;
				
				// Check if executed player was a hunter
				if (target.role === 'hunter') {
					console.log('[DAY EXECUTION] Hunter executed - waiting for choice');
					globalState.hunterEliminatedId = executionTargetId;
					globalState.hunterTargetChoice = null;
					// Don't transition to night yet - wait for hunter choice
					return;
				}
			}
		} else {
			// Fallback: no valid execution target
			console.log('[DAY EXECUTION] No valid execution target (fallback)');
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
			globalState.endedByHost = true;
			globalState.winner = null;
		});
	},

	async setNarrationSettings(settings: {
		villageName: string;
		cultName: string;
		tone: NarrationTone;
		length: NarrationLength;
		language: string;
		enabled: boolean;
	}) {
		await kmClient.transact([globalStore], ([globalState]) => {
			globalState.narrationSettings = settings;
		});
	},

	async generatePhaseNarration(phaseKey: string, isRegeneration = false) {
		const state = globalStore.proxy;
		
		// Check if narration is enabled
		if (!state.narrationSettings.enabled) {
			return;
		}

		// Check if already generated (and not a regeneration request)
		const existingNarration = state.phaseNarrations[phaseKey];
		if (existingNarration && !isRegeneration) {
			return;
		}

		// Check if already regenerated (can only regenerate once)
		if (existingNarration?.regenerated && isRegeneration) {
			return;
		}

		// Set generating state
		await kmClient.transact([globalStore], ([globalState]) => {
			globalState.phaseNarrations[phaseKey] = {
				text: existingNarration?.text || '',
				regenerated: isRegeneration,
				isGenerating: true
			};
		});

		try {
			const { villageName, cultName, tone, length, language } = state.narrationSettings;
			const { gamePhase, roundNumber, players, lastSacrificeTargetId, lastExecutedId, lastExecutionAttemptedId, idiotRevealed, hunterEliminatedId, hunterTargetChoice, winner, endedByHost } = state;

			// Build context for AI
			const alivePlayers = Object.entries(players).filter(([, p]) => p.isAlive).map(([, p]) => p.name);
			const deadPlayers = Object.entries(players).filter(([, p]) => !p.isAlive).map(([, p]) => p.name);

			// Build event descriptions
			let eventContext = '';
			
			if (gamePhase === 'day' && lastSacrificeTargetId && players[lastSacrificeTargetId]) {
				const victim = players[lastSacrificeTargetId];
				eventContext += `Tonight's victim: ${victim.name} (they were a ${victim.role}).\n`;
			}

			if (gamePhase === 'night' && roundNumber > 1) {
				if (lastExecutedId && players[lastExecutedId]) {
					const executed = players[lastExecutedId];
					eventContext += `Yesterday's execution: ${executed.name} was executed (they were a ${executed.role}).\n`;
				} else if (lastExecutionAttemptedId === 'tie') {
					eventContext += `Yesterday's vote ended in a tie - no one was executed.\n`;
				}
			}

			if (idiotRevealed && lastExecutionAttemptedId && lastExecutionAttemptedId !== 'tie' && players[lastExecutionAttemptedId]?.role === 'idiot') {
				eventContext += `The Village Idiot (${players[lastExecutionAttemptedId].name}) was revealed when the village tried to execute them!\n`;
			}

			if (hunterEliminatedId && hunterTargetChoice && players[hunterEliminatedId] && players[hunterTargetChoice]) {
				eventContext += `The Hunter (${players[hunterEliminatedId].name}) was eliminated and took ${players[hunterTargetChoice].name} with them!\n`;
			}

			if (gamePhase === 'game-over') {
				if (endedByHost) {
					eventContext += `The game was ended by the host.\n`;
				} else if (winner === 'cultists') {
					const cultists = Object.entries(players).filter(([, p]) => p.role === 'cultist').map(([, p]) => p.name);
					eventContext += `The cultists (${cultists.join(', ')}) have won! All villagers have been sacrificed.\n`;
				} else if (winner === 'villagers') {
					const cultists = Object.entries(players).filter(([, p]) => p.role === 'cultist').map(([, p]) => p.name);
					eventContext += `The villagers have won! All cultists (${cultists.join(', ')}) have been eliminated.\n`;
				}
			}

			// Define tone guidance based on config values
			const toneLabel = tone === 'tone1' ? config.narrationTone1 : 
			                  tone === 'tone2' ? config.narrationTone2 : 
			                  config.narrationTone3;
			
			const toneGuide: Record<string, string> = {
				'Humorous': 'Use witty, comedic language with dark humor. Include puns, ironic observations, and absurd situations while maintaining the cult theme.',
				'Dark': 'Use dark, ominous, gothic horror language. Create tension and dread. Reference shadows, whispers, ancient evil, blood rituals.',
				'Neutral': 'Use clear, dramatic narration. Focus on storytelling without excessive darkness or comedy. Professional narrator style.'
			};
			
			const toneGuidance = toneGuide[toneLabel] || toneGuide['Dark'];

			// Define length guidance
			const lengthGuide = {
				short: `Keep the narration SHORT - around ${config.narrationLengthShort} words total. Be concise but impactful.`,
				long: `Write a LONGER narration - around ${config.narrationLengthLong} words total. Add more atmosphere and detail.`
			};

			const systemPrompt = `You are a dramatic narrator for a social deduction game called "Cultist" set in the village of "${villageName || 'the village'}". 
The cult is called "${cultName || 'The Cult'}".

TONE: ${toneGuidance}

LENGTH: ${lengthGuide[length]}

LANGUAGE: Write the narration in ${language}.

READING LEVEL: Write for a 12-year-old audience. Use simple vocabulary, short sentences, and avoid complex words. Make it easy to read aloud and understand.

ROLE-PLAY GUIDELINES:
- Write text meant to be read aloud by a game host
- Use dramatic pauses (indicated by "...")
- Keep sentences short and impactful for verbal delivery
- Include atmospheric descriptions
- Build tension and suspense
- Address the players as "villagers" or "inhabitants of ${villageName}"
- Reference the cult's dark rituals and sinister presence
- Do NOT include stage directions or meta-instructions
- Write ONLY the narration text itself`;

			let userPrompt = '';
			
			if (gamePhase === 'night') {
				userPrompt = `Generate narration for NIGHT ${roundNumber}.

Context:
- Living villagers: ${alivePlayers.join(', ')}
- Those who have fallen: ${deadPlayers.length > 0 ? deadPlayers.join(', ') : 'None yet'}
${eventContext}

Write dramatic narration announcing that night has fallen and the cultists are about to choose their next victim. Create an atmosphere of fear and suspense as the village sleeps.`;
			} else if (gamePhase === 'day') {
				userPrompt = `Generate narration for DAY ${roundNumber}.

Context:
- Living villagers: ${alivePlayers.join(', ')}
- Those who have fallen: ${deadPlayers.length > 0 ? deadPlayers.join(', ') : 'None yet'}
${eventContext}

Write dramatic narration announcing the dawn and revealing what happened during the night. The villagers must now deliberate and vote on who to execute.`;
			} else if (gamePhase === 'game-over') {
				userPrompt = `Generate narration for GAME OVER.

Context:
${eventContext}
- Final survivors: ${alivePlayers.join(', ') || 'None'}
- The fallen: ${deadPlayers.join(', ')}

Write a dramatic conclusion announcing the end of the game and the victory (or lack thereof).`;
			}

			const { content } = await kmClient.ai.chat({
				model: 'gemini-2.5-flash',
				systemPrompt,
				userPrompt,
				temperature: 0.8,
				maxTokens: 800
			});

			// Save the generated narration
			await kmClient.transact([globalStore], ([globalState]) => {
				globalState.phaseNarrations[phaseKey] = {
					text: content,
					regenerated: isRegeneration,
					isGenerating: false
				};
			});
		} catch (error) {
			console.error('Failed to generate narration:', error);
			// Clear generating state on error
			await kmClient.transact([globalStore], ([globalState]) => {
				globalState.phaseNarrations[phaseKey] = {
					text: existingNarration?.text || 'Failed to generate narration. Please try again.',
					regenerated: existingNarration?.regenerated || false,
					isGenerating: false
				};
			});
		}
	}
};
