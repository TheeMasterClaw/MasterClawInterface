import React, { useState, useEffect } from 'react';
import './ReadingTracker.css';

import { getApiUrl } from '../lib/apiUrl';

const API_URL = getApiUrl();

const READING_TYPES = [
  { id: 'book', name: 'Book', icon: '📚' },
  { id: 'article', name: 'Article', icon: '📄' }
];

const STATUS_OPTIONS = [
  { id: 'want-to-read', name: 'Want to Read', icon: '📋', color: '#48dbfb' },
  { id: 'reading', name: 'Reading', icon: '📖', color: '#feca57' },
  { id: 'finished', name: 'Finished', icon: '✅', color: '#1dd1a1' }
];

const GENRES = [
  'Fiction', 'Non-Fiction', 'Sci-Fi', 'Fantasy', 'Mystery', 'Thriller',
  'Romance', 'Biography', 'History', 'Science', 'Technology', 'Self-Help',
  'Business', 'Philosophy', 'Poetry', 'Other'
];

export default function ReadingTracker({ isOpen, onClose }) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [updatePage, setUpdatePage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    type: 'book',
    totalPages: '',
    genre: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/reading`),
        fetch(`${API_URL}/reading/stats`)
      ]);

      setItems((await itemsRes.json()).items || []);
      setStats(await statsRes.json());
    } catch (err) {
      console.error('Failed to fetch reading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await fetch(`${API_URL}/reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      setFormData({
        title: '',
        author: '',
        type: 'book',
        totalPages: '',
        genre: '',
        notes: ''
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      await fetch(`${API_URL}/reading/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      fetchData();
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  const handleUpdatePage = async (id) => {
    const page = parseInt(updatePage);
    if (!page || page < 0) return;

    await handleUpdate(id, { currentPage: page });
    setEditingItem(null);
    setUpdatePage('');
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this item?')) return;

    try {
      await fetch(`${API_URL}/reading/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const getFilteredItems = () => {
    if (filter === 'all') return items;
    return items.filter(i => i.status === filter);
  };

  const getTypeInfo = (typeId) => READING_TYPES.find(t => t.id === typeId) || READING_TYPES[0];
  const getStatusInfo = (statusId) => STATUS_OPTIONS.find(s => s.id === statusId) || STATUS_OPTIONS[0];

  const getProgressPercent = (current, total) => {
    if (!total) return 0;
    return Math.round((current / total) * 100);
  };

  if (!isOpen) return null;

  return (
    <div className="reading-tracker-overlay" onClick={onClose}>
      <div className="reading-tracker-panel" onClick={e => e.stopPropagation()}>
        <div className="reading-tracker-header">
          <div className="header-title">
            <span className="header-icon">📖</span>
            <h2>Reading Tracker</h2>
            {stats && (
              <span className="header-stats">
                {stats.finished} finished · {stats.totalPagesRead} pages
              </span>
            )}
          </div>
          <div className="header-actions">
            <button
              className="btn-primary small"
              onClick={() => setShowForm(true)}
            >
              ➕ Add
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Currently Reading */}
        {stats?.currentBook && (
          <div className="current-reading-card">
            <div className="current-header">
              <span className="current-label">📖 Currently Reading</span>
              <button
                className="btn-update-page"
                onClick={() => {
                  setEditingItem(stats.currentBook);
                  setUpdatePage(String(stats.currentBook.currentPage));
                }}
              >
                Update Page
              </button>
            </div>
            <h3>{stats.currentBook.title}</h3>
            {stats.currentBook.author && (
              <div className="current-author">by {stats.currentBook.author}</div>
            )}

            <div className="reading-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${getProgressPercent(stats.currentBook.currentPage, stats.currentBook.totalPages)}%`
                  }}
                />
              </div>
              <div className="progress-info">
                <span>Page {stats.currentBook.currentPage} of {stats.currentBook.totalPages}</span>
                <span>{getProgressPercent(stats.currentBook.currentPage, stats.currentBook.totalPages)}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Update Page Modal */}
        {editingItem && (
          <div className="modal-overlay" onClick={() => setEditingItem(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Update Progress</h3>
              <p>{editingItem.title}</p>

              <input
                type="number"
                placeholder="Current page"
                value={updatePage}
                onChange={(e) => setUpdatePage(e.target.value)}
                min="0"
                max={editingItem.totalPages}
              />

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setEditingItem(null)}>Cancel</button>
                <button
                  className="btn-primary"
                  onClick={() => handleUpdatePage(editingItem.id)}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        {stats && (
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.reading}</span>
              <span className="stat-label">Reading</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.finished}</span>
              <span className="stat-label">Finished</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.totalPagesRead}</span>
              <span className="stat-label">Pages</span>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {[
            { id: 'all', name: 'All', icon: '📚' },
            { id: 'reading', name: 'Reading', icon: '📖' },
            { id: 'want-to-read', name: 'Want to Read', icon: '📋' },
            { id: 'finished', name: 'Finished', icon: '✅' }
          ].map(f => (
            <button
              key={f.id}
              className={`filter-tab ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.icon} {f.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="reading-content">
          {loading ? (
            <div className="loading-state">⏳ Loading...</div>
          ) : (
            <>
              {/* Add Form */}
              {showForm && (
                <div className="add-form">
                  <h3>Add to Reading List</h3>

                  <form onSubmit={handleSubmit}>
                    <input
                      type="text"
                      placeholder="Title *"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />

                    <input
                      type="text"
                      placeholder="Author"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    />

                    <div className="form-row">
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        {READING_TYPES.map(t => (
                          <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                        ))}
                      </select>

                      <select
                        value={formData.genre}
                        onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                      >
                        <option value="">Select genre</option>
                        {GENRES.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="number"
                      placeholder="Total pages"
                      value={formData.totalPages}
                      onChange={(e) => setFormData({ ...formData, totalPages: e.target.value })}
                    />

                    <textarea
                      placeholder="Notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                    />

                    <div className="form-actions">
                      <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary">Add</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Items List */}
              {getFilteredItems().length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📚</div>
                  <h3>No items yet</h3>
                  <p>Start building your reading list!</p>
                  <button className="btn-primary" onClick={() => setShowForm(true)}>
                    Add First Item
                  </button>
                </div>
              ) : (
                <div className="reading-list">
                  {getFilteredItems().map(item => (
                    <div
                      key={item.id}
                      className={`reading-card ${item.status}`}
                      style={{ '--status-color': getStatusInfo(item.status).color }}
                    >
                      <div className="card-status-bar" />

                      <div className="card-content">
                        <div className="card-header">
                          <div className="card-type">
                            <span className="type-icon">{getTypeInfo(item.type).icon}</span>
                            <span>{getTypeInfo(item.type).name}</span>
                          </div>

                          <div className="card-actions">
                            {item.status === 'want-to-read' && (
                              <button
                                onClick={() => handleUpdate(item.id, { status: 'reading' })}
                                title="Start reading"
                              >
                                📖
                              </button>
                            )}

                            {item.status === 'reading' && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingItem(item);
                                    setUpdatePage(String(item.currentPage));
                                  }}
                                  title="Update page"
                                >
                                  📄
                                </button>
                                <button
                                  onClick={() => handleUpdate(item.id, { status: 'finished' })}
                                  title="Mark finished"
                                >
                                  ✅
                                </button>
                              </>
                            )}

                            <button onClick={() => handleDelete(item.id)} title="Remove">🗑️</button>
                          </div>
                        </div>

                        <h4 className="card-title">{item.title}</h4>

                        {item.author && (
                          <div className="card-author">by {item.author}</div>
                        )}

                        {item.genre && (
                          <span className="genre-tag">{item.genre}</span>
                        )}

                        {item.totalPages > 0 && (
                          <div className="page-progress">
                            <div className="mini-progress-bar">
                              <div
                                className="mini-progress-fill"
                                style={{
                                  width: `${getProgressPercent(item.currentPage, item.totalPages)}%`
                                }}
                              />
                            </div>
                            <span className="page-info">
                              {item.currentPage || 0} / {item.totalPages} pages
                              {item.status === 'finished' && ' ✓'}
                            </span>
                          </div>
                        )}

                        {item.notes && (
                          <p className="card-notes">{item.notes}</p>
                        )}

                        <div className="card-footer">
                          <span className={`status-badge ${item.status}`}>
                            {getStatusInfo(item.status).icon} {getStatusInfo(item.status).name}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
