'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUIStore } from '../lib/store';
import API from '../config';

// Components
import Navbar from './Navbar';
import GlobalShortcuts from './GlobalShortcuts';
import Settings from './Settings';
import HealthMonitor from './HealthMonitor';
import CalendarPanel from './CalendarPanel';
import TaskPanel from './TaskPanel';
import QuickLinksPanel from './QuickLinksPanel';
import ActivityLogPanel from './ActivityLogPanel';
import FocusTimer from './FocusTimer';
import WeatherPanel from './WeatherPanel';
import HabitTracker from './HabitTracker';
import DailyQuote from './DailyQuote';
import TimeTracker from './TimeTracker';
import MoodTracker from './MoodTracker';
import BreathingExercise from './BreathingExercise';
import ProductivityAnalytics from './ProductivityAnalytics';
import NotesPanel from './NotesPanel';
import JournalPanel from './JournalPanel';
import WaterTracker from './WaterTracker';
import QuestLog from './QuestLog';
import SnippetsPanel from './SnippetsPanel';
import KnowledgeGarden from './KnowledgeGarden';
import GoalPlanner from './GoalPlanner';
import SystemMonitor from './SystemMonitor';
import Whiteboard from './Whiteboard';
import GratitudeLog from './GratitudeLog';
import ReadingList from './ReadingList';
import AmbientMixer from './AmbientMixer';
import SkillTracker from './SkillTracker';
import WeeklyReview from './WeeklyReview';
import DecisionJournal from './DecisionJournal';
import IdeaIncubator from './IdeaIncubator';
import MeetingCompanion from './MeetingCompanion';
import DailyBriefing from './DailyBriefing';
import ProjectDashboard from './ProjectDashboard';
import WorkoutTracker from './WorkoutTracker';
import SleepTracker from './SleepTracker';
import ExpenseTracker from './ExpenseTracker';
import EnergyTracker from './EnergyTracker';
import SubscriptionTracker from './SubscriptionTracker';
import VisionBoard from './VisionBoard';
import PasswordVault from './PasswordVault';
import LifeBalanceWheel from './LifeBalanceWheel';
import RelationshipNetwork from './RelationshipNetwork';
import DeepWorkTracker from './DeepWorkTracker';
import DailyWins from './DailyWins';
import TravelPlanner from './TravelPlanner';
import PromptLibrary from './PromptLibrary';
import ContentTracker from './ContentTracker';
import MealTracker from './MealTracker';
import StudyPlanner from './StudyPlanner';
import VoiceMemos from './VoiceMemos';
import TimeCapsule from './TimeCapsule';
import PriorityMatrix from './PriorityMatrix';
import DigitalDetoxTracker from './DigitalDetoxTracker';
import TaskBoard from './TaskBoard';
import ReflectionRoulette from './ReflectionRoulette';
import QuickCapture from './QuickCapture';
import CodePlayground from './CodePlayground';
import InspirationWall from './InspirationWall';
import LearningPath from './LearningPath';
import ReminderManager from './ReminderManager';
import ConversationHistory from './ConversationHistory';
import ReflectionStudio from './ReflectionStudio';
import MindfulMoments from './MindfulMoments';
import AchievementVault from './AchievementVault';
import ChallengeTracker from './ChallengeTracker';
import BrainDump from './BrainDump';
import SprintPlanner from './SprintPlanner';
import ResourceLibrary from './ResourceLibrary';
import AdminDebugPanel from './AdminDebugPanel';
import AgentConnect from './AgentConnect';

// Config
// Config
const isBrowser = typeof window !== 'undefined';

