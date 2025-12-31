import { z } from '@kokimoki/kit';

export const schema = z.object({
	// translations
	title: z.string().default('Cultist'),

	// Lobby
	gameLobbyMd: z
		.string()
		.default('# Waiting for game to start...\nThe game will start once the host presses the start button.'),
	
	// Roles
	cultistRoleName: z.string().default('Cultist'),
	villagerRoleName: z.string().default('Simple Villager'),
	idiotRoleName: z.string().default('Village Idiot'),
	mediumRoleName: z.string().default('Medium'),
	hunterRoleName: z.string().default('Hunter'),
	
	cultistRoleDescriptionMd: z.string().default('You are a **Cultist**. Vote to sacrifice villagers at night. You know your fellow cultists.'),
	villagerRoleDescriptionMd: z.string().default('You are a **Simple Villager**. Vote to execute suspects during the day. Find the cultists!'),
	idiotRoleDescriptionMd: z.string().default('You are the **Village Idiot**. You can be sacrificed at night, but cannot be executed during the day.'),
	mediumRoleDescriptionMd: z.string().default('You are the **Medium**. Each night, you can investigate one player to learn their role. Use this knowledge to help the villagers!'),
	hunterRoleDescriptionMd: z.string().default('You are the **Hunter**. If you are eliminated (sacrificed or executed), you must choose one player to eliminate with you.'),
	
	roleRevealTitle: z.string().default('Your Role'),
	newGameMessage: z.string().default('A new game starts. You get a new role!'),
	villagerTeamGoalMd: z.string().default('**Your Mission:** Work with the villagers to identify and execute all cultists during the day phase before they sacrifice the entire village.'),
	continueButton: z.string().default('Continue'),
	
	// Hunter
	hunterEliminatedTitle: z.string().default('You have been eliminated!'),
	hunterChooseTarget: z.string().default('As the Hunter, choose one player to eliminate with you:'),
	hunterTargetButton: z.string().default('Eliminate'),
	hunterChoiceConfirmed: z.string().default('Target eliminated'),
	hunterTargetEliminated: z.string().default('{name} has been eliminated by the Hunter'),
	hunterYouWereEliminated: z.string().default('You were eliminated by the Hunter'),
	
	// Night Phase
	nightPhaseTitle: z.string().default('Night Falls'),
	nightPhaseCultistInstructions: z.string().default('Vote to sacrifice a villager'),
	nightPhaseVillagerWait: z.string().default('Wait while cultists make their choice...'),
	nightPhaseSilenceMessage: z.string().default('The village sleeps. Remain silent until dawn breaks.'),
	nightPhaseMediumInstructions: z.string().default('Investigate a player to learn their role'),
	mediumInvestigationResult: z.string().default('{name} is a {role}'),
	mediumInvestigationRecorded: z.string().default('🔮 Your medium power reveals the truth...'),
	yourVote: z.string().default('Your Vote:'),
	voteButton: z.string().default('Vote'),
	changeVoteButton: z.string().default('Change Vote'),
	voteRecorded: z.string().default('✓ Vote Recorded'),
	cultistsAgreeWarning: z.string().default('Agree on one person!!'),
	sacrificeRandomMessage: z.string().default('The votes were tied. The victim was chosen randomly.'),
	
	// Day Phase
	dayPhaseTitle: z.string().default('Day Breaks'),
	lastNightSacrifice: z.string().default('Last night, {name} was sacrificed. They were a {role}.'),
	noSacrificeLastNight: z.string().default('Nobody was sacrificed last night.'),
	voteToExecute: z.string().default('Vote to Execute'),
	validateVoteButton: z.string().default('Validate Vote'),
	voteValidated: z.string().default('✓ Vote Validated'),
	youAreDead: z.string().default('You were sacrificed'),
	deadPlayerMessage: z.string().default('You can\'t talk to other players. Please wait until the end of the game'),
	
	lastDayExecution: z.string().default('Yesterday, {name} was executed. They were a {role}.'),
	lastDayExecutionTie: z.string().default('Yesterday ended in a tie. Nobody was executed.'),
	lastDayIdiotRevealed: z.string().default('Yesterday, the village tried to execute {name}, but they are the Village Idiot and survived!'),
	noExecutionYesterday: z.string().default('Nobody was executed yesterday.'),
	
	// Game Over
	gameOverTitle: z.string().default('Game Over'),
	cultistsWin: z.string().default('Cultists Win!'),
	villagersWin: z.string().default('Villagers Win!'),
	theCultistsWere: z.string().default('The cultists were:'),
	
	// Cultist thresholds
	oneCultistsMaxPlayers: z.number().int().min(4).default(7),
	twoCultistsMaxPlayers: z.number().int().min(5).default(11),
	threeCultistsMaxPlayers: z.number().int().min(6).default(18),
	
	// Host Controls
	players: z.string().default('Players Connected'),
	online: z.string().default('Online'),
	offline: z.string().default('Offline'),
	startButton: z.string().default('Start Game'),
	restartButton: z.string().default('Restart Game'),
	resetPlayersButton: z.string().default('Reset Players'),
	loading: z.string().default('Loading...'),
	
	hostNightPhaseTitle: z.string().default('Night Phase - Round {round}'),
	hostDayPhaseTitle: z.string().default('Day Phase - Round {round}'),
	cultistVotes: z.string().default('Cultist Votes:'),
	cultistsDecided: z.string().default('Cultists have decided'),
	validateVotesButton: z.string().default('Validate Votes'),
	startDayPhaseButton: z.string().default('Start Day Phase'),
	startNightPhaseButton: z.string().default('Start Night Phase'),
	validateAllVotesButton: z.string().default('Validate All Votes'),
	
	playerLinkLabel: z.string().default('Player Link'),
	presenterLinkLabel: z.string().default('Presenter Link'),
	togglePresenterQrButton: z.string().default('Toggle Presenter QR'),
	endGameButton: z.string().default('End Game'),
	newRitualButton: z.string().default('New Ritual'),
	dismissParticipantsButton: z.string().default('Dismiss Participants'),
	gameEndedNoWinner: z.string().default('Game Ended - No Winner'),
	allPlayerRoles: z.string().default('All Player Roles'),
	
	// Menu
	menuHelpMd: z.string().default('# Help\nInstructions on how to play the game.'),
	menuAriaLabel: z.string().default('Open menu drawer'),
	menuHelpAriaLabel: z.string().default('Open help drawer'),
	
	// Create Profile
	createProfileMd: z.string().default('# Create your player profile'),
	playerNamePlaceholder: z.string().default('Your name...'),
	playerNameLabel: z.string().default('Name:'),
	playerNameButton: z.string().default('Continue'),
	
	// Waiting for game
	waitingForGameMd: z.string().default('# The ritual has already begun\\n\\nPlease wait for the current ritual to conclude before joining the congregation.')
}).refine(
	(data) => {
		if (data.oneCultistsMaxPlayers >= data.twoCultistsMaxPlayers) {
			return false;
		}
		if (data.twoCultistsMaxPlayers >= data.threeCultistsMaxPlayers) {
			return false;
		}
		return true;
	},
	{
		message: 'Cultist thresholds must be strictly increasing: oneCultistsMaxPlayers < twoCultistsMaxPlayers < threeCultistsMaxPlayers'
	}
);

export type Config = z.infer<typeof schema>;
