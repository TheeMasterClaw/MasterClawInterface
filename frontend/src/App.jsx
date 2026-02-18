import React, { useState, useEffect } from 'react';
import Avatar from './components/Avatar';
import Welcome from './screens/Welcome';
import Dashboard from './screens/Dashboard';
import ModeSelector from './components/ModeSelector';
import Settings from './components/Settings';
import HealthMonitor from './components/HealthMonitor';
import QuickLinksPanel from './components/QuickLinksPanel';
import ActivityLogPanel from './components/ActivityLogPanel';
import FocusTimer from './components/FocusTimer';
import WeatherPanel from './components/WeatherPanel';
import HabitTracker from './components/HabitTracker';
import DailyQuote from './components/DailyQuote';
import TimeTracker from './components/TimeTracker';
import MoodTracker from './components/MoodTracker';
import BreathingExercise from './components/BreathingExercise';
import ProductivityAnalytics from './components/ProductivityAnalytics';
import NotesPanel from './components/NotesPanel';
import JournalPanel from './components/JournalPanel';
import WaterTracker from './components/WaterTracker';
import QuestLog from './components/QuestLog';
import SnippetsPanel from './components/SnippetsPanel';
import KnowledgeGarden from './components/KnowledgeGarden';
import GoalPlanner from './components/GoalPlanner';
import SystemMonitor from './components/SystemMonitor';
import Whiteboard from './components/Whiteboard';
import GratitudeLog from './components/GratitudeLog';
import ReadingList from './components/ReadingList';
import AmbientMixer from './components/AmbientMixer';
import SkillTracker from './components/SkillTracker';
import WeeklyReview from './components/WeeklyReview';
import DecisionJournal from './components/DecisionJournal';
import IdeaIncubator from './components/IdeaIncubator';
import MeetingCompanion from './components/MeetingCompanion';
import DailyBriefing from './components/DailyBriefing';
import ProjectDashboard from './components/ProjectDashboard';
import WorkoutTracker from './components/WorkoutTracker';
import SleepTracker from './components/SleepTracker';
import ExpenseTracker from './components/ExpenseTracker';
import EnergyTracker from './components/EnergyTracker';
import SubscriptionTracker from './components/SubscriptionTracker';
import VisionBoard from './components/VisionBoard';
import PasswordVault from './components/PasswordVault';
import LifeBalanceWheel from './components/LifeBalanceWheel';
import RelationshipNetwork from './components/RelationshipNetwork';
import DeepWorkTracker from './components/DeepWorkTracker';
import DailyWins from './components/DailyWins';
import Navbar from './components/Navbar';
import './App.css';

// Browser detection
const isBrowser = typeof window !== 'undefined';

