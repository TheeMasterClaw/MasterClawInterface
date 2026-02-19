import { create } from 'zustand';

export const useUIStore = create((set) => ({
    // Theme
    theme: 'dark',
    setTheme: (theme) => set({ theme }),

    // Connection Status
    connectionStatus: 'connecting',
    setConnectionStatus: (status) => set({ connectionStatus: status }),

    // Overlays State
    overlays: {
        settings: false,
        health: false,
        calendar: false,
        tasks: false,
        quickLinks: false,
        activityLog: false,
        focusTimer: false,
        weather: false,
        habitTracker: false,
        dailyQuote: false,
        timeTracker: false,
        moodTracker: false,
        breathing: false,
        productivity: false,
        notes: false,
        journal: false,
        water: false,
        quest: false,
        snippets: false,
        knowledge: false,
        goal: false,
        system: false,
        whiteboard: false,
        gratitude: false,
        reading: false,
        ambient: false,
        skills: false,
        weekly: false,
        decision: false,
        ideas: false,
        meeting: false,
        briefing: false,
        projects: false,
        workout: false,
        sleep: false,
        expenses: false,
        energy: false,
        subscriptions: false,
        vision: false,
        vault: false,
        balance: false,
        network: false,
        deepWork: false,
        dailyWins: false,
        travel: false,
        prompts: false,
        content: false,
        meals: false,
        study: false,
        voice: false,
        capsule: false,
        priority: false,
        detox: false,
        taskBoard: false,
        roulette: false,
        quickCapture: false,
        code: false,
        inspiration: false,
        learning: false,
        reminders: false,
        history: false,
        reflection: false,
        mindful: false,
        achievements: false,
        challenges: false,
        brainDump: false,
        sprint: false,
        resources: false,
        commandPalette: false,
        help: false,
        adminDebug: false,
    },

    // Actions to toggle overlays
    toggleOverlay: (name) => set((state) => ({
        overlays: { ...state.overlays, [name]: !state.overlays[name] }
    })),

    openOverlay: (name) => set((state) => ({
        overlays: { ...state.overlays, [name]: true }
    })),

    closeOverlay: (name) => set((state) => ({
        overlays: { ...state.overlays, [name]: false }
    })),

    closeAllOverlays: () => set((state) => {
        const closed = Object.keys(state.overlays).reduce((acc, key) => {
            acc[key] = false;
            return acc;
        }, {});
        return { overlays: closed };
    })
}));
