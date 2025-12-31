import { config } from '@/config';
import { kmClient } from '@/services/km-client';
import { globalStore } from '@/state/stores/global-store';
import { useSnapshot } from '@kokimoki/app';
import { useKmModal } from '@kokimoki/shared';
import * as React from 'react';
import Markdown from 'react-markdown';

export const RoleButton: React.FC = () => {
	const { players } = useSnapshot(globalStore.proxy);
	const myRole = players[kmClient.id]?.role;
	const { openDialog } = useKmModal();

	const getRoleConfig = () => {
		switch (myRole) {
			case 'cultist':
				return {
					emoji: '🔥',
					name: config.cultistRoleName,
					description: config.cultistRoleDescriptionMd,
					bgColor: 'bg-red-900',
					textColor: 'text-red-50'
				};
			case 'villager':
				return {
					emoji: '👤',
					name: config.villagerRoleName,
					description: config.villagerRoleDescriptionMd,
					bgColor: 'bg-blue-900',
					textColor: 'text-blue-50'
				};
			case 'idiot':
				return {
					emoji: '🤪',
					name: config.idiotRoleName,
					description: config.idiotRoleDescriptionMd,
					bgColor: 'bg-purple-900',
					textColor: 'text-purple-50'
				};
			case 'medium':
				return {
					emoji: '🔮',
					name: config.mediumRoleName,
					description: config.mediumRoleDescriptionMd,
					bgColor: 'bg-indigo-900',
					textColor: 'text-indigo-50'
				};
			case 'hunter':
				return {
					emoji: '🏹',
					name: config.hunterRoleName,
					description: config.hunterRoleDescriptionMd,
					bgColor: 'bg-green-900',
					textColor: 'text-green-50'
				};
			default:
				return null;
		}
	};

	const roleConfig = getRoleConfig();

	if (!roleConfig) {
		return null;
	}

	const handleClick = () => {
		openDialog({
			title: config.roleRevealTitle,
			content: (
				<div className={`rounded-2xl p-6 ${roleConfig.bgColor} ${roleConfig.textColor}`}>
					<h2 className="mb-4 text-center text-3xl font-bold">
						{roleConfig.emoji} {roleConfig.name}
					</h2>
					<div className="prose prose-invert max-w-none [&_p]:text-current [&_strong]:text-white">
						<Markdown>{roleConfig.description}</Markdown>
					</div>
				</div>
			),
			closable: true
		});
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			className="inline-flex items-center gap-2 rounded-xl border border-cult-red/50 bg-cult-blue px-4 py-2 text-base font-semibold text-slate-100 shadow-sm transition-all hover:border-cult-red-bright hover:bg-cult-blue-light hover:shadow-md active:scale-95"
		>
			<span className="text-xl">{roleConfig.emoji}</span>
			<span>{roleConfig.name}</span>
		</button>
	);
};
