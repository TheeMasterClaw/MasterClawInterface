'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import API from '../config.js';
import { getApiUrl } from '../lib/apiUrl.js';
import GatewayClient from '../lib/gateway.js';
import Settings from '../components/Settings';
import HealthMonitor from '../components/HealthMonitor';
import TaskPanel from '../components/TaskPanel';
import CalendarPanel from '../components/CalendarPanel';
import NotesPanel from '../components/NotesPanel';
import QuickLinksPanel from '../components/QuickLinksPanel';
import ActivityLogPanel, { logActivity } from '../components/ActivityLogPanel';
import CommandPalette from '../components/CommandPalette';
import FocusTimer from '../components/FocusTimer';
import WeatherPanel from '../components/WeatherPanel';
import HabitTracker from '../components/HabitTracker';
import DailyQuote from '../components/DailyQuote';
import TimeTracker from '../components/TimeTracker';
import MoodTracker from '../components/MoodTracker';
import BreathingExercise from '../components/BreathingExercise';
import ProductivityAnalytics from '../components/ProductivityAnalytics';
import JournalPanel from '../components/JournalPanel';
import SnippetsPanel from '../components/SnippetsPanel';
import KnowledgeGarden from '../components/KnowledgeGarden';
import SystemMonitor from '../components/SystemMonitor';
import Whiteboard from '../components/Whiteboard';
import GratitudeLog from '../components/GratitudeLog';
import ReadingList from '../components/ReadingList';
import AmbientMixer from '../components/AmbientMixer';
import SkillTracker from '../components/SkillTracker';
import WeeklyReview from '../components/WeeklyReview';
import DecisionJournal from '../components/DecisionJournal';
import IdeaIncubator from '../components/IdeaIncubator';
import WorkoutTracker from '../components/WorkoutTracker';
import ChallengeTracker from '../components/ChallengeTracker';
import ExpenseTracker from '../components/ExpenseTracker';
import EnergyTracker from '../components/EnergyTracker';
import MeetingCompanion from '../components/MeetingCompanion';
import ProjectDashboard from '../components/ProjectDashboard';
import VisionBoard from '../components/VisionBoard';
import PasswordVault from '../components/PasswordVault';
import LifeBalanceWheel from '../components/LifeBalanceWheel';
import RelationshipNetwork from '../components/RelationshipNetwork';
import DeepWorkTracker from '../components/DeepWorkTracker';
import PromptLibrary from '../components/PromptLibrary';
import StudyPlanner from '../components/StudyPlanner';
import TimeCapsule from '../components/TimeCapsule';
import DigitalDetoxTracker from '../components/DigitalDetoxTracker';
import ReflectionRoulette from '../components/ReflectionRoulette';
import CodePlayground from '../components/CodePlayground';
import ReminderManager from '../components/ReminderManager';
import ConversationHistory from '../components/ConversationHistory';
import ReflectionStudio from '../components/ReflectionStudio';
import AchievementVault from '../components/AchievementVault';
import SprintPlanner from '../components/SprintPlanner';
import ResourceLibrary from '../components/ResourceLibrary';
import ContactManager from '../components/ContactManager';
import TodayView from '../components/TodayView';
import LearningTracker from '../components/LearningTracker';
import TravelPlanner from '../components/TravelPlanner';
import Watchlist from '../components/Watchlist';
import MealPlanner from '../components/MealPlanner';
import ReadingTracker from '../components/ReadingTracker';
import SubscriptionManager from '../components/SubscriptionManager';
import './Dashboard.css';

