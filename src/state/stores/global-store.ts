import { kmClient } from '@/services/km-client';

export type Role = 'cultist' | 'villager' | 'idiot' | 'medium' | 'hunter';
export type GamePhase = 'lobby' | 'night' | 'day' | 'game-over';

export interface DayVote {
	voterId: string;
	targetId: string;
	validated: boolean;
}

export type NarrationTone = 'dark' | 'humorous' | 'neutral';
export type NarrationLength = 'short' | 'long';

export interface NarrationSettings {
	villageName: string;
	cultName: string;
	tone: NarrationTone;
	length: NarrationLength;
	language: string;
	enabled: boolean;
}

export interface PhaseNarration {
	text: string;
	regenerated: boolean;
	isGenerating: boolean;
}

export interface GlobalState {
	controllerConnectionId: string;
	started: boolean;
	startTimestamp: number;
	gamePhase: GamePhase;
	roundNumber: number;
	players: Record<string, { name: string; role?: Role; isAlive: boolean }>;
	
	// Night phase
	nightVotes: Record<string, string>; // cultistId -> targetId
	nightVotesValidated: boolean;
	lastSacrificeTargetId: string | null;
	lastSacrificeSuccess: boolean;
	sacrificeWasRandomlyChosen: boolean;
	
	// Medium investigations
	mediumInvestigations: Record<string, string>; // mediumId -> targetId (for current night)
	mediumKnowledge: Record<string, Record<string, Role>>; // mediumId -> { targetId: role }
	
	// Day phase
	dayVotes: DayVote[];
	lastExecutedId: string | null;
	lastExecutionAttemptedId: string | 'tie' | null;
	idiotRevealed: boolean;
	
	// Hunter elimination
	hunterEliminatedId: string | null; // Hunter who was just eliminated
	hunterTargetChoice: string | null; // Hunter's chosen target to eliminate
	
	endedByHost: boolean;
	winner: 'cultists' | 'villagers' | null;
	
	// Narration
	narrationSettings: NarrationSettings;
	phaseNarrations: Record<string, PhaseNarration>; // keyed by "night-1", "day-1", "game-over", etc.
}

const initialState: GlobalState = {
	controllerConnectionId: '',
	started: false,
	startTimestamp: 0,
	gamePhase: 'lobby',
	roundNumber: 0,
	players: {},
	nightVotes: {},
	nightVotesValidated: false,
	lastSacrificeTargetId: null,
	lastSacrificeSuccess: false,
	sacrificeWasRandomlyChosen: false,
	mediumInvestigations: {},
	mediumKnowledge: {},
	dayVotes: [],
	lastExecutedId: null,
	lastExecutionAttemptedId: null,
	idiotRevealed: false,
	hunterEliminatedId: null,
	hunterTargetChoice: null,
	endedByHost: false,
	winner: null,
	narrationSettings: {
		villageName: '',
		cultName: '',
		tone: 'dark',
		length: 'short',
		language: 'English',
		enabled: false
	},
	phaseNarrations: {}
};

export const globalStore = kmClient.store<GlobalState>('global', initialState);
