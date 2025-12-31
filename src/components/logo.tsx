import { config } from '@/config';
import { cn } from '@/utils/cn';
import * as React from 'react';
import logoImg from '/logo.svg';

/**
 * Logo example using an image assets
 * Replace logo in `public/logo.svg` or update the src as needed
 *
 * This example is **optional** and can be removed if not needed
 */
export const Logo: React.FC<{ className?: string }> = ({ className }) => (
	<img
		src={logoImg}
		alt={config.title}
		title={config.title}
		className={cn('h-9', className)}
	/>
);