export default function App() {
  const [phase, setPhase] = useState('welcome');
  const [hasGreeted, setHasGreeted] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [showSettings, setShowSettings] = useState(false);
  const [showHealthMonitor, setShowHealthMonitor] = useState(false);
  const [showQuickLinksPanel, setShowQuickLinksPanel] = useState(false);
  const [showActivityLogPanel, setShowActivityLogPanel] = useState(false);
  const [showFocusTimer, setShowFocusTimer] = useState(false);
  const [showWeatherPanel, setShowWeatherPanel] = useState(false);
  const [showHabitTracker, setShowHabitTracker] = useState(false);
  const [showDailyQuote, setShowDailyQuote] = useState(false);
  const [showTimeTracker, setShowTimeTracker] = useState(false);
  const [showMoodTracker, setShowMoodTracker] = useState(false);
  const [showBreathingExercise, setShowBreathingExercise] = useState(false);
  const [showProductivityAnalytics, setShowProductivityAnalytics] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [showJournalPanel, setShowJournalPanel] = useState(false);
  const [showWaterTracker, setShowWaterTracker] = useState(false);
  const [showQuestLog, setShowQuestLog] = useState(false);
  const [showSnippetsPanel, setShowSnippetsPanel] = useState(false);
  const [showKnowledgeGarden, setShowKnowledgeGarden] = useState(false);
  const [showGoalPlanner, setShowGoalPlanner] = useState(false);
  const [showSystemMonitor, setShowSystemMonitor] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showGratitudeLog, setShowGratitudeLog] = useState(false);
  const [showReadingList, setShowReadingList] = useState(false);
  const [showAmbientMixer, setShowAmbientMixer] = useState(false);
  const [showSkillTracker, setShowSkillTracker] = useState(false);
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const [showDecisionJournal, setShowDecisionJournal] = useState(false);
  const [showIdeaIncubator, setShowIdeaIncubator] = useState(false);
  const [showWorkoutTracker, setShowWorkoutTracker] = useState(false);
  const [showSleepTracker, setShowSleepTracker] = useState(false);
  const [showExpenseTracker, setShowExpenseTracker] = useState(false);
  const [showEnergyTracker, setShowEnergyTracker] = useState(false);
  const [showDailyBriefing, setShowDailyBriefing] = useState(false);
  const [showMeetingCompanion, setShowMeetingCompanion] = useState(false);
  const [showProjectDashboard, setShowProjectDashboard] = useState(false);
  const [showSubscriptionTracker, setShowSubscriptionTracker] = useState(false);
  const [showVisionBoard, setShowVisionBoard] = useState(false);
  const [showPasswordVault, setShowPasswordVault] = useState(false);
  const [showLifeBalanceWheel, setShowLifeBalanceWheel] = useState(false);
  const [showRelationshipNetwork, setShowRelationshipNetwork] = useState(false);
  const [showDeepWorkTracker, setShowDeepWorkTracker] = useState(false);
  const [showDailyWins, setShowDailyWins] = useState(false);

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

  // Trigger welcome greeting on mount
  useEffect(() => {
    if (!isBrowser || hasGreeted) return;

    const timer = setTimeout(() => {
      setHasGreeted(true);
      playWelcome();
    }, 500);

    return () => clearTimeout(timer);
  }, [hasGreeted]);

  const playWelcome = async () => {
    if (!isBrowser) return;

    try {
      const settings = JSON.parse(localStorage.getItem('mc-settings') || '{}');
      const provider = settings.ttsProvider || 'openai';
      const voice = settings.ttsVoice || 'alloy';
      const API_URL = import.meta.env.VITE_GATEWAY_URL || import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const response = await fetch(`${API_URL}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Welcome, Rex. Let\'s take over the world together.',
          provider,
          voice
        })
      });
      const data = await response.json();
      if (data.audioUrl) {
        const audio = new Audio(`${API_URL.replace(/\/$/, '')}${data.audioUrl}`);
        audio.play();
      }
    } catch (err) {
      console.log('TTS unavailable, proceeding with silent greeting');
    }
  };

  const handleBack = () => {
    if (phase === 'dashboard') {
      setPhase('welcome');
    }
  };

  const handleSaveSettings = () => {
    if (isBrowser) {
      window.location.reload();
    }
  };

  return (
    <div className={`app app--${theme}`}>
      {/* Navbar - always visible across all phases */}
      <Navbar 
        phase={phase}
        connectionStatus={connectionStatus}
        onBack={handleBack}
        onSettingsClick={() => setShowSettings(true)}
        onHealthClick={() => setShowHealthMonitor(true)}
        onLinksClick={() => setShowQuickLinksPanel(true)}
        onActivityClick={() => setShowActivityLogPanel(true)}
        onFocusClick={() => setShowFocusTimer(true)}
        onWeatherClick={() => setShowWeatherPanel(true)}
        onHabitClick={() => setShowHabitTracker(true)}
        onQuoteClick={() => setShowDailyQuote(true)}
        onTimeClick={() => setShowTimeTracker(true)}
        onMoodClick={() => setShowMoodTracker(true)}
        onBreathingClick={() => setShowBreathingExercise(true)}
        onProductivityClick={() => setShowProductivityAnalytics(true)}
        onNotesClick={() => setShowNotesPanel(true)}
        onJournalClick={() => setShowJournalPanel(true)}
        onWaterClick={() => setShowWaterTracker(true)}
        onQuestLogClick={() => setShowQuestLog(true)}
        onSnippetsClick={() => setShowSnippetsPanel(true)}
        onKnowledgeGardenClick={() => setShowKnowledgeGarden(true)}
        onGoalPlannerClick={() => setShowGoalPlanner(true)}
        onSystemMonitorClick={() => setShowSystemMonitor(true)}
        onWhiteboardClick={() => setShowWhiteboard(true)}
        onGratitudeLogClick={() => setShowGratitudeLog(true)}
        onReadingListClick={() => setShowReadingList(true)}
        onAmbientMixerClick={() => setShowAmbientMixer(true)}
        onSkillTrackerClick={() => setShowSkillTracker(true)}
        onWeeklyReviewClick={() => setShowWeeklyReview(true)}
        onDecisionJournalClick={() => setShowDecisionJournal(true)}
        onIdeaIncubatorClick={() => setShowIdeaIncubator(true)}
        onWorkoutTrackerClick={() => setShowWorkoutTracker(true)}
        onSleepTrackerClick={() => setShowSleepTracker(true)}
        onExpenseTrackerClick={() => setShowExpenseTracker(true)}
        onEnergyTrackerClick={() => setShowEnergyTracker(true)}
        onDailyBriefingClick={() => setShowDailyBriefing(true)}
        onMeetingCompanionClick={() => setShowMeetingCompanion(true)}
        onProjectDashboardClick={() => setShowProjectDashboard(true)}
        onSubscriptionTrackerClick={() => setShowSubscriptionTracker(true)}
        onVisionBoardClick={() => setShowVisionBoard(true)}
        onPasswordVaultClick={() => setShowPasswordVault(true)}
        onLifeBalanceWheelClick={() => setShowLifeBalanceWheel(true)}
        onRelationshipNetworkClick={() => setShowRelationshipNetwork(true)}
        onDeepWorkTrackerClick={() => setShowDeepWorkTracker(true)}
        onDailyWinsClick={() => setShowDailyWins(true)}
      />

      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
          connectionStatus="unknown"
        />
      )}

      {showHealthMonitor && (
        <HealthMonitor
          isOpen={showHealthMonitor}
          onClose={() => setShowHealthMonitor(false)}
        />
      )}

      {showQuickLinksPanel && (
        <QuickLinksPanel
          isOpen={showQuickLinksPanel}
          onClose={() => setShowQuickLinksPanel(false)}
        />
      )}

      {showActivityLogPanel && (
        <ActivityLogPanel
          isOpen={showActivityLogPanel}
          onClose={() => setShowActivityLogPanel(false)}
        />
      )}

      {showFocusTimer && (
        <FocusTimer
          isOpen={showFocusTimer}
          onClose={() => setShowFocusTimer(false)}
        />
      )}

      {showWeatherPanel && (
        <WeatherPanel
          isOpen={showWeatherPanel}
          onClose={() => setShowWeatherPanel(false)}
        />
      )}

      {showHabitTracker && (
        <HabitTracker
          isOpen={showHabitTracker}
          onClose={() => setShowHabitTracker(false)}
        />
      )}

      {showDailyQuote && (
        <DailyQuote
          isOpen={showDailyQuote}
          onClose={() => setShowDailyQuote(false)}
        />
      )}

      {showTimeTracker && (
        <TimeTracker
          isOpen={showTimeTracker}
          onClose={() => setShowTimeTracker(false)}
        />
      )}

      {showMoodTracker && (
        <MoodTracker
          isOpen={showMoodTracker}
          onClose={() => setShowMoodTracker(false)}
        />
      )}

      {showBreathingExercise && (
        <BreathingExercise
          isOpen={showBreathingExercise}
          onClose={() => setShowBreathingExercise(false)}
        />
      )}

      {showProductivityAnalytics && (
        <ProductivityAnalytics
          isOpen={showProductivityAnalytics}
          onClose={() => setShowProductivityAnalytics(false)}
        />
      )}

      {showNotesPanel && (
        <NotesPanel
          isOpen={showNotesPanel}
          onClose={() => setShowNotesPanel(false)}
        />
      )}

      {showJournalPanel && (
        <JournalPanel
          isOpen={showJournalPanel}
          onClose={() => setShowJournalPanel(false)}
        />
      )}

      {showWaterTracker && (
        <WaterTracker
          isOpen={showWaterTracker}
          onClose={() => setShowWaterTracker(false)}
        />
      )}

      {showQuestLog && (
        <QuestLog
          isOpen={showQuestLog}
          onClose={() => setShowQuestLog(false)}
        />
      )}

      {showSnippetsPanel && (
        <SnippetsPanel
          isOpen={showSnippetsPanel}
          onClose={() => setShowSnippetsPanel(false)}
        />
      )}

      {showKnowledgeGarden && (
        <KnowledgeGarden
          isOpen={showKnowledgeGarden}
          onClose={() => setShowKnowledgeGarden(false)}
        />
      )}

      {showGoalPlanner && (
        <GoalPlanner
          isOpen={showGoalPlanner}
          onClose={() => setShowGoalPlanner(false)}
        />
      )}

      {showSystemMonitor && (
        <SystemMonitor
          isOpen={showSystemMonitor}
          onClose={() => setShowSystemMonitor(false)}
        />
      )}

      {showWhiteboard && (
        <Whiteboard
          isOpen={showWhiteboard}
          onClose={() => setShowWhiteboard(false)}
        />
      )}

      {showGratitudeLog && (
        <GratitudeLog
          isOpen={showGratitudeLog}
          onClose={() => setShowGratitudeLog(false)}
        />
      )}

      {showReadingList && (
        <ReadingList
          isOpen={showReadingList}
          onClose={() => setShowReadingList(false)}
        />
      )}

      {showAmbientMixer && (
        <AmbientMixer
          isOpen={showAmbientMixer}
          onClose={() => setShowAmbientMixer(false)}
        />
      )}

      {showSkillTracker && (
        <SkillTracker
          isOpen={showSkillTracker}
          onClose={() => setShowSkillTracker(false)}
        />
      )}

      {showWeeklyReview && (
        <WeeklyReview
          isOpen={showWeeklyReview}
          onClose={() => setShowWeeklyReview(false)}
        />
      )}

      {showDecisionJournal && (
        <DecisionJournal
          isOpen={showDecisionJournal}
          onClose={() => setShowDecisionJournal(false)}
        />
      )}

      {showIdeaIncubator && (
        <IdeaIncubator
          isOpen={showIdeaIncubator}
          onClose={() => setShowIdeaIncubator(false)}
        />
      )}

      {showWorkoutTracker && (
        <WorkoutTracker
          isOpen={showWorkoutTracker}
          onClose={() => setShowWorkoutTracker(false)}
        />
      )}

      {showSleepTracker && (
        <SleepTracker
          isOpen={showSleepTracker}
          onClose={() => setShowSleepTracker(false)}
        />
      )}

      {showExpenseTracker && (
        <ExpenseTracker
          isOpen={showExpenseTracker}
          onClose={() => setShowExpenseTracker(false)}
        />
      )}

      {showEnergyTracker && (
        <EnergyTracker
          isOpen={showEnergyTracker}
          onClose={() => setShowEnergyTracker(false)}
        />
      )}

      {showDailyBriefing && (
        <DailyBriefing
          isOpen={showDailyBriefing}
          onClose={() => setShowDailyBriefing(false)}
        />
      )}

      {showMeetingCompanion && (
        <MeetingCompanion
          isOpen={showMeetingCompanion}
          onClose={() => setShowMeetingCompanion(false)}
        />
      )}

      {showProjectDashboard && (
        <ProjectDashboard
          isOpen={showProjectDashboard}
          onClose={() => setShowProjectDashboard(false)}
        />
      )}

      {showSubscriptionTracker && (
        <SubscriptionTracker
          isOpen={showSubscriptionTracker}
          onClose={() => setShowSubscriptionTracker(false)}
        />
      )}

      {showVisionBoard && (
        <VisionBoard
          isOpen={showVisionBoard}
          onClose={() => setShowVisionBoard(false)}
        />
      )}

      {showPasswordVault && (
        <PasswordVault
          isOpen={showPasswordVault}
          onClose={() => setShowPasswordVault(false)}
        />
      )}

      {showLifeBalanceWheel && (
        <LifeBalanceWheel
          isOpen={showLifeBalanceWheel}
          onClose={() => setShowLifeBalanceWheel(false)}
        />
      )}

      {showRelationshipNetwork && (
        <RelationshipNetwork
          isOpen={showRelationshipNetwork}
          onClose={() => setShowRelationshipNetwork(false)}
        />
      )}

      {showDeepWorkTracker && (
        <DeepWorkTracker
          isOpen={showDeepWorkTracker}
          onClose={() => setShowDeepWorkTracker(false)}
        />
      )}

      {showDailyWins && (
        <DailyWins
          isOpen={showDailyWins}
          onClose={() => setShowDailyWins(false)}
        />
      )}

      {/* Back button for non-welcome screens */}
      {phase !== 'welcome' && (
        <button
          className="back-button"
          onClick={handleBack}
          title="Go back"
        >
          ←
        </button>
      )}

      {phase === 'welcome' && (
        <Welcome
          onContinue={() => setPhase('dashboard')}
          avatar={<Avatar />}
        />
      )}

      {phase === 'dashboard' && (
        <Dashboard 
          mode="hybrid" 
          avatar={<Avatar />} 
          onConnectionStatusChange={setConnectionStatus}
        />
      )}
    </div>
  );
}
