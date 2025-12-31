import { config } from '@/config';
import { kmClient } from '@/services/km-client';
import { playerActions } from '@/state/actions/player-actions';
import { globalStore } from '@/state/stores/global-store';
import { useSnapshot } from '@kokimoki/app';
import * as React from 'react';
import Markdown from 'react-markdown';

export const RoleRevealView: React.FC = () => {
	const { players, roundNumber } = useSnapshot(globalStore.proxy);
	const myRole = players[kmClient.id]?.role;

	// Show new game message on restarts (when round is 1 but role is being re-revealed)
	const isRestart = roundNumber === 1;

	const getRoleConfig = () => {
		switch (myRole) {
			case 'cultist':
				return {
					name: config.cultistRoleName,
					description: config.cultistRoleDescriptionMd,
					bgColor: 'bg-red-900',
					textColor: 'text-red-50'
				};
			case 'villager':
				return {
					name: config.villagerRoleName,
					description: config.villagerRoleDescriptionMd,
					bgColor: 'bg-blue-900',
					textColor: 'text-blue-50'
				};
			case 'idiot':
				return {
					name: config.idiotRoleName,
					description: config.idiotRoleDescriptionMd,
					bgColor: 'bg-purple-900',
					textColor: 'text-purple-50'
				};
			case 'medium':
				return {
					name: config.mediumRoleName,
					description: config.mediumRoleDescriptionMd,
					bgColor: 'bg-indigo-900',
					textColor: 'text-indigo-50'
				};
			case 'hunter':
				return {
					name: config.hunterRoleName,
					description: config.hunterRoleDescriptionMd,
					bgColor: 'bg-green-900',
					textColor: 'text-green-50'
				};
			default:
				return {
					name: 'Unknown',
					description: 'Role not assigned',
					bgColor: 'bg-slate-900',
					textColor: 'text-slate-50'
				};
		}
	};

	const roleConfig = getRoleConfig();

	const handleContinue = async () => {
		await playerActions.markRoleSeen();
		await playerActions.setCurrentView('night');
	};

	return (
		<div className="w-full space-y-8">
			{isRestart && (
				<div className="rounded-xl bg-cult-red-bright border border-cult-red-bright p-4 text-center shadow-lg">
					<p className="text-xl font-semibold text-white">{config.newGameMessage}</p>
				</div>
			)}
			
			{isRestart && (
				<div className="rounded-2xl overflow-hidden border border-cult-red/30">
					<img 
						src="/nightVillage.jpg" 
						alt="Night Village" 
						className="w-full h-48 object-cover"
					/>
				</div>
			)}
			
			<h1 className="text-center text-3xl font-bold text-slate-100">{config.roleRevealTitle}</h1>
			
			<div className={`rounded-2xl p-8 ${roleConfig.bgColor} ${roleConfig.textColor} shadow-lg`}>
				<h2 className="mb-4 text-center text-4xl font-bold">{roleConfig.name}</h2>
				<div className="prose prose-invert max-w-none [&_p]:text-current [&_strong]:text-white">
					<Markdown>{roleConfig.description}</Markdown>
				</div>
			</div>

			{myRole !== 'cultist' && (
				<div className="rounded-xl bg-cult-blue border border-cult-red/30 p-6 prose prose-sm max-w-none">
					<Markdown>{config.villagerTeamGoalMd}</Markdown>
				</div>
			)}

			<button
				type="button"
				className="km-btn-primary w-full"
				onClick={handleContinue}
			>
				{config.continueButton}
			</button>
		</div>
	);
};
