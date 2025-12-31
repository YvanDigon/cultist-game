import { kmClient } from '@/services/km-client';

export interface PlayerState {
	name: string;
	currentView: 'lobby' | 'role-reveal' | 'night' | 'day' | 'game-over';
	roleSeen: boolean;
}

const initialState: PlayerState = {
	name: '',
	currentView: 'lobby',
	roleSeen: false
};

export const playerStore = kmClient.localStore<PlayerState>(
	'player',
	initialState
);
