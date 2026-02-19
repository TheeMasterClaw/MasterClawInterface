import React, { useState, useEffect, useCallback } from 'react';
import './DailyQuote.css';

// Curated collection of motivational quotes
const QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "work" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", category: "inspiration" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", category: "perseverance" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "dreams" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "perseverance" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair", category: "courage" },
  { text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau", category: "work" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson", category: "perseverance" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker", category: "future" },
  { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs", category: "life" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt", category: "future" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt", category: "action" },
  { text: "Everything is hard before it is easy.", author: "Johann Wolfgang von Goethe", category: "growth" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain", category: "action" },
  { text: "Small steps in the right direction can turn out to be the biggest step of your life.", author: "Unknown", category: "growth" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar", category: "action" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss", category: "productivity" },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson", category: "growth" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe", category: "action" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb", category: "perseverance" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", category: "strength" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James", category: "impact" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier", category: "consistency" },
  { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu", category: "action" },
  { text: "Dream big and dare to fail.", author: "Norman Vaughan", category: "courage" },
  { text: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar", category: "growth" },
  { text: "It's not whether you get knocked down, it's whether you get up.", author: "Vince Lombardi", category: "resilience" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle", category: "habits" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown", category: "work" },
  { text: "Dreams don't work unless you do.", author: "John C. Maxwell", category: "action" },
  { text: "Don't let yesterday take up too much of today.", author: "Will Rogers", category: "mindset" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis", category: "dreams" },
  { text: "A winner is a dreamer who never gives up.", author: "Nelson Mandela", category: "perseverance" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", category: "action" },
  { text: "Limit your 'always' and your 'nevers'.", author: "Amy Poehler", category: "mindset" },
  { text: "Nothing will work unless you do.", author: "Maya Angelou", category: "work" },
  { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey", category: "growth" },
  { text: "Very little is needed to make a happy life; it is all within yourself.", author: "Marcus Aurelius", category: "happiness" },
  { text: "Happiness depends upon ourselves.", author: "Aristotle", category: "happiness" },
  { text: "The purpose of our lives is to be happy.", author: "Dalai Lama", category: "happiness" }
];

const CATEGORIES = {
  all: { label: 'All', icon: '🌟' },
  work: { label: 'Work', icon: '💼' },
  inspiration: { label: 'Inspiration', icon: '✨' },
  perseverance: { label: 'Perseverance', icon: '💪' },
  dreams: { label: 'Dreams', icon: '🌙' },
  courage: { label: 'Courage', icon: '🦁' },
  action: { label: 'Action', icon: '🚀' },
  growth: { label: 'Growth', icon: '🌱' },
  productivity: { label: 'Productivity', icon: '⚡' },
  consistency: { label: 'Consistency', icon: '📅' },
  habits: { label: 'Habits', icon: '🔄' },
  happiness: { label: 'Happiness', icon: '😊' },
  mindset: { label: 'Mindset', icon: '🧠' }
};

export default function DailyQuote({ isOpen, onClose }) {
  const [currentQuote, setCurrentQuote] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [view, setView] = useState('daily'); // daily, browse, favorites
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(null);

  // Load favorites and daily quote on mount
  useEffect(() => {
    if (!isOpen) return;
    
    const savedFavorites = localStorage.getItem('mc-quote-favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Failed to parse favorites:', e);
      }
    }

    // Check if we have a quote for today
    const todayQuote = getTodayQuote();
    setCurrentQuote(todayQuote);
  }, [isOpen]);

  // Get today's quote based on date (consistent for the whole day)
  const getTodayQuote = () => {
    const today = new Date().toDateString();
    const saved = localStorage.getItem('mc-daily-quote');
    
    if (saved) {
      try {
        const { date, quoteIndex } = JSON.parse(saved);
        if (date === today) {
          return QUOTES[quoteIndex];
        }
      } catch (e) {
        console.error('Failed to parse saved quote:', e);
      }
    }
    
    // Generate new daily quote
    const index = getDailyQuoteIndex();
    const quote = QUOTES[index];
    localStorage.setItem('mc-daily-quote', JSON.stringify({ date: today, quoteIndex: index }));
    return quote;
  };

  // Get consistent daily quote index based on date
  const getDailyQuoteIndex = () => {
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    return dayOfYear % QUOTES.length;
  };

  // Get random quote
  const getRandomQuote = useCallback(() => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * QUOTES.length);
    } while (QUOTES[newIndex] === currentQuote);
    setCurrentQuote(QUOTES[newIndex]);
  }, [currentQuote]);

  // Get next quote in sequence
  const getNextQuote = useCallback(() => {
    if (!currentQuote) return;
    const currentIndex = QUOTES.indexOf(currentQuote);
    const nextIndex = (currentIndex + 1) % QUOTES.length;
    setCurrentQuote(QUOTES[nextIndex]);
  }, [currentQuote]);

  // Get previous quote in sequence
  const getPrevQuote = useCallback(() => {
    if (!currentQuote) return;
    const currentIndex = QUOTES.indexOf(currentQuote);
    const prevIndex = currentIndex === 0 ? QUOTES.length - 1 : currentIndex - 1;
    setCurrentQuote(QUOTES[prevIndex]);
  }, [currentQuote]);

  // Toggle favorite
  const toggleFavorite = useCallback((quote) => {
    setFavorites(prev => {
      const exists = prev.some(q => q.text === quote.text);
      let updated;
      if (exists) {
        updated = prev.filter(q => q.text !== quote.text);
        showToastMessage('Removed from favorites');
      } else {
        updated = [...prev, { ...quote, savedAt: new Date().toISOString() }];
        showToastMessage('Added to favorites');
      }
      localStorage.setItem('mc-quote-favorites', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback((quote) => {
    const text = `"${quote.text}" — ${quote.author}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToastMessage('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  // Show toast message
  const showToastMessage = (message) => {
    setShowToast(message);
    setTimeout(() => setShowToast(null), 2000);
  };

  // Check if quote is favorited
  const isFavorited = (quote) => {
    return favorites.some(q => q.text === quote?.text);
  };

  // Get filtered quotes for browse view
  const getFilteredQuotes = () => {
    if (selectedCategory === 'all') return QUOTES;
    return QUOTES.filter(q => q.category === selectedCategory);
  };

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') getPrevQuote();
      if (e.key === 'ArrowRight') getNextQuote();
      if (e.key === ' ') {
        e.preventDefault();
        getRandomQuote();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, getPrevQuote, getNextQuote, getRandomQuote]);

  if (!isOpen) return null;

  const filteredQuotes = getFilteredQuotes();

  return (
    <div className="quote-panel-overlay" onClick={onClose}>
      <div className="quote-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="quote-panel-header">
          <h2>💬 Daily Quotes</h2>
          <div className="quote-panel-actions">
            <button 
              className={view === 'daily' ? 'active' : ''}
              onClick={() => { setView('daily'); setCurrentQuote(getTodayQuote()); }}
              title="Daily Quote"
            >
              📅
            </button>
            <button 
              className={view === 'browse' ? 'active' : ''}
              onClick={() => setView('browse')}
              title="Browse"
            >
              🔍
            </button>
            <button 
              className={view === 'favorites' ? 'active' : ''}
              onClick={() => setView('favorites')}
              title={`Favorites (${favorites.length})`}
            >
              ⭐
            </button>
            <button onClick={onClose} title="Close">×</button>
          </div>
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div className="quote-toast">{showToast}</div>
        )}

        {/* Daily Quote View */}
        {view === 'daily' && currentQuote && (
          <div className="quote-content daily-view">
            <div className="daily-badge">Quote of the Day</div>
            
            <div className="quote-card main">
              <div className="quote-category-badge">
                {CATEGORIES[currentQuote.category]?.icon} {CATEGORIES[currentQuote.category]?.label}
              </div>
              
              <blockquote className="quote-text large">
                "{currentQuote.text}"
              </blockquote>
              
              <cite className="quote-author">— {currentQuote.author}</cite>
              
              <div className="quote-actions">
                <button 
                  className={`action-btn ${isFavorited(currentQuote) ? 'active' : ''}`}
                  onClick={() => toggleFavorite(currentQuote)}
                  title={isFavorited(currentQuote) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {isFavorited(currentQuote) ? '⭐' : '☆'}
                </button>
                <button 
                  className="action-btn"
                  onClick={() => copyToClipboard(currentQuote)}
                  title="Copy to clipboard"
                >
                  {copied ? '✓' : '📋'}
                </button>
                <button 
                  className="action-btn"
                  onClick={getRandomQuote}
                  title="Random quote (Space)"
                >
                  🎲
                </button>
              </div>
            </div>

            <div className="quote-navigation">
              <button onClick={getPrevQuote} title="Previous (←)">←</button>
              <span className="quote-counter">
                {QUOTES.indexOf(currentQuote) + 1} / {QUOTES.length}
              </span>
              <button onClick={getNextQuote} title="Next (→)">→</button>
            </div>

            <div className="quote-hint">
              Use ← → arrow keys to navigate, Space for random
            </div>
          </div>
        )}

        {/* Browse View */}
        {view === 'browse' && (
          <div className="quote-content browse-view">
            <div className="category-filters">
              {Object.entries(CATEGORIES).map(([key, { label, icon }]) => (
                <button
                  key={key}
                  className={selectedCategory === key ? 'active' : ''}
                  onClick={() => setSelectedCategory(key)}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            <div className="quotes-grid">
              {filteredQuotes.map((quote, index) => (
                <div key={index} className="quote-card small">
                  <div className="quote-card-header">
                    <span className="category-tag">
                      {CATEGORIES[quote.category]?.icon}
                    </span>
                    <button 
                      className={`favorite-btn ${isFavorited(quote) ? 'active' : ''}`}
                      onClick={() => toggleFavorite(quote)}
                    >
                      {isFavorited(quote) ? '⭐' : '☆'}
                    </button>
                  </div>
                  <blockquote className="quote-text">"{quote.text}"</blockquote>
                  <cite className="quote-author">— {quote.author}</cite>
                  <button 
                    className="copy-btn"
                    onClick={() => copyToClipboard(quote)}
                  >
                    📋 Copy
                  </button>
                </div>
              ))}
            </div>

            <div className="browse-stats">
              Showing {filteredQuotes.length} quotes
              {selectedCategory !== 'all' && ` in ${CATEGORIES[selectedCategory]?.label}`}
            </div>
          </div>
        )}

        {/* Favorites View */}
        {view === 'favorites' && (
          <div className="quote-content favorites-view">
            {favorites.length === 0 ? (
              <div className="empty-favorites">
                <div className="empty-icon">⭐</div>
                <p>No favorites yet</p>
                <span>Click the star icon on any quote to save it here</span>
              </div>
            ) : (
              <>
                <div className="favorites-header">
                  <span>{favorites.length} favorite{favorites.length !== 1 ? 's' : ''}</span>
                  <button 
                    className="clear-favorites"
                    onClick={() => {
                      if (confirm('Clear all favorites?')) {
                        setFavorites([]);
                        localStorage.removeItem('mc-quote-favorites');
                      }
                    }}
                  >
                    Clear All
                  </button>
                </div>
                <div className="quotes-grid">
                  {favorites.map((quote, index) => (
                    <div key={index} className="quote-card small">
                      <div className="quote-card-header">
                        <span className="category-tag">
                          {CATEGORIES[quote.category]?.icon}
                        </span>
                        <button 
                          className="favorite-btn active"
                          onClick={() => toggleFavorite(quote)}
                        >
                          ⭐
                        </button>
                      </div>
                      <blockquote className="quote-text">"{quote.text}"</blockquote>
                      <cite className="quote-author">— {quote.author}</cite>
                      <div className="quote-meta">
                        <span className="saved-date">
                          Saved {new Date(quote.savedAt).toLocaleDateString()}
                        </span>
                        <button 
                          className="copy-btn"
                          onClick={() => copyToClipboard(quote)}
                        >
                          📋 Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
