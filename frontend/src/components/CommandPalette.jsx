import React, { useState, useEffect, useRef, useMemo } from 'react';
import './CommandPalette.css';

const COMMANDS = [
  { id: 'task', label: 'Create Task', icon: '📋', shortcut: '/task', action: 'input', value: '/task ' },
  { id: 'tasks', label: 'Open Tasks Panel', icon: '📋', shortcut: '/tasks', action: 'panel', target: 'tasks' },
  { id: 'event', label: 'Create Event', icon: '📅', shortcut: '/event', action: 'input', value: '/event "' },
  { id: 'events', label: 'Open Calendar Panel', icon: '📅', shortcut: '/events', action: 'panel', target: 'calendar' },
  { id: 'note', label: 'Create Note', icon: '📝', shortcut: 'new note', action: 'panel', target: 'notes' },
  { id: 'notes', label: 'Open Notes Panel', icon: '📝', shortcut: '/notes', action: 'panel', target: 'notes' },
  { id: 'quicklinks', label: 'Open Quick Links', icon: '🔗', shortcut: '/links', action: 'panel', target: 'quicklinks' },
  { id: 'link', label: 'Add Quick Link', icon: '➕', shortcut: '/link', action: 'input', value: '/link ' },
  { id: 'clear', label: 'Clear Chat History', icon: '🧹', shortcut: '/clear', action: 'input', value: '/clear' },
  { id: 'help', label: 'Show Help', icon: '❓', shortcut: '/help', action: 'help' },
  { id: 'settings', label: 'Open Settings', icon: '⚙️', shortcut: 'Cmd+,', action: 'settings' },
  { id: 'health', label: 'Health Monitor', icon: '🏥', shortcut: 'health', action: 'panel', target: 'health' },
  { id: 'activity', label: 'Activity Log', icon: '📊', shortcut: '/activity', action: 'panel', target: 'activity' },
  { id: 'focus', label: 'Focus Timer', icon: '🎯', shortcut: '/focus', action: 'panel', target: 'focus' },
  { id: 'weather', label: 'Weather', icon: '🌤️', shortcut: '/weather', action: 'panel', target: 'weather' },
  { id: 'habits', label: 'Habit Tracker', icon: '🎯', shortcut: '/habits', action: 'panel', target: 'habits' },
  { id: 'quotes', label: 'Daily Quotes', icon: '💬', shortcut: '/quotes', action: 'panel', target: 'quotes' },
  { id: 'time', label: 'Time Tracker', icon: '⏱️', shortcut: '/time', action: 'panel', target: 'time' },
  { id: 'mood', label: 'Mood Tracker', icon: '🧠', shortcut: '/mood', action: 'panel', target: 'mood' },
  { id: 'breathing', label: 'Breathing Exercise', icon: '🫁', shortcut: '/breathe', action: 'panel', target: 'breathing' },
  { id: 'productivity', label: 'Productivity Analytics', icon: '📈', shortcut: '/productivity', action: 'panel', target: 'productivity' },
  { id: 'journal', label: 'Journal', icon: '📔', shortcut: '/journal', action: 'panel', target: 'journal' },
  { id: 'snippets', label: 'Snippets Vault', icon: '📦', shortcut: '/snippets', action: 'panel', target: 'snippets' },
  { id: 'knowledge', label: 'Knowledge Garden', icon: '🌱', shortcut: '/garden', action: 'panel', target: 'knowledge' },
  { id: 'system', label: 'System Monitor', icon: '🖥️', shortcut: '/system', action: 'panel', target: 'system' },
  { id: 'whiteboard', label: 'Whiteboard', icon: '🎨', shortcut: '/whiteboard', action: 'panel', target: 'whiteboard' },
  { id: 'gratitude', label: 'Gratitude Log', icon: '🙏', shortcut: '/gratitude', action: 'panel', target: 'gratitude' },
  { id: 'theme-dark', label: 'Switch to Dark Theme', icon: '🌙', shortcut: 'theme dark', action: 'theme', value: 'dark' },
  { id: 'theme-light', label: 'Switch to Light Theme', icon: '☀️', shortcut: 'theme light', action: 'theme', value: 'light' },
  { id: 'voice', label: 'Voice Input', icon: '🎤', shortcut: 'voice', action: 'voice' },
];

export default function CommandPalette({ isOpen, onClose, onCommand, inputRef }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState([]);
  const paletteRef = useRef(null);
  const inputRefLocal = useRef(null);

  // Load recent commands from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mc-recent-commands');
    if (saved) {
      try {
        setRecentCommands(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent commands:', e);
      }
    }
  }, []);

  // Save recent command
  const saveRecentCommand = (commandId) => {
    setRecentCommands(prev => {
      const filtered = prev.filter(id => id !== commandId);
      const updated = [commandId, ...filtered].slice(0, 5);
      localStorage.setItem('mc-recent-commands', JSON.stringify(updated));
      return updated;
    });
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRefLocal.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (paletteRef.current && !paletteRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show recent commands first, then all others
      const recent = recentCommands
        .map(id => COMMANDS.find(c => c.id === id))
        .filter(Boolean);
      const others = COMMANDS.filter(c => !recentCommands.includes(c.id));
      return [...recent, ...others];
    }

    const query = searchQuery.toLowerCase();
    return COMMANDS.filter(cmd => 
      cmd.label.toLowerCase().includes(query) ||
      cmd.shortcut.toLowerCase().includes(query) ||
      cmd.id.toLowerCase().includes(query)
    );
  }, [searchQuery, recentCommands]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Reset selection when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  const executeCommand = (command) => {
    saveRecentCommand(command.id);
    onClose();

    setTimeout(() => {
      switch (command.action) {
        case 'input':
          if (inputRef?.current) {
            inputRef.current.value = command.value;
            inputRef.current.focus();
            // Trigger input event to update state
            inputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
          }
          onCommand?.({ type: 'input', value: command.value });
          break;
        case 'panel':
          onCommand?.({ type: 'panel', target: command.target });
          break;
        case 'settings':
          onCommand?.({ type: 'settings' });
          break;
        case 'help':
          onCommand?.({ type: 'help' });
          break;
        case 'voice':
          onCommand?.({ type: 'voice' });
          break;
        case 'theme':
          onCommand?.({ type: 'theme', value: command.value });
          break;
      }
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay">
      <div className="command-palette" ref={paletteRef}>
        <div className="command-palette-header">
          <span className="command-palette-icon">⌘</span>
          <input
            ref={inputRefLocal}
            type="text"
            className="command-palette-input"
            placeholder="Type a command or search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="command-palette-close" onClick={onClose}>×</button>
        </div>

        <div className="command-palette-results">
          {filteredCommands.length === 0 ? (
            <div className="command-palette-empty">
              <span>No commands found</span>
              <small>Try a different search term</small>
            </div>
          ) : (
            <>
              {searchQuery === '' && recentCommands.length > 0 && (
                <div className="command-palette-section">
                  <span className="section-label">Recent</span>
                </div>
              )}
              
              {filteredCommands.map((command, index) => (
                <button
                  key={command.id}
                  className={`command-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => executeCommand(command)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <span className="command-icon">{command.icon}</span>
                  <span className="command-label">{command.label}</span>
                  <span className="command-shortcut">{command.shortcut}</span>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="command-palette-footer">
          <div className="footer-hint">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
            <span><kbd>Enter</kbd> Select</span>
            <span><kbd>Esc</kbd> Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
