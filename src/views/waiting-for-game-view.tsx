import { config } from '@/config';
import * as React from 'react';
import Markdown from 'react-markdown';

export const WaitingForGameView: React.FC = () => {
	return (
		<div className="w-full space-y-8">
			{/* Background Image */}
			<div className="relative h-64 rounded-2xl overflow-hidden">
				<img 
					src="/dayVillage.jpg" 
					alt="Village" 
					className="w-full h-full object-cover opacity-60"
				/>
				<div className="absolute inset-0 bg-gradient-to-b from-cult-dark/40 via-cult-dark/70 to-cult-dark" />
			</div>

			{/* Waiting Message */}
			<div className="prose prose-invert max-w-none text-center">
				<Markdown>{config.waitingForGameMd}</Markdown>
			</div>
		</div>
	);
};
