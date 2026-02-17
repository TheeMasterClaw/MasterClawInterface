import React, { useState, useEffect, useMemo } from 'react';
import './ReadingList.css';

const READING_STATUS = {
  want: { label: 'Want to Read', color: '#8b5cf6', icon: '📚' },
  reading: { label: 'Currently Reading', color: '#3b82f6', icon: '📖' },
  paused: { label: 'On Hold', color: '#f59e0b', icon: '⏸️' },
  finished: { label: 'Finished', color: '#22c55e', icon: '✅' },
  abandoned: { label: 'Abandoned', color: '#ef4444', icon: '🗑️' }
};

const GENRES = [
  { id: 'fiction', label: 'Fiction', icon: '📖' },
  { id: 'nonfiction', label: 'Non-Fiction', icon: '📰' },
  { id: 'scifi', label: 'Sci-Fi', icon: '🚀' },
  { id: 'fantasy', label: 'Fantasy', icon: '🐉' },
  { id: 'biography', label: 'Biography', icon: '👤' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'selfhelp', label: 'Self-Help', icon: '🌱' },
  { id: 'tech', label: 'Technology', icon: '💻' },
  { id: 'history', label: 'History', icon: '🏛️' },
  { id: 'philosophy', label: 'Philosophy', icon: '🤔' },
  { id: 'psychology', label: 'Psychology', icon: '🧠' },
  { id: 'other', label: 'Other', icon: '📦' }
];

const RATINGS = [
  { value: 5, label: 'Masterpiece', emoji: '🤯' },
  { value: 4, label: 'Excellent', emoji: '⭐' },
  { value: 3, label: 'Good', emoji: '👍' },
  { value: 2, label: 'Okay', emoji: '😐' },
  { value: 1, label: 'Poor', emoji: '👎' }
];

