import React, { useState, useEffect } from 'react';
import './NotesPanel.css';

export default function NotesPanel({ isOpen, onClose }) {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen]);

  const loadNotes = () => {
    const saved = localStorage.getItem('mc-notes');
    if (saved) {
      setNotes(JSON.parse(saved));
    }
  };

  const saveNotes = (updatedNotes) => {
    setNotes(updatedNotes);
    localStorage.setItem('mc-notes', JSON.stringify(updatedNotes));
  };

  const createNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: 'New Note',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newNote, ...notes];
    saveNotes(updated);
    setActiveNote(newNote);
  };

  const updateNote = (id, updates) => {
    const updated = notes.map(n => 
      n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
    );
    saveNotes(updated);
    if (activeNote?.id === id) {
      setActiveNote({ ...activeNote, ...updates, updatedAt: new Date().toISOString() });
    }
  };

  const deleteNote = (id) => {
    const updated = notes.filter(n => n.id !== id);
    saveNotes(updated);
    if (activeNote?.id === id) {
      setActiveNote(null);
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="notes-panel-overlay" onClick={onClose}>
      <div className="notes-panel" onClick={e => e.stopPropagation()}>
        <div className="notes-sidebar">
          <div className="notes-header">
            <h3>📝 Notes</h3>
            <button className="new-note-btn" onClick={createNote}>+ New</button>
          </div>

          <input
            type="text"
            className="notes-search"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />

          <div className="notes-list">
            {filteredNotes.map(note => (
              <div
                key={note.id}
                className={`note-item ${activeNote?.id === note.id ? 'active' : ''}`}
                onClick={() => setActiveNote(note)}
              >
                <div className="note-item-title">{note.title || 'Untitled'}</div>
                <div className="note-item-preview">
                  {note.content.substring(0, 50) || 'No content'}...
                </div>
                <div className="note-item-date">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="notes-editor">
          {activeNote ? (
            <>
              <div className="notes-editor-header">
                <input
                  type="text"
                  className="note-title-input"
                  value={activeNote.title}
                  onChange={e => updateNote(activeNote.id, { title: e.target.value })}
                  placeholder="Note title..."
                />
                <button 
                  className="delete-note-btn"
                  onClick={() => deleteNote(activeNote.id)}
                >
                  🗑️
                </button>
                <button className="close-panel-btn" onClick={onClose}>×</button>
              </div>

              <textarea
                className="note-content-input"
                value={activeNote.content}
                onChange={e => updateNote(activeNote.id, { content: e.target.value })}
                placeholder="Start typing..."
              />

              <div className="note-meta">
                Last edited: {new Date(activeNote.updatedAt).toLocaleString()}
              </div>
            </>
          ) : (
            <div className="no-note-selected">
              <p>Select a note or create a new one</p>
              <button onClick={createNote}>Create Note</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
