import { config } from '@/config';
import { globalActions } from '@/state/actions/global-actions';
import { globalStore } from '@/state/stores/global-store';
import { useSnapshot } from '@kokimoki/app';
import { RefreshCw, Sparkles, X, Loader2 } from 'lucide-react';
import * as React from 'react';

interface NarrationDrawerProps {
	isOpen: boolean;
	onClose: () => void;
}

export const NarrationDrawer: React.FC<NarrationDrawerProps> = ({
	isOpen,
	onClose
}) => {
	const { gamePhase, roundNumber, narrationSettings, phaseNarrations } = useSnapshot(globalStore.proxy);

	// Generate phase key
	const getPhaseKey = () => {
		if (gamePhase === 'game-over') {
			return 'game-over';
		}
		return `${gamePhase}-${roundNumber}`;
	};

	const phaseKey = getPhaseKey();
	const currentNarration = phaseNarrations[phaseKey];
	const isGenerating = currentNarration?.isGenerating || false;
	const canRegenerate = currentNarration && !currentNarration.regenerated && !isGenerating;

	// Auto-generate narration when phase changes
	React.useEffect(() => {
		if (narrationSettings.enabled && gamePhase !== 'lobby' && !currentNarration) {
			globalActions.generatePhaseNarration(phaseKey);
		}
	}, [phaseKey, narrationSettings.enabled, gamePhase, currentNarration]);

	const handleRegenerate = () => {
		if (canRegenerate) {
			globalActions.generatePhaseNarration(phaseKey, true);
		}
	};

	const getPhaseTitle = () => {
		if (gamePhase === 'game-over') {
			return config.gameOverTitle;
		}
		if (gamePhase === 'night') {
			return config.hostNightPhaseTitle.replace('{round}', roundNumber.toString());
		}
		if (gamePhase === 'day') {
			return config.hostDayPhaseTitle.replace('{round}', roundNumber.toString());
		}
		return '';
	};

	if (!isOpen) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
			{/* Backdrop */}
			<div 
				className="absolute inset-0 bg-cult-dark/90 backdrop-blur-sm"
				onClick={onClose}
			/>
			
			{/* Drawer */}
			<div className="relative w-full max-w-2xl mx-4 mb-4 sm:mb-0 bg-cult-blue border border-cult-red/30 rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-cult-red/20 shrink-0">
					<div className="flex items-center gap-3">
						<Sparkles className="size-6 text-cult-red-bright" />
						<div>
							<h2 className="text-xl font-bold text-slate-100">{config.narrationDrawerTitle}</h2>
							<p className="text-sm text-slate-400">{getPhaseTitle()}</p>
						</div>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-2 rounded-lg hover:bg-cult-dark transition-colors"
					>
						<X className="size-5 text-slate-400" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 overflow-y-auto flex-1">
					{!narrationSettings.enabled ? (
						<div className="text-center py-8">
							<p className="text-slate-400">{config.narrationDisabledMessage}</p>
						</div>
					) : isGenerating ? (
						<div className="flex flex-col items-center justify-center py-12 gap-4">
							<Loader2 className="size-8 text-cult-red-bright animate-spin" />
							<p className="text-slate-300">{config.generatingNarrationMessage}</p>
						</div>
					) : currentNarration?.text ? (
						<div className="prose prose-lg max-w-none">
							<div className="text-slate-100 text-lg leading-relaxed whitespace-pre-wrap">
								{currentNarration.text}
							</div>
						</div>
					) : (
						<div className="text-center py-8">
							<p className="text-slate-400">{config.noNarrationMessage}</p>
							<button
								type="button"
								onClick={() => globalActions.generatePhaseNarration(phaseKey)}
								className="mt-4 km-btn-primary"
							>
								<Sparkles className="size-5" />
								{config.generateNarrationButton}
							</button>
						</div>
					)}
				</div>

				{/* Footer */}
				{narrationSettings.enabled && currentNarration?.text && !isGenerating && (
					<div className="flex gap-3 p-6 border-t border-cult-red/20 shrink-0">
						<button
							type="button"
							onClick={handleRegenerate}
							disabled={!canRegenerate}
							className="km-btn-secondary"
						>
							<RefreshCw className="size-5" />
							{config.regenerateNarrationButton}
							{currentNarration.regenerated && (
								<span className="text-xs text-slate-500">({config.regenerationUsedLabel})</span>
							)}
						</button>
					</div>
				)}
			</div>
		</div>
	);
};