export default function ReadingList({ isOpen, onClose }) {
  const [books, setBooks] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [viewingBook, setViewingBook] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGenre, setFilterGenre] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, rating, title, progress

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: 'nonfiction',
    status: 'want',
    totalPages: 0,
    currentPage: 0,
    rating: 0,
    notes: '',
    quotes: [''],
    coverUrl: '',
    startedAt: '',
    finishedAt: ''
  });

  // Load books from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-reading-list');
      if (saved) {
        try {
          setBooks(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse reading list:', e);
        }
      } else {
        // Add some sample books
        const sampleBooks = [
          {
            id: '1',
            title: 'Atomic Habits',
            author: 'James Clear',
            genre: 'selfhelp',
            status: 'finished',
            totalPages: 320,
            currentPage: 320,
            rating: 5,
            notes: 'Great book about building good habits and breaking bad ones.',
            quotes: ['You do not rise to the level of your goals. You fall to the level of your systems.'],
            coverUrl: '',
            startedAt: '2024-01-15',
            finishedAt: '2024-02-01',
            addedAt: '2024-01-10'
          },
          {
            id: '2',
            title: 'The Pragmatic Programmer',
            author: 'Andrew Hunt & David Thomas',
            genre: 'tech',
            status: 'reading',
            totalPages: 352,
            currentPage: 145,
            rating: 0,
            notes: 'Essential reading for software developers.',
            quotes: [],
            coverUrl: '',
            startedAt: '2024-02-05',
            finishedAt: '',
            addedAt: '2024-02-01'
          },
          {
            id: '3',
            title: 'Dune',
            author: 'Frank Herbert',
            genre: 'scifi',
            status: 'want',
            totalPages: 412,
            currentPage: 0,
            rating: 0,
            notes: '',
            quotes: [],
            coverUrl: '',
            startedAt: '',
            finishedAt: '',
            addedAt: '2024-02-10'
          }
        ];
        setBooks(sampleBooks);
        localStorage.setItem('mc-reading-list', JSON.stringify(sampleBooks));
      }
    }
  }, [isOpen]);

  // Save books to localStorage
  const saveBooks = (updatedBooks) => {
    setBooks(updatedBooks);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-reading-list', JSON.stringify(updatedBooks));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.author.trim()) return;

    const bookData = {
      id: editingBook ? editingBook.id : Date.now().toString(),
      ...formData,
      quotes: formData.quotes.filter(q => q.trim()),
      addedAt: editingBook ? editingBook.addedAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingBook) {
      saveBooks(books.map(b => b.id === editingBook.id ? bookData : b));
      setEditingBook(null);
    } else {
      saveBooks([...books, bookData]);
    }

    resetForm();
    setShowAddForm(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      genre: 'nonfiction',
      status: 'want',
      totalPages: 0,
      currentPage: 0,
      rating: 0,
      notes: '',
      quotes: [''],
      coverUrl: '',
      startedAt: '',
      finishedAt: ''
    });
  };

  const deleteBook = (id) => {
    if (confirm('Are you sure you want to remove this book?')) {
      saveBooks(books.filter(b => b.id !== id));
      if (viewingBook?.id === id) {
        setViewingBook(null);
      }
    }
  };

  const startEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      genre: book.genre,
      status: book.status,
      totalPages: book.totalPages || 0,
      currentPage: book.currentPage || 0,
      rating: book.rating || 0,
      notes: book.notes || '',
      quotes: book.quotes?.length > 0 ? [...book.quotes] : [''],
      coverUrl: book.coverUrl || '',
      startedAt: book.startedAt || '',
      finishedAt: book.finishedAt || ''
    });
    setShowAddForm(true);
    setViewingBook(null);
  };

  const updateStatus = (bookId, newStatus) => {
    const updates = { status: newStatus, updatedAt: new Date().toISOString() };
    
    if (newStatus === 'reading' && !books.find(b => b.id === bookId).startedAt) {
      updates.startedAt = new Date().toISOString().split('T')[0];
    }
    if (newStatus === 'finished') {
      updates.finishedAt = new Date().toISOString().split('T')[0];
      updates.currentPage = books.find(b => b.id === bookId).totalPages;
    }

    saveBooks(books.map(b => b.id === bookId ? { ...b, ...updates } : b));
  };

  const updateProgress = (bookId, newPage) => {
    const book = books.find(b => b.id === bookId);
    const validPage = Math.max(0, Math.min(newPage, book.totalPages));
    
    saveBooks(books.map(b => 
      b.id === bookId ? { ...b, currentPage: validPage, updatedAt: new Date().toISOString() } : b
    ));
  };

  const addQuoteField = () => {
    setFormData({ ...formData, quotes: [...formData.quotes, ''] });
  };

  const updateQuote = (index, value) => {
    const newQuotes = [...formData.quotes];
    newQuotes[index] = value;
    setFormData({ ...formData, quotes: newQuotes });
  };

  const removeQuoteField = (index) => {
    setFormData({ ...formData, quotes: formData.quotes.filter((_, i) => i !== index) });
  };

  const getProgress = (book) => {
    if (!book.totalPages) return 0;
    return Math.round((book.currentPage / book.totalPages) * 100);
  };

  const filteredBooks = useMemo(() => {
    let result = [...books];

    if (filterStatus !== 'all') {
      result = result.filter(b => b.status === filterStatus);
    }
    if (filterGenre !== 'all') {
      result = result.filter(b => b.genre === filterGenre);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.title.toLowerCase().includes(query) || 
        b.author.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'progress':
        result.sort((a, b) => getProgress(b) - getProgress(a));
        break;
      case 'recent':
      default:
        result.sort((a, b) => new Date(b.updatedAt || b.addedAt) - new Date(a.updatedAt || a.addedAt));
    }

    return result;
  }, [books, filterStatus, filterGenre, searchQuery, sortBy]);

  const stats = useMemo(() => ({
    total: books.length,
    finished: books.filter(b => b.status === 'finished').length,
    reading: books.filter(b => b.status === 'reading').length,
    want: books.filter(b => b.status === 'want').length,
    pagesRead: books.reduce((acc, b) => acc + (b.currentPage || 0), 0),
    averageRating: books.filter(b => b.rating > 0).length > 0 
      ? (books.filter(b => b.rating > 0).reduce((acc, b) => acc + b.rating, 0) / books.filter(b => b.rating > 0).length).toFixed(1)
      : 0
  }), [books]);

  const getGenreLabel = (genreId) => GENRES.find(g => g.id === genreId)?.label || genreId;
  const getGenreIcon = (genreId) => GENRES.find(g => g.id === genreId)?.icon || '📚';

  if (!isOpen) return null;

  return (
    <div className="reading-panel-overlay" onClick={onClose}>
      <div className="reading-panel" onClick={e => e.stopPropagation()}>
        <div className="reading-panel-header">
          <h3>📚 Reading List</h3>
          <div className="header-actions">
            <button 
              className="add-book-btn"
              onClick={() => {
                setEditingBook(null);
                resetForm();
                setShowAddForm(true);
                setViewingBook(null);
              }}
            >
              + Add Book
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="reading-stats">
          <div className="stat-card">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total Books</span>
          </div>
          <div className="stat-card finished">
            <span className="stat-number">{stats.finished}</span>
            <span className="stat-label">Finished</span>
          </div>
          <div className="stat-card reading">
            <span className="stat-number">{stats.reading}</span>
            <span className="stat-label">Reading</span>
          </div>
          <div className="stat-card pages">
            <span className="stat-number">{stats.pagesRead.toLocaleString()}</span>
            <span className="stat-label">Pages Read</span>
          </div>
          {stats.averageRating > 0 && (
            <div className="stat-card rating">
              <span className="stat-number">{stats.averageRating}⭐</span>
              <span className="stat-label">Avg Rating</span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="reading-filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              {Object.entries(READING_STATUS).map(([key, status]) => (
                <option key={key} value={key}>{status.icon} {status.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <select value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)}>
              <option value="all">All Genres</option>
              {GENRES.map(genre => (
                <option key={genre.id} value={genre.id}>{genre.icon} {genre.label}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="recent">Recently Updated</option>
              <option value="title">Title A-Z</option>
              <option value="rating">Highest Rated</option>
              <option value="progress">Progress</option>
            </select>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="book-form-overlay" onClick={() => setShowAddForm(false)}>
            <form className="book-form" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
              <h4>{editingBook ? '✏️ Edit Book' : '➕ Add New Book'}</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Book title"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Author *</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="Author name"
                    required
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Genre</label>
                  <select
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  >
                    {GENRES.map(genre => (
                      <option key={genre.id} value={genre.id}>{genre.icon} {genre.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {Object.entries(READING_STATUS).map(([key, status]) => (
                      <option key={key} value={key}>{status.icon} {status.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Total Pages</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalPages}
                    onChange={(e) => setFormData({ ...formData, totalPages: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Current Page</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.totalPages}
                    value={formData.currentPage}
                    onChange={(e) => setFormData({ ...formData, currentPage: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {formData.status === 'finished' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Rating</label>
                    <div className="rating-selector">
                      {RATINGS.map(rating => (
                        <button
                          key={rating.value}
                          type="button"
                          className={`rating-btn ${formData.rating === rating.value ? 'selected' : ''}`}
                          onClick={() => setFormData({ ...formData, rating: rating.value })}
                          title={rating.label}
                        >
                          {rating.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Your thoughts about this book..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Favorite Quotes</label>
                  {formData.quotes.map((quote, index) => (
                    <div key={index} className="quote-input-row">
                      <input
                        type="text"
                        value={quote}
                        onChange={(e) => updateQuote(index, e.target.value)}
                        placeholder={`Quote ${index + 1}`}
                      />
                      {formData.quotes.length > 1 && (
                        <button
                          type="button"
                          className="remove-quote-btn"
                          onClick={() => removeQuoteField(index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="add-quote-btn" onClick={addQuoteField}>
                    + Add Quote
                  </button>
                </div>
              </div>

              <div className="form-actions">
                {editingBook && (
                  <button 
                    type="button" 
                    className="btn-delete"
                    onClick={() => {
                      deleteBook(editingBook.id);
                      setShowAddForm(false);
                    }}
                  >
                    🗑️ Delete
                  </button>
                )}
                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingBook ? 'Save Changes' : 'Add Book'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Book Detail View */}
        {viewingBook && !showAddForm && (
          <div className="book-detail-overlay" onClick={() => setViewingBook(null)}>
            <div className="book-detail" onClick={e => e.stopPropagation()}>
              <div className="book-detail-header">
                <div className="book-cover-placeholder">
                  <span>{getGenreIcon(viewingBook.genre)}</span>
                </div>
                <div className="book-detail-info">
                  <h3>{viewingBook.title}</h3>
                  <p className="book-author">by {viewingBook.author}</p>
                  <div className="book-meta">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: READING_STATUS[viewingBook.status]?.color }}
                    >
                      {READING_STATUS[viewingBook.status]?.icon} {READING_STATUS[viewingBook.status]?.label}
                    </span>
                    <span className="genre-badge">
                      {getGenreIcon(viewingBook.genre)} {getGenreLabel(viewingBook.genre)}
                    </span>
                  </div>
                  {viewingBook.rating > 0 && (
                    <div className="book-rating">
                      {RATINGS.find(r => r.value === viewingBook.rating)?.emoji} 
                      {RATINGS.find(r => r.value === viewingBook.rating)?.label}
                    </div>
                  )}
                </div>
                <button className="close-btn" onClick={() => setViewingBook(null)}>×</button>
              </div>

              <div className="book-detail-content">
                {viewingBook.totalPages > 0 && (
                  <div className="progress-section">
                    <div className="progress-header">
                      <span>Progress</span>
                      <span>{viewingBook.currentPage} / {viewingBook.totalPages} pages ({getProgress(viewingBook)}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${getProgress(viewingBook)}%` }}
                      />
                    </div>
                    {viewingBook.status === 'reading' && (
                      <div className="progress-controls">
                        <button onClick={() => updateProgress(viewingBook.id, viewingBook.currentPage - 1)}>-</button>
                        <input 
                          type="number" 
                          value={viewingBook.currentPage}
                          onChange={(e) => updateProgress(viewingBook.id, parseInt(e.target.value) || 0)}
                        />
                        <button onClick={() => updateProgress(viewingBook.id, viewingBook.currentPage + 1)}>+</button>
                      </div>
                    )}
                  </div>
                )}

                {viewingBook.notes && (
                  <div className="detail-section">
                    <h5>📝 Notes</h5>
                    <p>{viewingBook.notes}</p>
                  </div>
                )}

                {viewingBook.quotes?.length > 0 && viewingBook.quotes[0] && (
                  <div className="detail-section">
                    <h5>💬 Quotes</h5>
                    <div className="quotes-list">
                      {viewingBook.quotes.filter(q => q.trim()).map((quote, idx) => (
                        <blockquote key={idx}>"{quote}"</blockquote>
                      ))}
                    </div>
                  </div>
                )}

                {(viewingBook.startedAt || viewingBook.finishedAt) && (
                  <div className="detail-section dates">
                    {viewingBook.startedAt && (
                      <span>📅 Started: {new Date(viewingBook.startedAt).toLocaleDateString()}</span>
                    )}
                    {viewingBook.finishedAt && (
                      <span>✅ Finished: {new Date(viewingBook.finishedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="book-detail-actions">
                <div className="status-actions">
                  {Object.entries(READING_STATUS).map(([key, status]) => (
                    <button
                      key={key}
                      className={viewingBook.status === key ? 'active' : ''}
                      onClick={() => {
                        updateStatus(viewingBook.id, key);
                        setViewingBook({ ...viewingBook, status: key });
                      }}
                      style={{ 
                        backgroundColor: viewingBook.status === key ? status.color : undefined 
                      }}
                    >
                      {status.icon} {status.label}
                    </button>
                  ))}
                </div>
                <button className="edit-btn" onClick={() => startEdit(viewingBook)}>
                  ✏️ Edit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Books Grid */}
        {!showAddForm && !viewingBook && (
          <>
            {filteredBooks.length === 0 ? (
              <div className="empty-books">
                <div className="empty-icon">📚</div>
                <h4>No books found</h4>
                <p>
                  {books.length === 0 
                    ? "Your reading list is empty. Add your first book to get started!"
                    : "No books match your filters. Try adjusting your search."
                  }
                </p>
                {books.length === 0 && (
                  <button onClick={() => setShowAddForm(true)}>Add Your First Book</button>
                )}
              </div>
            ) : (
              <div className="books-grid">
                {filteredBooks.map(book => {
                  const progress = getProgress(book);
                  const status = READING_STATUS[book.status];
                  
                  return (
                    <div 
                      key={book.id} 
                      className={`book-card ${book.status}`}
                      onClick={() => setViewingBook(book)}
                    >
                      <div className="book-card-header">
                        <span 
                          className="status-indicator"
                          style={{ backgroundColor: status.color }}
                          title={status.label}
                        >
                          {status.icon}
                        </span>
                        <span className="genre-tag">
                          {getGenreIcon(book.genre)}
                        </span>
                      </div>

                      <div className="book-cover">
                        <span className="book-icon">{getGenreIcon(book.genre)}</span>
                      </div>

                      <div className="book-info">
                        <h4 className="book-title" title={book.title}>{book.title}</h4>
                        <p className="book-author">{book.author}</p>
                      </div>

                      {book.totalPages > 0 && (
                        <div className="book-progress">
                          <div className="mini-progress-bar">
                            <div 
                              className="mini-progress-fill"
                              style={{ 
                                width: `${progress}%`,
                                backgroundColor: status.color
                              }}
                            />
                          </div>
                          <span className="progress-text">{progress}%</span>
                        </div>
                      )}

                      {book.rating > 0 && (
                        <div className="book-rating-mini">
                          {RATINGS.find(r => r.value === book.rating)?.emoji}
                        </div>
                      )}

                      <div className="book-card-actions" onClick={e => e.stopPropagation()}>
                        {book.status === 'reading' && (
                          <>
                            <button 
                              className="action-btn"
                              onClick={() => updateProgress(book.id, book.currentPage - 10)}
                              title="Go back 10 pages"
                            >
                              -10
                            </button>
                            <button 
                              className="action-btn primary"
                              onClick={() => updateProgress(book.id, book.currentPage + 10)}
                              title="Advance 10 pages"
                            >
                              +10
                            </button>
                          </>
                        )}
                        <button 
                          className="action-btn"
                          onClick={() => startEdit(book)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Reading Stats by Genre */}
            {books.length > 0 && (
              <div className="genre-stats">
                <h4>📊 Reading by Genre</h4>
                <div className="genre-bars">
                  {GENRES.map(genre => {
                    const count = books.filter(b => b.genre === genre.id).length;
                    const finished = books.filter(b => b.genre === genre.id && b.status === 'finished').length;
                    if (count === 0) return null;
                    const pct = Math.round((finished / count) * 100);
                    return (
                      <div key={genre.id} className="genre-bar-item">
                        <div className="genre-bar-header">
                          <span>{genre.icon} {genre.label}</span>
                          <span>{finished}/{count}</span>
                        </div>
                        <div className="genre-bar">
                          <div 
                            className="genre-bar-fill"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
