import { config } from '@/config';
import { globalActions } from '@/state/actions/global-actions';
import { globalStore, type NarrationTone, type NarrationLength } from '@/state/stores/global-store';
import { useSnapshot } from '@kokimoki/app';
import { Sparkles, X } from 'lucide-react';
import * as React from 'react';

interface NarrationSettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
	onStartGame: () => void;
}

export const NarrationSettingsModal: React.FC<NarrationSettingsModalProps> = ({
	isOpen,
	onClose,
	onStartGame
}) => {
	const { narrationSettings } = useSnapshot(globalStore.proxy);
	const [villageName, setVillageName] = React.useState(narrationSettings.villageName || '');
	const [cultName, setCultName] = React.useState(narrationSettings.cultName || '');
	const [tone, setTone] = React.useState<NarrationTone>(narrationSettings.tone || 'dark');
	const [length, setLength] = React.useState<NarrationLength>(narrationSettings.length || 'short');
	const [language, setLanguage] = React.useState(narrationSettings.language || 'English');
	const [enableNarration, setEnableNarration] = React.useState(narrationSettings.enabled);

	// Sync local state when global settings change
	React.useEffect(() => {
		setVillageName(narrationSettings.villageName || '');
		setCultName(narrationSettings.cultName || '');
		setTone(narrationSettings.tone || 'dark');
		setLength(narrationSettings.length || 'short');
		setLanguage(narrationSettings.language || 'English');
		setEnableNarration(narrationSettings.enabled);
	}, [narrationSettings]);

	if (!isOpen) {
		return null;
	}

	const handleStartWithNarration = async () => {
		await globalActions.setNarrationSettings({
			villageName,
			cultName,
			tone,
			length,
			language,
			enabled: true
		});
		onStartGame();
	};

	const handleStartWithoutNarration = async () => {
		await globalActions.setNarrationSettings({
			villageName: '',
			cultName: '',
			tone: 'dark',
			length: 'short',
			language: 'English',
			enabled: false
		});
		onStartGame();
	};

	const toneOptions: { value: NarrationTone; label: string }[] = [
		{ value: 'dark', label: config.narrationToneDark },
		{ value: 'humorous', label: config.narrationToneHumorous },
		{ value: 'neutral', label: config.narrationToneNeutral }
	];

	const lengthOptions: { value: NarrationLength; label: string }[] = [
		{ value: 'short', label: config.narrationLengthShort },
		{ value: 'long', label: config.narrationLengthLong }
	];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div 
				className="absolute inset-0 bg-cult-dark/90 backdrop-blur-sm"
				onClick={onClose}
			/>
			
			{/* Modal */}
			<div className="relative w-full max-w-lg mx-4 bg-cult-blue border border-cult-red/30 rounded-2xl shadow-2xl">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-cult-red/20">
					<div className="flex items-center gap-3">
						<Sparkles className="size-6 text-cult-red-bright" />
						<h2 className="text-xl font-bold text-slate-100">{config.narrationSettingsTitle}</h2>
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
				<div className="p-6 space-y-6">
					<p className="text-slate-300 text-sm">{config.narrationSettingsDescription}</p>

					{/* Enable Toggle */}
					<label className="flex items-center gap-3 cursor-pointer">
						<input
							type="checkbox"
							checked={enableNarration}
							onChange={(e) => setEnableNarration(e.target.checked)}
							className="w-5 h-5 rounded border-cult-red/30 bg-cult-dark text-cult-red-bright focus:ring-cult-red focus:ring-offset-cult-dark"
						/>
						<span className="text-slate-100 font-medium">{config.enableNarrationLabel}</span>
					</label>

					{enableNarration && (
						<div className="space-y-4 pt-2">
							{/* Village Name */}
							<div>
								<label className="block text-sm font-medium text-slate-300 mb-2">
									{config.villageNameLabel}
								</label>
								<input
									type="text"
									value={villageName}
									onChange={(e) => setVillageName(e.target.value)}
									placeholder={config.villageNamePlaceholder}
									className="km-input w-full"
								/>
							</div>

							{/* Cult Name */}
							<div>
								<label className="block text-sm font-medium text-slate-300 mb-2">
									{config.cultNameLabel}
								</label>
								<input
									type="text"
									value={cultName}
									onChange={(e) => setCultName(e.target.value)}
									placeholder={config.cultNamePlaceholder}
									className="km-input w-full"
								/>
							</div>

							{/* Tone Selection */}
							<div>
								<label className="block text-sm font-medium text-slate-300 mb-2">
									{config.narrationToneLabel}
								</label>
								<div className="flex gap-2">
									{toneOptions.map((option) => (
										<button
											key={option.value}
											type="button"
											onClick={() => setTone(option.value)}
											className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
												tone === option.value
													? 'bg-cult-red text-white'
													: 'bg-cult-dark text-slate-300 hover:bg-cult-blue-light border border-cult-red/20'
											}`}
										>
											{option.label}
										</button>
									))}
								</div>
							</div>

							{/* Length Selection */}
							<div>
								<label className="block text-sm font-medium text-slate-300 mb-2">
									{config.narrationLengthLabel}
								</label>
								<div className="flex gap-2">
									{lengthOptions.map((option) => (
										<button
											key={option.value}
											type="button"
											onClick={() => setLength(option.value)}
											className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
												length === option.value
													? 'bg-cult-red text-white'
													: 'bg-cult-dark text-slate-300 hover:bg-cult-blue-light border border-cult-red/20'
											}`}
										>
											{option.label}
										</button>
									))}
								</div>
							</div>

							{/* Language */}
							<div>
								<label className="block text-sm font-medium text-slate-300 mb-2">
									{config.narrationLanguageLabel}
								</label>
								<input
									type="text"
									value={language}
									onChange={(e) => setLanguage(e.target.value)}
									placeholder="English"
									className="km-input w-full"
								/>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex gap-3 p-6 border-t border-cult-red/20">
					{enableNarration ? (
						<button
							type="button"
							onClick={handleStartWithNarration}
							className="flex-1 km-btn-primary"
						>
							<Sparkles className="size-5" />
							{config.startWithNarrationButton}
						</button>
					) : (
						<button
							type="button"
							onClick={handleStartWithoutNarration}
							className="flex-1 km-btn-primary"
						>
							{config.startWithoutNarrationButton}
						</button>
					)}
				</div>
			</div>
		</div>
	);
};