export default function ClientLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const phase = pathname === '/' ? 'welcome' : 'dashboard';

    // Use Zustand store
    const {
        theme, setTheme,
        connectionStatus, setConnectionStatus,
        overlays, toggleOverlay, closeOverlay
    } = useUIStore();

    // Local state for non-shared items
    const [hasGreeted, setHasGreeted] = useState(false);

    // Derived state for code compatibility
    const showSettings = overlays.settings;
    const showHealthMonitor = overlays.health;
    const showQuickLinksPanel = overlays.quickLinks;
    const showActivityLogPanel = overlays.activityLog;
    const showFocusTimer = overlays.focusTimer;
    const showWeatherPanel = overlays.weather;
    const showHabitTracker = overlays.habitTracker;
    const showDailyQuote = overlays.dailyQuote;
    const showTimeTracker = overlays.timeTracker;
    const showMoodTracker = overlays.moodTracker;
    const showBreathingExercise = overlays.breathing;
    const showProductivityAnalytics = overlays.productivity;
    const showNotesPanel = overlays.notes;
    const showJournalPanel = overlays.journal;
    const showWaterTracker = overlays.water;
    const showQuestLog = overlays.quest;
    const showSnippetsPanel = overlays.snippets;
    const showKnowledgeGarden = overlays.knowledge;
    const showGoalPlanner = overlays.goal;
    const showSystemMonitor = overlays.system;
    const showWhiteboard = overlays.whiteboard;
    const showGratitudeLog = overlays.gratitude;
    const showReadingList = overlays.reading;
    const showAmbientMixer = overlays.ambient;
    const showSkillTracker = overlays.skills;
    const showWeeklyReview = overlays.weekly;
    const showDecisionJournal = overlays.decision;
    const showIdeaIncubator = overlays.ideas;
    const showWorkoutTracker = overlays.workout;
    const showSleepTracker = overlays.sleep;
    const showExpenseTracker = overlays.expenses;
    const showEnergyTracker = overlays.energy;
    const showDailyBriefing = overlays.briefing;
    const showMeetingCompanion = overlays.meeting;
    const showProjectDashboard = overlays.projects;
    const showSubscriptionTracker = overlays.subscriptions;
    const showVisionBoard = overlays.vision;
    const showPasswordVault = overlays.vault;
    const showLifeBalanceWheel = overlays.balance;
    const showRelationshipNetwork = overlays.network;
    const showDeepWorkTracker = overlays.deepWork;
    const showDailyWins = overlays.dailyWins;
    const showTravelPlanner = overlays.travel;
    const showPromptLibrary = overlays.prompts;
    const showContentTracker = overlays.content;
    const showMealTracker = overlays.meals;
    const showStudyPlanner = overlays.study;
    const showVoiceMemos = overlays.voice;
    const showTimeCapsule = overlays.capsule;
    const showPriorityMatrix = overlays.priority;
    const showDigitalDetoxTracker = overlays.detox;
    const showTaskBoard = overlays.taskBoard;
    const showReflectionRoulette = overlays.roulette;
    const showQuickCapture = overlays.quickCapture;
    const showCodePlayground = overlays.code;
    const showInspirationWall = overlays.inspiration;
    const showLearningPath = overlays.learning;
    const showReminderManager = overlays.reminders;
    const showConversationHistory = overlays.history;
    const showReflectionStudio = overlays.reflection;
    const showMindfulMoments = overlays.mindful;
    const showAchievementVault = overlays.achievements;
    const showChallengeTracker = overlays.challenges;
    const showBrainDump = overlays.brainDump;
    const showSprintPlanner = overlays.sprint;
    const showResourceLibrary = overlays.resources;
    const showAdminDebug = overlays.adminDebug;

    // Load theme on mount
    useEffect(() => {
        if (!isBrowser) return;

        try {
            const settings = JSON.parse(localStorage.getItem('mc-settings') || '{}');
            const savedTheme = settings.theme || 'dark';

            if (savedTheme === 'auto') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                setTheme(prefersDark ? 'dark' : 'light');
            } else {
                setTheme(savedTheme);
            }
        } catch (e) {
            console.error('Failed to load theme:', e);
        }
    }, []);

    // Apply theme class to body
    useEffect(() => {
        if (!isBrowser) return;
        document.body.className = theme === 'light' ? 'theme-light' : '';
    }, [theme]);

    // Trigger welcome greeting on mount (only if on welcome page)
    useEffect(() => {
        if (!isBrowser || hasGreeted || phase !== 'welcome') return;

        const timer = setTimeout(() => {
            setHasGreeted(true);
            playWelcome();
        }, 500);

        return () => clearTimeout(timer);
    }, [hasGreeted, phase]);

    const playWelcome = async () => {
        // TTS DISABLED - Chat only mode
        return;
    };

    const handleBack = () => {
        if (phase === 'dashboard') {
            router.push('/');
        }
    };

    const handleSaveSettings = () => {
        if (isBrowser) {
            window.location.reload();
        }
    };

    return (
        <div className={`app app--${theme}`}>
            <Navbar
                phase={phase}
                connectionStatus={connectionStatus}
                onBack={handleBack}
                onSettingsClick={() => toggleOverlay('settings')}
                onHealthClick={() => toggleOverlay('health')}
                onLinksClick={() => toggleOverlay('quickLinks')}
                onActivityClick={() => toggleOverlay('activityLog')}
                onFocusClick={() => toggleOverlay('focusTimer')}
                onWeatherClick={() => toggleOverlay('weather')}
                onHabitClick={() => toggleOverlay('habitTracker')}
                onQuoteClick={() => toggleOverlay('dailyQuote')}
                onTimeClick={() => toggleOverlay('timeTracker')}
                onMoodClick={() => toggleOverlay('moodTracker')}
                onBreathingClick={() => toggleOverlay('breathing')}
                onProductivityClick={() => toggleOverlay('productivity')}
                onNotesClick={() => toggleOverlay('notes')}
                onJournalClick={() => toggleOverlay('journal')}
                onWaterClick={() => toggleOverlay('water')}
                onQuestLogClick={() => toggleOverlay('quest')}
                onSnippetsClick={() => toggleOverlay('snippets')}
                onKnowledgeGardenClick={() => toggleOverlay('knowledge')}
                onGoalPlannerClick={() => toggleOverlay('goal')}
                onSystemMonitorClick={() => toggleOverlay('system')}
                onWhiteboardClick={() => toggleOverlay('whiteboard')}
                onGratitudeLogClick={() => toggleOverlay('gratitude')}
                onReadingListClick={() => toggleOverlay('reading')}
                onAmbientMixerClick={() => toggleOverlay('ambient')}
                onSkillTrackerClick={() => toggleOverlay('skills')}
                onWeeklyReviewClick={() => toggleOverlay('weekly')}
                onDecisionJournalClick={() => toggleOverlay('decision')}
                onIdeaIncubatorClick={() => toggleOverlay('ideas')}
                onWorkoutTrackerClick={() => toggleOverlay('workout')}
                onSleepTrackerClick={() => toggleOverlay('sleep')}
                onExpenseTrackerClick={() => toggleOverlay('expenses')}
                onEnergyTrackerClick={() => toggleOverlay('energy')}
                onDailyBriefingClick={() => toggleOverlay('briefing')}
                onMeetingCompanionClick={() => toggleOverlay('meeting')}
                onProjectDashboardClick={() => toggleOverlay('projects')}
                onSubscriptionTrackerClick={() => toggleOverlay('subscriptions')}
                onVisionBoardClick={() => toggleOverlay('vision')}
                onPasswordVaultClick={() => toggleOverlay('vault')}
                onLifeBalanceWheelClick={() => toggleOverlay('balance')}
                onRelationshipNetworkClick={() => toggleOverlay('network')}
                onDeepWorkTrackerClick={() => toggleOverlay('deepWork')}
                onDailyWinsClick={() => toggleOverlay('dailyWins')}
                onTravelPlannerClick={() => toggleOverlay('travel')}
                onPromptLibraryClick={() => toggleOverlay('prompts')}
                onContentTrackerClick={() => toggleOverlay('content')}
                onMealTrackerClick={() => toggleOverlay('meals')}
                onStudyPlannerClick={() => toggleOverlay('study')}
                onVoiceMemosClick={() => toggleOverlay('voice')}
                onTimeCapsuleClick={() => toggleOverlay('capsule')}
                onPriorityMatrixClick={() => toggleOverlay('priority')}
                onDigitalDetoxTrackerClick={() => toggleOverlay('detox')}
                onTaskBoardClick={() => toggleOverlay('taskBoard')}
                onReflectionRouletteClick={() => toggleOverlay('roulette')}
                onQuickCaptureClick={() => toggleOverlay('quickCapture')}
                onCodePlaygroundClick={() => toggleOverlay('code')}
                onInspirationWallClick={() => toggleOverlay('inspiration')}
                onLearningPathClick={() => toggleOverlay('learning')}
                onReminderClick={() => toggleOverlay('reminders')}
                onConversationHistoryClick={() => toggleOverlay('history')}
                onReflectionStudioClick={() => toggleOverlay('reflection')}
                onMindfulMomentsClick={() => toggleOverlay('mindful')}
                onAchievementVaultClick={() => toggleOverlay('achievements')}
                onChallengeTrackerClick={() => toggleOverlay('challenges')}
                onBrainDumpClick={() => toggleOverlay('brainDump')}
                onSprintPlannerClick={() => toggleOverlay('sprint')}
                onResourceLibraryClick={() => toggleOverlay('resources')}
            />

            {showSettings && (
                <Settings
                    onClose={() => closeOverlay('settings')}
                    onSave={handleSaveSettings}
                    connectionStatus="unknown"
                />
            )}

            {showHealthMonitor && false /* Temporarily disabled or using toggle? HealthMonitor implementation unclear */ && (
                <HealthMonitor
                    isOpen={showHealthMonitor}
                    onClose={() => closeOverlay('health')}
                />
            )}
            {/* Assuming components are properly imported and used. Some might check isOpen prop internally */}
            {showHealthMonitor && <HealthMonitor isOpen={showHealthMonitor} onClose={() => closeOverlay('health')} />}
            {overlays.calendar && <CalendarPanel isOpen={overlays.calendar} onClose={() => closeOverlay('calendar')} />}
            {overlays.tasks && <TaskPanel isOpen={overlays.tasks} onClose={() => closeOverlay('tasks')} />}
            {showQuickLinksPanel && <QuickLinksPanel isOpen={showQuickLinksPanel} onClose={() => closeOverlay('quickLinks')} />}
            {showActivityLogPanel && <ActivityLogPanel isOpen={showActivityLogPanel} onClose={() => closeOverlay('activityLog')} />}
            {showFocusTimer && <FocusTimer isOpen={showFocusTimer} onClose={() => closeOverlay('focusTimer')} />}
            {showWeatherPanel && <WeatherPanel isOpen={showWeatherPanel} onClose={() => closeOverlay('weather')} />}
            {showHabitTracker && <HabitTracker isOpen={showHabitTracker} onClose={() => closeOverlay('habitTracker')} />}
            {showDailyQuote && <DailyQuote isOpen={showDailyQuote} onClose={() => closeOverlay('dailyQuote')} />}
            {showTimeTracker && <TimeTracker isOpen={showTimeTracker} onClose={() => closeOverlay('timeTracker')} />}
            {showMoodTracker && <MoodTracker isOpen={showMoodTracker} onClose={() => closeOverlay('moodTracker')} />}
            {showBreathingExercise && <BreathingExercise isOpen={showBreathingExercise} onClose={() => closeOverlay('breathing')} />}
            {showProductivityAnalytics && <ProductivityAnalytics isOpen={showProductivityAnalytics} onClose={() => closeOverlay('productivity')} />}
            {showNotesPanel && <NotesPanel isOpen={showNotesPanel} onClose={() => closeOverlay('notes')} />}
            {showJournalPanel && <JournalPanel isOpen={showJournalPanel} onClose={() => closeOverlay('journal')} />}
            {showWaterTracker && <WaterTracker isOpen={showWaterTracker} onClose={() => closeOverlay('water')} />}
            {showQuestLog && <QuestLog isOpen={showQuestLog} onClose={() => closeOverlay('quest')} />}
            {showSnippetsPanel && <SnippetsPanel isOpen={showSnippetsPanel} onClose={() => closeOverlay('snippets')} />}
            {showKnowledgeGarden && <KnowledgeGarden isOpen={showKnowledgeGarden} onClose={() => closeOverlay('knowledge')} />}
            {showGoalPlanner && <GoalPlanner isOpen={showGoalPlanner} onClose={() => closeOverlay('goal')} />}
            {showSystemMonitor && <SystemMonitor isOpen={showSystemMonitor} onClose={() => closeOverlay('system')} />}
            {showWhiteboard && <Whiteboard isOpen={showWhiteboard} onClose={() => closeOverlay('whiteboard')} />}
            {showGratitudeLog && <GratitudeLog isOpen={showGratitudeLog} onClose={() => closeOverlay('gratitude')} />}
            {showReadingList && <ReadingList isOpen={showReadingList} onClose={() => closeOverlay('reading')} />}
            {showAmbientMixer && <AmbientMixer isOpen={showAmbientMixer} onClose={() => closeOverlay('ambient')} />}
            {showSkillTracker && <SkillTracker isOpen={showSkillTracker} onClose={() => closeOverlay('skills')} />}
            {showWeeklyReview && <WeeklyReview isOpen={showWeeklyReview} onClose={() => closeOverlay('weekly')} />}
            {showDecisionJournal && <DecisionJournal isOpen={showDecisionJournal} onClose={() => closeOverlay('decision')} />}
            {showIdeaIncubator && <IdeaIncubator isOpen={showIdeaIncubator} onClose={() => closeOverlay('ideas')} />}
            {showWorkoutTracker && <WorkoutTracker isOpen={showWorkoutTracker} onClose={() => closeOverlay('workout')} />}
            {showSleepTracker && <SleepTracker isOpen={showSleepTracker} onClose={() => closeOverlay('sleep')} />}
            {showExpenseTracker && <ExpenseTracker isOpen={showExpenseTracker} onClose={() => closeOverlay('expenses')} />}
            {showEnergyTracker && <EnergyTracker isOpen={showEnergyTracker} onClose={() => closeOverlay('energy')} />}
            {showDailyBriefing && <DailyBriefing isOpen={showDailyBriefing} onClose={() => closeOverlay('briefing')} />}
            {showMeetingCompanion && <MeetingCompanion isOpen={showMeetingCompanion} onClose={() => closeOverlay('meeting')} />}
            {showProjectDashboard && <ProjectDashboard isOpen={showProjectDashboard} onClose={() => closeOverlay('projects')} />}
            {showSubscriptionTracker && <SubscriptionTracker isOpen={showSubscriptionTracker} onClose={() => closeOverlay('subscriptions')} />}
            {showVisionBoard && <VisionBoard isOpen={showVisionBoard} onClose={() => closeOverlay('vision')} />}
            {showPasswordVault && <PasswordVault isOpen={showPasswordVault} onClose={() => closeOverlay('vault')} />}
            {showLifeBalanceWheel && <LifeBalanceWheel isOpen={showLifeBalanceWheel} onClose={() => closeOverlay('balance')} />}
            {showRelationshipNetwork && <RelationshipNetwork isOpen={showRelationshipNetwork} onClose={() => closeOverlay('network')} />}
            {showDeepWorkTracker && <DeepWorkTracker isOpen={showDeepWorkTracker} onClose={() => closeOverlay('deepWork')} />}
            {showDailyWins && <DailyWins isOpen={showDailyWins} onClose={() => closeOverlay('dailyWins')} />}
            {showTravelPlanner && <TravelPlanner isOpen={showTravelPlanner} onClose={() => closeOverlay('travel')} />}
            {showPromptLibrary && <PromptLibrary isOpen={showPromptLibrary} onClose={() => closeOverlay('prompts')} />}
            {showContentTracker && <ContentTracker isOpen={showContentTracker} onClose={() => closeOverlay('content')} />}
            {showMealTracker && <MealTracker isOpen={showMealTracker} onClose={() => closeOverlay('meals')} />}
            {showStudyPlanner && <StudyPlanner isOpen={showStudyPlanner} onClose={() => closeOverlay('study')} />}
            {showVoiceMemos && <VoiceMemos isOpen={showVoiceMemos} onClose={() => closeOverlay('voice')} />}
            {showTimeCapsule && <TimeCapsule isOpen={showTimeCapsule} onClose={() => closeOverlay('capsule')} />}
            {showPriorityMatrix && <PriorityMatrix isOpen={showPriorityMatrix} onClose={() => closeOverlay('priority')} />}
            {showDigitalDetoxTracker && <DigitalDetoxTracker isOpen={showDigitalDetoxTracker} onClose={() => closeOverlay('detox')} />}
            {showTaskBoard && <TaskBoard isOpen={showTaskBoard} onClose={() => closeOverlay('taskBoard')} />}
            {showReflectionRoulette && <ReflectionRoulette isOpen={showReflectionRoulette} onClose={() => closeOverlay('roulette')} />}
            {showQuickCapture && <QuickCapture isOpen={showQuickCapture} onClose={() => closeOverlay('quickCapture')} />}
            {showCodePlayground && <CodePlayground isOpen={showCodePlayground} onClose={() => closeOverlay('code')} />}
            {showInspirationWall && <InspirationWall isOpen={showInspirationWall} onClose={() => closeOverlay('inspiration')} />}
            {showLearningPath && <LearningPath isOpen={showLearningPath} onClose={() => closeOverlay('learning')} />}
            {showReminderManager && <ReminderManager isOpen={showReminderManager} onClose={() => closeOverlay('reminders')} />}
            {showConversationHistory && <ConversationHistory isOpen={showConversationHistory} onClose={() => closeOverlay('history')} />}
            {showReflectionStudio && <ReflectionStudio isOpen={showReflectionStudio} onClose={() => closeOverlay('reflection')} />}
            {showMindfulMoments && <MindfulMoments isOpen={showMindfulMoments} onClose={() => closeOverlay('mindful')} />}
            {showAchievementVault && <AchievementVault isOpen={showAchievementVault} onClose={() => closeOverlay('achievements')} />}
            {showChallengeTracker && <ChallengeTracker isOpen={showChallengeTracker} onClose={() => closeOverlay('challenges')} />}
            {showBrainDump && <BrainDump isOpen={showBrainDump} onClose={() => closeOverlay('brainDump')} />}
            {showSprintPlanner && <SprintPlanner isOpen={showSprintPlanner} onClose={() => closeOverlay('sprint')} />}
            {showResourceLibrary && <ResourceLibrary isOpen={showResourceLibrary} onClose={() => closeOverlay('resources')} />}
            {showAdminDebug && <AdminDebugPanel isOpen={showAdminDebug} onClose={() => closeOverlay('adminDebug')} />}

            <AgentConnect />
            <GlobalShortcuts />
            {children}
        </div>
    );
}
