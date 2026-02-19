'use client';

import { useEffect } from 'react';
import { useUIStore } from '../lib/store';

export default function GlobalShortcuts() {
    const { toggleOverlay, closeAllOverlays, overlays } = useUIStore();
    const showSettings = overlays.settings;
    const showHelp = overlays.help;

    useEffect(() => {
        const handleKeyDown = (e) => {
            // Meta/Ctrl + . -> Settings
            if ((e.metaKey || e.ctrlKey) && e.key === '.') {
                e.preventDefault();
                toggleOverlay('settings');
            }

            // Meta/Ctrl + / -> Help
            if ((e.metaKey || e.ctrlKey) && e.key === '/') {
                e.preventDefault();
                toggleOverlay('help');
            }

            // Escape -> Close All Overlays
            if (e.key === 'Escape') {
                closeAllOverlays();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleOverlay, closeAllOverlays]);

    return null;
}