// Browser detection
const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export default function Dashboard({ mode, avatar, onConnectionStatusChange }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [avatarState, setAvatarState] = useState('idle');
  const [showSettings, setShowSettings] = useState(false);
  const [showHealthMonitor, setShowHealthMonitor] = useState(false);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [showCalendarPanel, setShowCalendarPanel] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
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
  const [showJournalPanel, setShowJournalPanel] = useState(false);
  const [showSnippetsPanel, setShowSnippetsPanel] = useState(false);
  const [showKnowledgeGarden, setShowKnowledgeGarden] = useState(false);
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
  const [showChallengeTracker, setShowChallengeTracker] = useState(false);
  const [showExpenseTracker, setShowExpenseTracker] = useState(false);
  const [showEnergyTracker, setShowEnergyTracker] = useState(false);
  const [showMeetingCompanion, setShowMeetingCompanion] = useState(false);
  const [showProjectDashboard, setShowProjectDashboard] = useState(false);
  const [showVisionBoard, setShowVisionBoard] = useState(false);
  const [showPasswordVault, setShowPasswordVault] = useState(false);
  const [showLifeBalanceWheel, setShowLifeBalanceWheel] = useState(false);
  const [showRelationshipNetwork, setShowRelationshipNetwork] = useState(false);
  const [showDeepWorkTracker, setShowDeepWorkTracker] = useState(false);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [showStudyPlanner, setShowStudyPlanner] = useState(false);
  const [showTimeCapsule, setShowTimeCapsule] = useState(false);
  const [showDigitalDetoxTracker, setShowDigitalDetoxTracker] = useState(false);
  const [showReflectionRoulette, setShowReflectionRoulette] = useState(false);
  const [showCodePlayground, setShowCodePlayground] = useState(false);
  const [showReminderManager, setShowReminderManager] = useState(false);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [showReflectionStudio, setShowReflectionStudio] = useState(false);
  const [showAchievementVault, setShowAchievementVault] = useState(false);
  const [showSprintPlanner, setShowSprintPlanner] = useState(false);
  const [showResourceLibrary, setShowResourceLibrary] = useState(false);
  const [showContactManager, setShowContactManager] = useState(false);
  const [showTodayView, setShowTodayView] = useState(false);
  const [showLearningTracker, setShowLearningTracker] = useState(false);
  const [showTravelPlanner, setShowTravelPlanner] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [showMealPlanner, setShowMealPlanner] = useState(false);
  const [showReadingTracker, setShowReadingTracker] = useState(false);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode || 'hybrid');
  const messagesContainerRef = useRef(null);
  const gatewayRef = useRef(null);
  const messageCountRef = useRef(0);
  const audioRef = useRef(null);
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const [isVideoActive, setIsVideoActive] = useState(false);

  // Cleanup video stream on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  // Helper function to update connection status
  const updateConnectionStatus = useCallback((status) => {
    setConnectionStatus(status);
    if (onConnectionStatusChange) {
      onConnectionStatusChange(status);
    }
  }, [onConnectionStatusChange]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Load chat history on mount
  useEffect(() => {
    if (!isBrowser) return;
    loadChatHistory();
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`${API.chat.history}?limit=50`);
      const data = await response.json();

      if (data.messages && data.messages.length > 0) {
        const formatted = data.messages.map(m => ({
          id: m.id || ++messageCountRef.current,
          type: m.role === 'user' ? 'user' : 'mc',
          text: m.content,
          timestamp: m.createdAt,
          command: m.command
        }));
        setMessages(formatted);
        messageCountRef.current = formatted.length;
      } else {
        setMessages([{
          id: ++messageCountRef.current,
          type: 'mc',
          text: 'Ready. What do you need? Type /help for commands.'
        }]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setMessages([{
        id: ++messageCountRef.current,
        type: 'mc',
        text: 'Ready. What do you need? Type /help for commands.'
      }]);
    }
  };

  const requestNotificationPermission = () => {
    if (!isBrowser) return;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const sendNotification = (title, body) => {
    if (!isBrowser) return;
    const settings = JSON.parse(localStorage.getItem('mc-settings') || '{}');
    if (settings.notifications !== false && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  // Connect to OpenClaw gateway
  useEffect(() => {
    if (!isBrowser) return;

    const initGateway = async () => {
      try {
        const settings = JSON.parse(localStorage.getItem('mc-settings') || '{}');
        const gatewayUrl = settings.gatewayUrl || getApiUrl();
        const gatewayToken = settings.gatewayToken || process.env.NEXT_PUBLIC_GATEWAY_TOKEN || '';

        const client = new GatewayClient(gatewayUrl, gatewayToken, {
          maxReconnectAttempts: 10,
          reconnectDelay: 2000
        });

        client.onConnect(() => {
          setIsConnected(true);
          updateConnectionStatus('connected');
        });

        client.onDisconnect(() => {
          setIsConnected(false);
          updateConnectionStatus('reconnecting');
        });

        client.onMessage((data) => {
          const responseText = data.message || data.response || JSON.stringify(data);
          const mcResponse = {
            id: ++messageCountRef.current,
            type: 'mc',
            text: responseText,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, mcResponse]);
          setIsTyping(false);
          setAvatarState('idle');
          sendNotification('MC', responseText.substring(0, 100));
          playTTS(responseText);
        });

        client.onError(() => {
          updateConnectionStatus('error');
        });

        await client.connect();
        gatewayRef.current = client;
      } catch (err) {
        console.error('Gateway connection failed:', err);
        updateConnectionStatus('offline');
      }
    };

    initGateway();

    return () => {
      if (gatewayRef.current) {
        gatewayRef.current.disconnect();
      }
    };
  }, []);

  // Proactive alerts for Context mode
  useEffect(() => {
    if (!isBrowser || currentMode !== 'context') return;

    const checkAlerts = async () => {
      try {
        const response = await fetch(API.calendar.upcoming);
        const events = await response.json();

        const now = new Date();
        const upcomingAlerts = events
          .filter(e => {
            const startTime = new Date(e.startTime);
            const diffMinutes = (startTime - now) / (1000 * 60);
            return diffMinutes > 0 && diffMinutes <= 60;
          })
          .map(e => ({
            id: e.id,
            message: `📅 "${e.title}" in ${Math.round((new Date(e.startTime) - now) / (1000 * 60))} min`,
            time: e.startTime
          }));

        setAlerts(upcomingAlerts);
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 60000);
    return () => clearInterval(interval);
  }, [currentMode]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isBrowser) return;

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSendText();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        setShowSettings(prev => !prev);
      }

      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShowHelp(prev => !prev);
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }

      if (e.key === 'Escape') {
        setShowSettings(false);
        setShowHelp(false);
        setShowHealthMonitor(false);
        setShowQuickLinksPanel(false);
        setShowCommandPalette(false);
        setShowFocusTimer(false);
        setShowHabitTracker(false);
        setShowTimeTracker(false);
        setShowMoodTracker(false);
        setShowBreathingExercise(false);
        setShowProductivityAnalytics(false);
        setShowJournalPanel(false);
        setShowSnippetsPanel(false);
        setShowKnowledgeGarden(false);
        setShowSystemMonitor(false);
        setShowWhiteboard(false);
        setShowGratitudeLog(false);
        setShowReadingList(false);
        setShowAmbientMixer(false);
        setShowSkillTracker(false);
        setShowWeeklyReview(false);
        setShowDecisionJournal(false);
        setShowIdeaIncubator(false);
        setShowChallengeTracker(false);
        setShowExpenseTracker(false);
        setShowEnergyTracker(false);
        setShowMeetingCompanion(false);
        setShowProjectDashboard(false);
        setShowVisionBoard(false);
        setShowPasswordVault(false);
        setShowLifeBalanceWheel(false);
        setShowRelationshipNetwork(false);
        setShowDeepWorkTracker(false);
        setShowPromptLibrary(false);
        setShowStudyPlanner(false);
        setShowTimeCapsule(false);
        setShowDigitalDetoxTracker(false);
        setShowReflectionRoulette(false);
        setShowCodePlayground(false);
        setShowReminderManager(false);
        setShowConversationHistory(false);
        setShowReflectionStudio(false);
        setShowAchievementVault(false);
        setShowSprintPlanner(false);
        setShowResourceLibrary(false);
        setShowContactManager(false);
        setShowTodayView(false);
        setShowLearningTracker(false);
        setShowTravelPlanner(false);
        setShowWatchlist(false);
        setShowMealPlanner(false);
        setShowReadingTracker(false);
        setShowSubscriptionManager(false);
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tagName = document.activeElement?.tagName;
        if (tagName !== 'INPUT' && tagName !== 'TEXTAREA' && !showSettings) {
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettings]);

  const playTTS = async (text) => {
    // TTS DISABLED - Chat only mode
    return;
  };

  const handleSendText = useCallback(async () => {
    if (!input.trim() || !isBrowser) return;

    const userText = input.trim();
    messageCountRef.current++;

    const userMsg = {
      id: messageCountRef.current,
      type: 'user',
      text: userText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setAvatarState('thinking');

    // Log activity
    logActivity({
      type: 'message',
      title: 'Message sent',
      description: userText.substring(0, 100) + (userText.length > 100 ? '...' : '')
    });

    // Handle slash commands
    if (userText === '/quotes') {
      setShowDailyQuote(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Daily Quotes panel'
      });
      return;
    }

    if (userText === '/time') {
      setShowTimeTracker(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Time Tracker panel'
      });
      return;
    }

    if (userText === '/mood') {
      setShowMoodTracker(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Mood Tracker panel'
      });
      return;
    }

    if (userText === '/breathe') {
      setShowBreathingExercise(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Breathing Exercise panel'
      });
      return;
    }

    if (userText === '/productivity') {
      setShowProductivityAnalytics(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Productivity Analytics panel'
      });
      return;
    }

    if (userText === '/journal') {
      setShowJournalPanel(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Journal panel'
      });
      return;
    }

    if (userText === '/snippets') {
      setShowSnippetsPanel(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Snippets Vault'
      });
      return;
    }

    if (userText === '/garden' || userText === '/knowledge') {
      setShowKnowledgeGarden(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Knowledge Garden'
      });
      return;
    }

    if (userText === '/system') {
      setShowSystemMonitor(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened System Monitor'
      });
      return;
    }

    if (userText === '/whiteboard' || userText === '/draw') {
      setShowWhiteboard(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Whiteboard'
      });
      return;
    }

    if (userText === '/gratitude' || userText === '/grateful') {
      setShowGratitudeLog(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Gratitude Log'
      });
      return;
    }

    if (userText === '/reading' || userText === '/books') {
      setShowReadingList(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Reading List'
      });
      return;
    }

    if (userText === '/ambient' || userText === '/sound' || userText === '/mixer') {
      setShowAmbientMixer(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Ambient Sound Mixer'
      });
      return;
    }

    if (userText === '/skills' || userText === '/learning') {
      setShowSkillTracker(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Skill Tracker'
      });
      return;
    }

    if (userText === '/review' || userText === '/weekly') {
      setShowWeeklyReview(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Weekly Review'
      });
      return;
    }

    if (userText === '/idea' || userText === '/ideas') {
      setShowIdeaIncubator(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Idea Incubator'
      });
      return;
    }

    if (userText === '/challenge' || userText === '/challenges') {
      setShowChallengeTracker(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Challenge Tracker'
      });
      return;
    }

    if (userText === '/expense' || userText === '/expenses' || userText === '/finance') {
      setShowExpenseTracker(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Expense Tracker'
      });
      return;
    }

    if (userText === '/meeting' || userText === '/meetings') {
      setShowMeetingCompanion(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Meeting Companion'
      });
      return;
    }

    if (userText === '/projects' || userText === '/project') {
      setShowProjectDashboard(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Project Dashboard'
      });
      return;
    }

    if (userText === '/vision' || userText === '/visions' || userText === '/board') {
      setShowVisionBoard(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Vision Board'
      });
      return;
    }

    if (userText === '/vault' || userText === '/passwords' || userText === '/pass') {
      setShowPasswordVault(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Password Vault'
      });
      return;
    }

    if (userText === '/balance' || userText === '/wheel' || userText === '/life') {
      setShowLifeBalanceWheel(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Life Balance Wheel'
      });
      return;
    }

    if (userText === '/deepwork' || userText === '/focuslog' || userText === '/work') {
      setShowDeepWorkTracker(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Deep Work Tracker'
      });
      return;
    }

    if (userText === '/prompts' || userText === '/prompt') {
      setShowPromptLibrary(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Prompt Library'
      });
      return;
    }

    if (userText === '/study' || userText === '/learn' || userText === '/courses') {
      setShowStudyPlanner(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Study Planner'
      });
      return;
    }

    if (userText === '/capsule' || userText === '/timecapsule' || userText === '/letter') {
      setShowTimeCapsule(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Time Capsule'
      });
      return;
    }

    if (userText === '/detox' || userText === '/digitaldetox' || userText === '/screentime') {
      setShowDigitalDetoxTracker(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Digital Detox Tracker'
      });
      return;
    }

    if (userText === '/reflect' || userText === '/roulette' || userText === '/reflection') {
      setShowReflectionRoulette(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Reflection Roulette'
      });
      return;
    }

    if (userText === '/reminder' || userText === '/reminders' || userText === '/alarm') {
      setShowReminderManager(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Smart Reminder Manager'
      });
      return;
    }

    if (userText === '/history' || userText === '/chat' || userText === '/conversations') {
      setShowConversationHistory(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Conversation History'
      });
      return;
    }

    if (userText === '/reflect' || userText === '/studio' || userText === '/mindfulness') {
      setShowReflectionStudio(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Reflection Studio'
      });
      return;
    }

    if (userText === '/achievements' || userText === '/vault' || userText === '/rewards') {
      setShowAchievementVault(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Achievement Vault'
      });
      return;
    }

    if (userText === '/sprint' || userText === '/sprints' || userText === '/agile') {
      setShowSprintPlanner(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Sprint Planner'
      });
      return;
    }

    if (userText === '/resources' || userText === '/library' || userText === '/bookmarks') {
      setShowResourceLibrary(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Resource Library'
      });
      return;
    }

    if (userText === '/contacts' || userText === '/people' || userText === '/network') {
      setShowContactManager(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Contact Manager'
      });
      return;
    }

    if (userText === '/today' || userText === '/daily' || userText === '/day') {
      setShowTodayView(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Today View'
      });
      return;
    }

    if (userText === '/learn' || userText === '/learning' || userText === '/study') {
      setShowLearningTracker(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Learning Tracker'
      });
      return;
    }

    if (userText === '/travel' || userText === '/trip' || userText === '/vacation') {
      setShowTravelPlanner(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Travel Planner'
      });
      return;
    }

    if (userText === '/watch' || userText === '/movie' || userText === '/tv') {
      setShowWatchlist(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Watchlist'
      });
      return;
    }

    if (userText === '/meal' || userText === '/food' || userText === '/nutrition') {
      setShowMealPlanner(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Meal Planner'
      });
      return;
    }

    if (userText === '/read' || userText === '/reading' || userText === '/book') {
      setShowReadingTracker(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Reading Tracker'
      });
      return;
    }

    if (userText === '/subs' || userText === '/subscription' || userText === '/billing') {
      setShowSubscriptionManager(true);
      setIsTyping(false);
      setAvatarState('idle');
      logActivity({
        type: 'command',
        title: 'Command executed',
        description: 'Opened Subscription Manager'
      });
      return;
    }

    if (userText === '/clear' || userText === '/cls') {
      try {
        await fetch(API.chat.history, { method: 'DELETE' });
        setMessages([{
          id: ++messageCountRef.current,
          type: 'mc',
          text: 'Chat history cleared.'
        }]);
        setIsTyping(false);
        setAvatarState('idle');
        logActivity({
          type: 'command',
          title: 'Command executed',
          description: 'Cleared chat history'
        });
        return;
      } catch (err) {
        console.error('Failed to clear history:', err);
      }
    }

    if (isConnected && gatewayRef.current) {
      gatewayRef.current.send(userText);
      return;
    }

    try {
      const response = await fetch(API.chat.message, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });

      const data = await response.json();

      messageCountRef.current++;
      const mcResponse = {
        id: messageCountRef.current,
        type: 'mc',
        text: data.text || data.message || 'No response',
        timestamp: new Date().toISOString(),
        command: data.command
      };

      setMessages(prev => [...prev, mcResponse]);
      setIsTyping(false);
      setAvatarState('idle');
      playTTS(mcResponse.text);
    } catch (err) {
      messageCountRef.current++;
      const errorMsg = {
        id: messageCountRef.current,
        type: 'mc',
        text: `❌ Error: ${err.message}. Make sure the backend is running.`,
        timestamp: new Date().toISOString(),
        error: true
      };
      setMessages(prev => [...prev, errorMsg]);
      setIsTyping(false);
      setAvatarState('idle');
    }
  }, [input, isConnected]);

  const handleVoiceInput = () => {
    if (!isBrowser || isListening) return;

    setIsListening(true);
    setAvatarState('listening');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join('');
        setInput(transcript);

        if (event.results[0].isFinal) {
          setTimeout(() => {
            setIsListening(false);
            setAvatarState('idle');
            handleSendText();
          }, 500);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setAvatarState('idle');
      };

      recognition.onend = () => {
        setIsListening(false);
        setAvatarState('idle');
      };

      recognition.start();
    }
  };

  const handleVideoToggle = async () => {
    if (!isBrowser) return;

    if (isVideoActive) {
      // Stop video
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setIsVideoActive(false);
    } else {
      // Start video
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsVideoActive(true);
      } catch (err) {
        console.error('Failed to access camera:', err);
        const errorMessage = err.name === 'NotAllowedError'
          ? 'Camera access denied. Please grant camera permissions in your browser settings.'
          : 'Camera not available or already in use.';

        // Show error in chat instead of alert
        messageCountRef.current++;
        const errorMsg = {
          id: messageCountRef.current,
          type: 'mc',
          text: `📷 ${errorMessage}`,
          timestamp: new Date().toISOString(),
          error: true
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    }
  };

  const handleSaveSettings = () => {
    if (isBrowser) {
      window.location.reload();
    }
  };

  const handleCommandPaletteAction = (command) => {
    switch (command.type) {
      case 'input':
        setInput(command.value);
        setTimeout(() => inputRef.current?.focus(), 100);
        break;
      case 'panel':
        switch (command.target) {
          case 'tasks':
            setShowTaskPanel(true);
            break;
          case 'calendar':
            setShowCalendarPanel(true);
            break;
          case 'notes':
            setShowNotesPanel(true);
            break;
          case 'quicklinks':
            setShowQuickLinksPanel(true);
            break;
          case 'health':
            setShowHealthMonitor(true);
            break;
          case 'activity':
            setShowActivityLogPanel(true);
            break;
          case 'focus':
            setShowFocusTimer(true);
            break;
          case 'weather':
            setShowWeatherPanel(true);
            break;
          case 'habits':
            setShowHabitTracker(true);
            break;
          case 'quotes':
            setShowDailyQuote(true);
            break;
          case 'time':
            setShowTimeTracker(true);
            break;
          case 'mood':
            setShowMoodTracker(true);
            break;
          case 'breathing':
            setShowBreathingExercise(true);
            break;
          case 'productivity':
            setShowProductivityAnalytics(true);
            break;
          case 'journal':
            setShowJournalPanel(true);
            break;
          case 'snippets':
            setShowSnippetsPanel(true);
            break;
          case 'knowledge':
            setShowKnowledgeGarden(true);
            break;
          case 'system':
            setShowSystemMonitor(true);
            break;
          case 'whiteboard':
            setShowWhiteboard(true);
            break;
          case 'gratitude':
            setShowGratitudeLog(true);
            break;
          case 'reading':
          case 'books':
            setShowReadingList(true);
            break;
          case 'ambient':
          case 'mixer':
            setShowAmbientMixer(true);
            break;
          case 'skills':
          case 'learning':
            setShowSkillTracker(true);
            break;
          case 'weekly-review':
          case 'review':
            setShowWeeklyReview(true);
            break;
          case 'idea':
          case 'ideas':
            setShowIdeaIncubator(true);
            break;
          case 'challenge':
          case 'challenges':
            setShowChallengeTracker(true);
            break;
          case 'expense':
          case 'expenses':
          case 'finance':
            setShowExpenseTracker(true);
            break;
          case 'energy':
            setShowEnergyTracker(true);
            break;
          case 'meeting':
          case 'meetings':
            setShowMeetingCompanion(true);
            break;
          case 'projects':
          case 'project':
            setShowProjectDashboard(true);
            break;
          case 'vision':
          case 'visions':
          case 'board':
            setShowVisionBoard(true);
            break;
          case 'vault':
          case 'passwords':
            setShowPasswordVault(true);
            break;
          case 'balance':
          case 'wheel':
            setShowLifeBalanceWheel(true);
            break;
          case 'deepwork':
          case 'deep':
            setShowDeepWorkTracker(true);
            break;
          case 'prompts':
          case 'prompt-library':
            setShowPromptLibrary(true);
            break;
          case 'study':
          case 'learn':
          case 'courses':
            setShowStudyPlanner(true);
            break;
          case 'capsule':
          case 'timecapsule':
          case 'letter':
            setShowTimeCapsule(true);
            break;
          case 'detox':
          case 'digitaldetox':
          case 'screentime':
            setShowDigitalDetoxTracker(true);
            break;
          case 'reminder':
          case 'reminders':
          case 'alarm':
            setShowReminderManager(true);
            break;
          case 'history':
          case 'chat':
          case 'conversations':
            setShowConversationHistory(true);
            break;
          case 'reflect':
          case 'studio':
          case 'mindfulness':
            setShowReflectionStudio(true);
            break;
          case 'achievements':
          case 'rewards':
            setShowAchievementVault(true);
            break;
          case 'sprint':
          case 'sprints':
          case 'agile':
            setShowSprintPlanner(true);
            break;
          case 'resources':
          case 'library':
          case 'bookmarks':
            setShowResourceLibrary(true);
            break;
          case 'contacts':
          case 'people':
          case 'network':
            setShowContactManager(true);
            break;
          case 'today':
          case 'daily':
          case 'day':
            setShowTodayView(true);
            break;
          case 'learn':
          case 'learning':
          case 'study':
            setShowLearningTracker(true);
            break;
          case 'travel':
          case 'trip':
          case 'vacation':
            setShowTravelPlanner(true);
            break;
          case 'watch':
          case 'movie':
          case 'tv':
            setShowWatchlist(true);
            break;
          case 'meal':
          case 'food':
          case 'nutrition':
            setShowMealPlanner(true);
            break;
          case 'read':
          case 'reading':
          case 'book':
            setShowReadingTracker(true);
            break;
          case 'subs':
          case 'subscription':
          case 'billing':
            setShowSubscriptionManager(true);
            break;
        }
        break;
      case 'settings':
        setShowSettings(true);
        break;
      case 'help':
        setShowHelp(true);
        break;
      case 'voice':
        handleVoiceInput();
        break;
      case 'theme':
        if (isBrowser) {
          const settings = JSON.parse(localStorage.getItem('mc-settings') || '{}');
          settings.theme = command.value;
          localStorage.setItem('mc-settings', JSON.stringify(settings));
          window.location.reload();
        }
        break;
    }
  };

  const statusLabelMap = {
    connected: 'Neural link synchronized',
    reconnecting: 'Recovering uplink',
    'backend-only': 'API fallback active',
    connecting: 'Establishing uplink',
    unconfigured: 'Gateway setup required',
    error: 'Network fault detected',
    offline: 'System offline'
  };

  const AvatarWithState = avatar ? React.cloneElement(avatar, {
    state: avatarState,
    size: 'small'
  }) : null;

  return (
    <div className="dashboard">
      <audio ref={audioRef} style={{ display: 'none' }} />

      {showSettings && (
        <Settings
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
          connectionStatus={connectionStatus}
        />
      )}

      {showHealthMonitor && (
        <HealthMonitor
          isOpen={showHealthMonitor}
          onClose={() => setShowHealthMonitor(false)}
        />
      )}

      {showTaskPanel && (
        <TaskPanel
          isOpen={showTaskPanel}
          onClose={() => setShowTaskPanel(false)}
        />
      )}

      {showCalendarPanel && (
        <CalendarPanel
          isOpen={showCalendarPanel}
          onClose={() => setShowCalendarPanel(false)}
        />
      )}

      {showNotesPanel && (
        <NotesPanel
          isOpen={showNotesPanel}
          onClose={() => setShowNotesPanel(false)}
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

      {showJournalPanel && (
        <JournalPanel
          isOpen={showJournalPanel}
          onClose={() => setShowJournalPanel(false)}
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

      {showIdeaIncubator && (
        <IdeaIncubator
          isOpen={showIdeaIncubator}
          onClose={() => setShowIdeaIncubator(false)}
        />
      )}

      {showChallengeTracker && (
        <ChallengeTracker
          isOpen={showChallengeTracker}
          onClose={() => setShowChallengeTracker(false)}
        />
      )}

      {showExpenseTracker && (
        <ExpenseTracker
          isOpen={showExpenseTracker}
          onClose={() => setShowExpenseTracker(false)}
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

      {showPromptLibrary && (
        <PromptLibrary
          isOpen={showPromptLibrary}
          onClose={() => setShowPromptLibrary(false)}
          onUsePrompt={(promptText) => {
            setInput(prev => prev + (prev ? ' ' : '') + promptText);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
        />
      )}

      {showStudyPlanner && (
        <StudyPlanner
          isOpen={showStudyPlanner}
          onClose={() => setShowStudyPlanner(false)}
        />
      )}

      {showTimeCapsule && (
        <TimeCapsule
          isOpen={showTimeCapsule}
          onClose={() => setShowTimeCapsule(false)}
        />
      )}

      {showDigitalDetoxTracker && (
        <DigitalDetoxTracker
          isOpen={showDigitalDetoxTracker}
          onClose={() => setShowDigitalDetoxTracker(false)}
        />
      )}

      {showReflectionRoulette && (
        <ReflectionRoulette
          isOpen={showReflectionRoulette}
          onClose={() => setShowReflectionRoulette(false)}
        />
      )}

      {showCodePlayground && (
        <CodePlayground
          isOpen={showCodePlayground}
          onClose={() => setShowCodePlayground(false)}
        />
      )}

      {showReminderManager && (
        <ReminderManager
          isOpen={showReminderManager}
          onClose={() => setShowReminderManager(false)}
        />
      )}

      {showConversationHistory && (
        <ConversationHistory
          isOpen={showConversationHistory}
          onClose={() => setShowConversationHistory(false)}
        />
      )}

      {showReflectionStudio && (
        <ReflectionStudio
          isOpen={showReflectionStudio}
          onClose={() => setShowReflectionStudio(false)}
        />
      )}

      {showAchievementVault && (
        <AchievementVault
          isOpen={showAchievementVault}
          onClose={() => setShowAchievementVault(false)}
        />
      )}

      {showSprintPlanner && (
        <SprintPlanner
          isOpen={showSprintPlanner}
          onClose={() => setShowSprintPlanner(false)}
        />
      )}

      {showResourceLibrary && (
        <ResourceLibrary
          isOpen={showResourceLibrary}
          onClose={() => setShowResourceLibrary(false)}
        />
      )}

      {showContactManager && (
        <ContactManager
          isOpen={showContactManager}
          onClose={() => setShowContactManager(false)}
        />
      )}

      {showTodayView && (
        <TodayView
          isOpen={showTodayView}
          onClose={() => setShowTodayView(false)}
        />
      )}

      {showLearningTracker && (
        <LearningTracker
          isOpen={showLearningTracker}
          onClose={() => setShowLearningTracker(false)}
        />
      )}

      {showTravelPlanner && (
        <TravelPlanner
          isOpen={showTravelPlanner}
          onClose={() => setShowTravelPlanner(false)}
        />
      )}

      {showWatchlist && (
        <Watchlist
          isOpen={showWatchlist}
          onClose={() => setShowWatchlist(false)}
        />
      )}

      {showMealPlanner && (
        <MealPlanner
          isOpen={showMealPlanner}
          onClose={() => setShowMealPlanner(false)}
        />
      )}

      {showReadingTracker && (
        <ReadingTracker
          isOpen={showReadingTracker}
          onClose={() => setShowReadingTracker(false)}
        />
      )}

      {showSubscriptionManager && (
        <SubscriptionManager
          isOpen={showSubscriptionManager}
          onClose={() => setShowSubscriptionManager(false)}
        />
      )}

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onCommand={handleCommandPaletteAction}
        inputRef={inputRef}
      />

      {showHelp && (
        <div className="help-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-panel" onClick={e => e.stopPropagation()}>
            <div className="help-header">
              <h3>📖 Keyboard Shortcuts & Commands</h3>
              <button className="help-close" onClick={() => setShowHelp(false)}>×</button>
            </div>
            <div className="help-content">
              <section>
                <h4>Keyboard Shortcuts</h4>
                <ul>
                  <li><strong>⌘/Ctrl + K</strong> - Open Command Palette</li>
                  <li><strong>⌘/Ctrl + Enter</strong> - Send message</li>
                  <li><strong>⌘/Ctrl + .</strong> - Toggle settings</li>
                  <li><strong>⌘/Ctrl + /</strong> - Show help</li>
                  <li><strong>Escape</strong> - Close modals</li>
                </ul>
              </section>
              <section>
                <h4>Commands</h4>
                <ul>
                  <li><strong>/task [title]</strong> – Create task</li>
                  <li><strong>/tasks</strong> – List all tasks</li>
                  <li><strong>/done [id]</strong> – Complete task</li>
                  <li><strong>/event "[title]" [when]</strong> – Create event</li>
                  <li><strong>/events</strong> – Upcoming events</li>
                  <li><strong>/links</strong> – Open Quick Links</li>
                  <li><strong>/activity</strong> – Open Activity Log</li>
                  <li><strong>/focus</strong> – Open Focus Timer</li>
                  <li><strong>/weather</strong> – Open Weather</li>
                  <li><strong>/habits</strong> – Open Habit Tracker</li>
                  <li><strong>/quotes</strong> – Open Daily Quotes</li>
                  <li><strong>/time</strong> – Open Time Tracker</li>
                  <li><strong>/mood</strong> – Open Mood Tracker</li>
                  <li><strong>/breathe</strong> – Open Breathing Exercise</li>
                  <li><strong>/productivity</strong> – Open Productivity Analytics</li>
                  <li><strong>/journal</strong> – Open Journal</li>
                  <li><strong>/snippets</strong> – Open Snippets Vault</li>
                  <li><strong>/garden</strong> – Open Knowledge Garden</li>
                  <li><strong>/system</strong> – Open System Monitor</li>
                  <li><strong>/whiteboard</strong> – Open Whiteboard</li>
                  <li><strong>/gratitude</strong> – Open Gratitude Log</li>
                  <li><strong>/reading</strong> – Open Reading List</li>
                  <li><strong>/ambient</strong> – Open Ambient Sound Mixer</li>
                  <li><strong>/skills</strong> – Open Skill Tracker</li>
                  <li><strong>/review</strong> – Open Weekly Review</li>
                  <li><strong>/idea</strong> – Open Idea Incubator</li>
                  <li><strong>/challenge</strong> – Open Challenge Tracker</li>
                  <li><strong>/expense</strong> – Open Expense Tracker</li>
                  <li><strong>/meeting</strong> – Open Meeting Companion</li>
                  <li><strong>/projects</strong> – Open Project Dashboard</li>
                  <li><strong>/vision</strong> – Open Vision Board</li>
                  <li><strong>/vault</strong> – Open Password Vault</li>
                  <li><strong>/balance</strong> – Open Life Balance Wheel</li>
                  <li><strong>/deepwork</strong> – Open Deep Work Tracker</li>
                  <li><strong>/prompts</strong> – Open Prompt Library</li>
                  <li><strong>/study</strong> – Open Study Planner</li>
                  <li><strong>/capsule</strong> – Open Time Capsule</li>
                  <li><strong>/detox</strong> – Open Digital Detox Tracker</li>
                  <li><strong>/reminder</strong> – Open Smart Reminder Manager</li>
                  <li><strong>/history</strong> – Open Conversation History</li>
                  <li><strong>/achievements</strong> – Open Achievement Vault</li>
                  <li><strong>/sprint</strong> – Open Sprint Planner</li>
                  <li><strong>/resources</strong> – Open Resource Library</li>
                  <li><strong>/contacts</strong> – Open Contact Manager</li>
                  <li><strong>/today</strong> – Open Today View</li>
                  <li><strong>/learn</strong> – Open Learning Tracker</li>
                  <li><strong>/travel</strong> – Open Travel Planner</li>
                  <li><strong>/watch</strong> – Open Watchlist</li>
                  <li><strong>/meal</strong> – Open Meal Planner</li>
                  <li><strong>/read</strong> – Open Reading Tracker</li>
                  <li><strong>/subs</strong> – Open Subscription Manager</li>
                  <li><strong>/clear</strong> – Clear chat history</li>
                  <li><strong>/help</strong> – Show this help</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-layout">
        <div className="dashboard-sidebar">
          <div className="sidebar-brand">
            <span className="sidebar-brand__label">MASTERCLAW</span>
            <span className="sidebar-brand__sub">Neural Console</span>
          </div>

          <div className="mc-avatar-sidebar">
            {AvatarWithState}
          </div>

          <div className="mode-indicator">
            <span className="mode-badge">{currentMode}</span>

            <button className="icon-btn" onClick={() => setShowCommandPalette(true)} title="Command Palette (⌘K)" aria-label="Open command palette">⌘</button>
            <button className="icon-btn" onClick={() => setShowHelp(true)} title="Help">❓</button>
            <button className="icon-btn" onClick={() => setShowSettings(true)} title="Settings">⚙️</button>
            <button className="icon-btn" onClick={() => setShowHealthMonitor(true)} title="Health Monitor">🏥</button>
            <button className="icon-btn" onClick={() => setShowTaskPanel(true)} title="Tasks">📋</button>
            <button className="icon-btn" onClick={() => setShowCalendarPanel(true)} title="Calendar">📅</button>
            <button className="icon-btn" onClick={() => setShowNotesPanel(true)} title="Notes">📝</button>
            <button className="icon-btn" onClick={() => setShowQuickLinksPanel(true)} title="Quick Links">🔗</button>
            <button className="icon-btn" onClick={() => setShowActivityLogPanel(true)} title="Activity Log">📊</button>
            <button className="icon-btn" onClick={() => setShowFocusTimer(true)} title="Focus Timer">🎯</button>
            <button className="icon-btn" onClick={() => setShowWeatherPanel(true)} title="Weather">🌤️</button>
            <button className="icon-btn" onClick={() => setShowHabitTracker(true)} title="Habit Tracker">🎯</button>
            <button className="icon-btn" onClick={() => setShowDailyQuote(true)} title="Daily Quote">💬</button>
            <button className="icon-btn" onClick={() => setShowTimeTracker(true)} title="Time Tracker">⏱️</button>
            <button className="icon-btn" onClick={() => setShowMoodTracker(true)} title="Mood Tracker">🧠</button>
            <button className="icon-btn" onClick={() => setShowBreathingExercise(true)} title="Breathing Exercise">🫁</button>
            <button className="icon-btn" onClick={() => setShowProductivityAnalytics(true)} title="Productivity Analytics">📈</button>
            <button className="icon-btn" onClick={() => setShowJournalPanel(true)} title="Journal">📔</button>
            <button className="icon-btn" onClick={() => setShowSnippetsPanel(true)} title="Snippets Vault">📦</button>
            <button className="icon-btn" onClick={() => setShowKnowledgeGarden(true)} title="Knowledge Garden">🌱</button>
            <button className="icon-btn" onClick={() => setShowSystemMonitor(true)} title="System Monitor">🖥️</button>
            <button className="icon-btn" onClick={() => setShowWhiteboard(true)} title="Whiteboard">🎨</button>
            <button className="icon-btn" onClick={() => setShowGratitudeLog(true)} title="Gratitude Log">🙏</button>
            <button className="icon-btn" onClick={() => setShowReadingList(true)} title="Reading List">📚</button>
            <button className="icon-btn" onClick={() => setShowAmbientMixer(true)} title="Ambient Sound Mixer">🎧</button>
            <button className="icon-btn" onClick={() => setShowSkillTracker(true)} title="Skill Tracker">🎯</button>
            <button className="icon-btn" onClick={() => setShowWeeklyReview(true)} title="Weekly Review">🗓️</button>
            <button className="icon-btn" onClick={() => setShowIdeaIncubator(true)} title="Idea Incubator">💡</button>
            <button className="icon-btn" onClick={() => setShowChallengeTracker(true)} title="Challenge Tracker">🎯</button>
            <button className="icon-btn" onClick={() => setShowExpenseTracker(true)} title="Expense Tracker">💰</button>
            <button className="icon-btn" onClick={() => setShowMeetingCompanion(true)} title="Meeting Companion">🤝</button>
            <button className="icon-btn" onClick={() => setShowProjectDashboard(true)} title="Project Dashboard">📊</button>
            <button className="icon-btn" onClick={() => setShowVisionBoard(true)} title="Vision Board">🖼️</button>
            <button className="icon-btn" onClick={() => setShowPasswordVault(true)} title="Password Vault">🔐</button>
            <button className="icon-btn" onClick={() => setShowLifeBalanceWheel(true)} title="Life Balance Wheel">⚖️</button>
            <button className="icon-btn" onClick={() => setShowDeepWorkTracker(true)} title="Deep Work Tracker">🎯</button>
            <button className="icon-btn" onClick={() => setShowPromptLibrary(true)} title="Prompt Library">📚</button>
            <button className="icon-btn" onClick={() => setShowStudyPlanner(true)} title="Study Planner">📖</button>
            <button className="icon-btn" onClick={() => setShowTimeCapsule(true)} title="Time Capsule">⏳</button>
            <button className="icon-btn" onClick={() => setShowDigitalDetoxTracker(true)} title="Digital Detox Tracker">🧘</button>
            <button className="icon-btn" onClick={() => setShowReflectionRoulette(true)} title="Reflection Roulette">🎲</button>
            <button className="icon-btn" onClick={() => setShowCodePlayground(true)} title="Code Playground">💻</button>
            <button className="icon-btn" onClick={() => setShowReminderManager(true)} title="Smart Reminders">⏰</button>
            <button className="icon-btn" onClick={() => setShowSprintPlanner(true)} title="Sprint Planner">🏃</button>
            <button className="icon-btn" onClick={() => setShowResourceLibrary(true)} title="Resource Library">📚</button>
            <button className="icon-btn" onClick={() => setShowContactManager(true)} title="Contact Manager">👥</button>
            <button className="icon-btn" onClick={() => setShowTodayView(true)} title="Today View">📅</button>
            <button className="icon-btn" onClick={() => setShowLearningTracker(true)} title="Learning Tracker">🎓</button>
            <button className="icon-btn" onClick={() => setShowTravelPlanner(true)} title="Travel Planner">✈️</button>
            <button className="icon-btn" onClick={() => setShowWatchlist(true)} title="Watchlist">🍿</button>
            <button className="icon-btn" onClick={() => setShowMealPlanner(true)} title="Meal Planner">🥗</button>
            <button className="icon-btn" onClick={() => setShowReadingTracker(true)} title="Reading Tracker">📖</button>
            <button className="icon-btn" onClick={() => setShowSubscriptionManager(true)} title="Subscriptions">💳</button>
          </div>
        </div>

        <div className="dashboard-main">
          <div className="chat-shell">
            <div className="dashboard-hud">
              <div className="hud-chip">Mode: <strong>{currentMode}</strong></div>
              <div className={`hud-chip hud-chip--${connectionStatus}`}>{statusLabelMap[connectionStatus] || 'Status unknown'}</div>
              <div className="hud-chip">Messages: <strong>{messages.length}</strong></div>
            </div>

            {currentMode === 'context' && alerts.length > 0 && (
              <div className="alerts-container">
                {alerts.map(alert => (
                  <div key={alert.id} className="alert-item">{alert.message}</div>
                ))}
              </div>
            )}

            <div className="messages-container" ref={messagesContainerRef}>
              {messages.map((msg) => (
                <div key={msg.id} className={`message message-${msg.type}`}>
                  <div className="message-content">
                    {msg.command && <span className="command-badge">/{msg.command}</span>}
                    {msg.text}
                  </div>
                  {msg.timestamp && (
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="message message-mc typing">
                  <div className="message-content">
                    <span className="typing-indicator">
                      <span></span><span></span><span></span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="input-area">
              {isVideoActive && (
                <div className="video-preview">
                  <video ref={videoRef} autoPlay muted className="camera-feed" />
                </div>
              )}

              <div className="mode-switcher">
                <button
                  className={`mode-switch-btn ${currentMode === 'text' ? 'active' : ''}`}
                  onClick={() => setCurrentMode('text')}
                  title="Text Mode"
                >
                  💬
                </button>
                <button
                  className={`mode-switch-btn ${currentMode === 'voice' ? 'active' : ''}`}
                  onClick={() => setCurrentMode('voice')}
                  title="Voice Mode"
                >
                  🎤
                </button>
                <button
                  className={`mode-switch-btn ${currentMode === 'hybrid' ? 'active' : ''}`}
                  onClick={() => setCurrentMode('hybrid')}
                  title="Hybrid Mode"
                >
                  🔀
                </button>
                <button
                  className={`mode-switch-btn ${currentMode === 'context' ? 'active' : ''}`}
                  onClick={() => setCurrentMode('context')}
                  title="Context Mode"
                >
                  👁️
                </button>
              </div>

              <div className="input-controls">
                {(currentMode === 'text' || currentMode === 'hybrid') && (
                  <div className="text-input-group">
                    <input
                      ref={inputRef}
                      type="text"
                      className="text-input"
                      placeholder="Transmit command… (/help for shortcuts)"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendText()}
                    />
                    <button className="send-button" onClick={handleSendText} title="Send">→</button>
                  </div>
                )}

                <div className="media-controls">
                  {(currentMode === 'voice' || currentMode === 'hybrid') && (
                    <button
                      className={`voice-button ${isListening ? 'listening' : ''}`}
                      onClick={handleVoiceInput}
                      title="Voice Input"
                    >
                      {isListening ? '🎤 Listening...' : '🎤 Speak'}
                    </button>
                  )}

                  <button
                    className={`camera-button ${isVideoActive ? 'active' : ''}`}
                    onClick={handleVideoToggle}
                    title={isVideoActive ? 'Stop Camera' : 'Start Camera'}
                  >
                    {isVideoActive ? '📹 Stop' : '📷 Camera'}
                  </button>
                </div>

                {currentMode === 'context' && (
                  <div className="context-info">
                    <p>👁️ MC is watching your calendar and tasks.</p>
                    <p>I'll alert you to what matters.</p>
                  </div>
                )}
              </div>

              <div className="input-hints">
                <span>Press <strong>⌘K</strong> for commands · <strong>⌘Enter</strong> to send</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
