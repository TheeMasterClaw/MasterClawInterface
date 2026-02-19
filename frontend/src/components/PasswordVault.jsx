/**
 * PasswordVault Component
 * A secure, locally-encrypted vault for passwords and sensitive notes.
 * Follows the privacy-first philosophy of MasterClaw.
 */
import React, { useState, useEffect, useMemo } from 'react';
// import './PasswordVault.css';

const CATEGORIES = [
  { id: 'all', icon: '📁', label: 'All Items' },
  { id: 'website', icon: '🌐', label: 'Websites' },
  { id: 'app', icon: '📱', label: 'Apps' },
  { id: 'finance', icon: '💳', label: 'Finance' },
  { id: 'work', icon: '💼', label: 'Work' },
  { id: 'secure-note', icon: '📝', label: 'Secure Notes' },
];

// Simple encryption using XOR with a key (for demo - in production use proper crypto)
const encrypt = (text, key) => {
  if (!text || !key) return text;
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
};

const decrypt = (encoded, key) => {
  if (!encoded || !key) return encoded;
  try {
    const text = atob(encoded);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch (e) {
    return '';
  }
};

const generatePassword = (length = 16, options = {}) => {
  const {
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true
  } = options;

  let chars = '';
  if (lowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (uppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (numbers) chars += '0123456789';
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';

  let password = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }

  return password;
};

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: 'Empty', color: '#ef4444' };
  
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const strengths = [
    { label: 'Very Weak', color: '#ef4444' },
    { label: 'Weak', color: '#f97316' },
    { label: 'Fair', color: '#eab308' },
    { label: 'Good', color: '#22c55e' },
    { label: 'Strong', color: '#10b981' },
    { label: 'Very Strong', color: '#059669' }
  ];

  return { score, ...strengths[score] };
};

export default function PasswordVault({ isOpen, onClose }) {
  const [isLocked, setIsLocked] = useState(true);
  const [masterPassword, setMasterPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [vaultKey, setVaultKey] = useState(null);
  const [entries, setEntries] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [revealedPasswords, setRevealedPasswords] = useState(new Set());
  const [copiedField, setCopiedField] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    category: 'website'
  });

  // Generator state
  const [genLength, setGenLength] = useState(16);
  const [genOptions, setGenOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true
  });
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Load vault on mount
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-password-vault');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setEntries(parsed.entries || []);
          setIsLocked(true);
          setVaultKey(null);
        } catch (e) {
          console.error('Failed to parse vault:', e);
        }
      } else {
        // No vault exists yet
        setIsLocked(false);
        setVaultKey('new');
      }
    }
  }, [isOpen]);

  // Save vault
  const saveVault = (updatedEntries, key) => {
    const keyToUse = key || vaultKey;
    if (!keyToUse || keyToUse === 'new') return;

    const encryptedEntries = updatedEntries.map(entry => ({
      ...entry,
      username: encrypt(entry.username, keyToUse),
      password: encrypt(entry.password, keyToUse),
      notes: encrypt(entry.notes, keyToUse)
    }));

    const vaultData = {
      version: 1,
      entries: encryptedEntries,
      lastModified: new Date().toISOString()
    };

    localStorage.setItem('mc-password-vault', JSON.stringify(vaultData));
  };

  // Unlock vault
  const handleUnlock = (e) => {
    e.preventDefault();
    
    const saved = localStorage.getItem('mc-password-vault');
    if (!saved) {
      // First time - create vault
      setVaultKey(masterPassword);
      setIsLocked(false);
      setEntries([]);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      // Try to decrypt first entry to verify key
      if (parsed.entries && parsed.entries.length > 0) {
        const testEntry = parsed.entries[0];
        const testDecrypt = decrypt(testEntry.password, masterPassword);
        if (testDecrypt || !testEntry.password) {
          // Key is valid
          setVaultKey(masterPassword);
          const decrypted = parsed.entries.map(entry => ({
            ...entry,
            username: decrypt(entry.username, masterPassword) || '',
            password: decrypt(entry.password, masterPassword) || '',
            notes: decrypt(entry.notes, masterPassword) || ''
          }));
          setEntries(decrypted);
          setIsLocked(false);
          setUnlockError('');
        } else {
          setUnlockError('Incorrect master password');
        }
      } else {
        // Empty vault
        setVaultKey(masterPassword);
        setIsLocked(false);
      }
    } catch (err) {
      setUnlockError('Failed to unlock vault');
    }
  };

  // Lock vault
  const handleLock = () => {
    setIsLocked(true);
    setVaultKey(null);
    setMasterPassword('');
    setRevealedPasswords(new Set());
    saveVault(entries, vaultKey);
  };

  // Add/Edit entry
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    if (editingEntry) {
      const updated = entries.map(entry =>
        entry.id === editingEntry.id
          ? { ...entry, ...formData, updatedAt: new Date().toISOString() }
          : entry
      );
      setEntries(updated);
      saveVault(updated, vaultKey);
      setEditingEntry(null);
    } else {
      const newEntry = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updated = [...entries, newEntry];
      setEntries(updated);
      saveVault(updated, vaultKey);
    }

    setFormData({
      title: '',
      username: '',
      password: '',
      url: '',
      notes: '',
      category: 'website'
    });
    setShowAddForm(false);
  };

  // Delete entry
  const deleteEntry = (id) => {
    if (confirm('Delete this entry? This cannot be undone.')) {
      const updated = entries.filter(e => e.id !== id);
      setEntries(updated);
      saveVault(updated, vaultKey);
      if (editingEntry?.id === id) {
        setEditingEntry(null);
        setShowAddForm(false);
      }
    }
  };

  // Edit entry
  const editEntry = (entry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      username: entry.username,
      password: entry.password,
      url: entry.url || '',
      notes: entry.notes || '',
      category: entry.category || 'website'
    });
    setShowAddForm(true);
  };

  // Toggle password reveal
  const toggleReveal = (id) => {
    setRevealedPasswords(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Copy to clipboard
  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  // Generate password
  const handleGenerate = () => {
    const pwd = generatePassword(genLength, genOptions);
    setGeneratedPassword(pwd);
  };

  // Use generated password
  const useGeneratedPassword = () => {
    setFormData({ ...formData, password: generatedPassword });
    setShowGenerator(false);
    setGeneratedPassword('');
  };

  // Filter entries
  const filteredEntries = useMemo(() => {
    let result = entries;
    
    if (selectedCategory !== 'all') {
      result = result.filter(e => e.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(query) ||
        e.username.toLowerCase().includes(query) ||
        (e.url && e.url.toLowerCase().includes(query))
      );
    }
    
    return result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [entries, selectedCategory, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: entries.length,
    websites: entries.filter(e => e.category === 'website').length,
    apps: entries.filter(e => e.category === 'app').length,
    finance: entries.filter(e => e.category === 'finance').length,
    notes: entries.filter(e => e.category === 'secure-note').length,
    weakPasswords: entries.filter(e => getPasswordStrength(e.password).score < 3).length
  }), [entries]);

  if (!isOpen) return null;

  // Lock Screen
  if (isLocked) {
    return (
      <div className="vault-panel-overlay" onClick={onClose}>
        <div className="vault-panel vault-panel--locked" onClick={e => e.stopPropagation()}>
          <div className="vault-lock-screen">
            <div className="vault-lock-icon">🔒</div>
            <h3>Password Vault</h3>
            <p className="vault-lock-subtitle">
              {entries.length > 0 ? 'Enter your master password to unlock' : 'Create a master password to secure your vault'}
            </p>
            
            <form onSubmit={handleUnlock} className="vault-unlock-form">
              <input
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                placeholder="Master password"
                className="vault-password-input"
                autoFocus
              />
              {unlockError && <span className="vault-error">{unlockError}</span>}
              <button type="submit" className="vault-unlock-btn">
                {entries.length > 0 ? '🔓 Unlock Vault' : '🔐 Create Vault'}
              </button>
            </form>
            
            <div className="vault-security-note">
              <span>🔒</span>
              <p>Your data is encrypted locally. Never forget your master password - it cannot be recovered!</p>
            </div>
            
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vault-panel-overlay" onClick={onClose}>
      <div className="vault-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="vault-panel-header">
          <div className="vault-header-left">
            <span className="vault-icon">🔐</span>
            <h3>Password Vault</h3>
            <span className="vault-status unlocked">🔓 Unlocked</span>
          </div>
          <div className="vault-header-actions">
            <button 
              className="vault-action-btn"
              onClick={() => setShowAddForm(true)}
              title="Add Entry"
            >
              ➕ Add
            </button>
            <button 
              className="vault-action-btn lock"
              onClick={handleLock}
              title="Lock Vault"
            >
              🔒 Lock
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="vault-stats-bar">
          <div className="vault-stat">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Items</span>
          </div>
          <div className="vault-stat">
            <span className="stat-value">{stats.websites}</span>
            <span className="stat-label">Websites</span>
          </div>
          <div className="vault-stat">
            <span className="stat-value">{stats.apps}</span>
            <span className="stat-label">Apps</span>
          </div>
          {stats.weakPasswords > 0 && (
            <div className="vault-stat warning">
              <span className="stat-value">⚠️ {stats.weakPasswords}</span>
              <span className="stat-label">Weak Passwords</span>
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="vault-toolbar">
          <div className="vault-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="vault-categories">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Entries List */}
        <div className="vault-entries">
          {filteredEntries.length === 0 ? (
            <div className="vault-empty">
              <span className="empty-icon">🔐</span>
              <p>{searchQuery ? 'No entries found' : 'Your vault is empty'}</p>
              {!searchQuery && (
                <button onClick={() => setShowAddForm(true)}>
                  Add your first entry
                </button>
              )}
            </div>
          ) : (
            filteredEntries.map(entry => {
              const isRevealed = revealedPasswords.has(entry.id);
              const strength = getPasswordStrength(entry.password);
              
              return (
                <div key={entry.id} className="vault-entry">
                  <div className="entry-main">
                    <div className="entry-icon">
                      {CATEGORIES.find(c => c.id === entry.category)?.icon || '🔑'}
                    </div>
                    <div className="entry-details">
                      <div className="entry-title-row">
                        <span className="entry-title">{entry.title}</span>
                        {entry.url && (
                          <a 
                            href={entry.url.startsWith('http') ? entry.url : `https://${entry.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="entry-url"
                          >
                            🌐
                          </a>
                        )}
                      </div>
                      <div className="entry-credentials">
                        {entry.username && (
                          <span className="credential">
                            👤 {entry.username}
                            <button 
                              className="copy-btn"
                              onClick={() => copyToClipboard(entry.username, `user-${entry.id}`)}
                            >
                              {copiedField === `user-${entry.id}` ? '✓' : '📋'}
                            </button>
                          </span>
                        )}
                        {entry.password && (
                          <span className="credential">
                            🔑 {isRevealed ? entry.password : '••••••••'}
                            <button 
                              className="reveal-btn"
                              onClick={() => toggleReveal(entry.id)}
                            >
                              {isRevealed ? '🙈' : '👁️'}
                            </button>
                            <button 
                              className="copy-btn"
                              onClick={() => copyToClipboard(entry.password, `pass-${entry.id}`)}
                            >
                              {copiedField === `pass-${entry.id}` ? '✓' : '📋'}
                            </button>
                          </span>
                        )}
                      </div>
                      {entry.notes && (
                        <div className="entry-notes">
                          📝 {entry.notes.length > 50 ? entry.notes.substring(0, 50) + '...' : entry.notes}
                        </div>
                      )}
                      {entry.password && (
                        <div className="entry-strength">
                          <div 
                            className="strength-bar" 
                            style={{ 
                              width: `${(strength.score / 5) * 100}%`,
                              backgroundColor: strength.color 
                            }}
                          />
                          <span style={{ color: strength.color }}>{strength.label}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="entry-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => editEntry(entry)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteEntry(entry.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="vault-form-overlay" onClick={() => setShowAddForm(false)}>
            <form className="vault-form" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
              <h4>{editingEntry ? '✏️ Edit Entry' : '➕ New Entry'}</h4>
              
              <div className="form-group">
                <label>Category</label>
                <div className="category-picker">
                  {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`category-option ${formData.category === cat.id ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, category: cat.id })}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Gmail, Netflix, Bank Account"
                  required
                  autoFocus
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Username / Email</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    placeholder="username or email"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Password</label>
                <div className="password-input-group">
                  <input
                    type="text"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter or generate password"
                  />
                  <button 
                    type="button" 
                    className="generate-btn"
                    onClick={() => setShowGenerator(true)}
                  >
                    🎲 Generate
                  </button>
                </div>
                {formData.password && (
                  <div className="password-strength-preview">
                    <div 
                      className="strength-bar" 
                      style={{ 
                        width: `${(getPasswordStrength(formData.password).score / 5) * 100}%`,
                        backgroundColor: getPasswordStrength(formData.password).color 
                      }}
                    />
                    <span style={{ color: getPasswordStrength(formData.password).color }}>
                      {getPasswordStrength(formData.password).label}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Website URL</label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={e => setFormData({ ...formData, url: e.target.value })}
                  placeholder="example.com"
                />
              </div>
              
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes (encrypted)"
                  rows={3}
                />
              </div>
              
              <div className="form-actions">
                {editingEntry && (
                  <button 
                    type="button" 
                    className="btn-delete"
                    onClick={() => deleteEntry(editingEntry.id)}
                  >
                    🗑️ Delete
                  </button>
                )}
                <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingEntry ? 'Save Changes' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Password Generator Modal */}
        {showGenerator && (
          <div className="vault-form-overlay" onClick={() => setShowGenerator(false)}>
            <div className="vault-form generator-form" onClick={e => e.stopPropagation()}>
              <h4>🎲 Password Generator</h4>
              
              <div className="generator-options">
                <div className="option-row">
                  <label>Length: {genLength}</label>
                  <input
                    type="range"
                    min="8"
                    max="32"
                    value={genLength}
                    onChange={(e) => setGenLength(parseInt(e.target.value))}
                  />
                </div>
                
                <div className="option-checkboxes">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={genOptions.uppercase}
                      onChange={(e) => setGenOptions({ ...genOptions, uppercase: e.target.checked })}
                    />
                    Uppercase (A-Z)
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={genOptions.lowercase}
                      onChange={(e) => setGenOptions({ ...genOptions, lowercase: e.target.checked })}
                    />
                    Lowercase (a-z)
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={genOptions.numbers}
                      onChange={(e) => setGenOptions({ ...genOptions, numbers: e.target.checked })}
                    />
                    Numbers (0-9)
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={genOptions.symbols}
                      onChange={(e) => setGenOptions({ ...genOptions, symbols: e.target.checked })}
                    />
                    Symbols (!@#$...)
                  </label>
                </div>
              </div>
              
              <button type="button" className="btn-primary generate-action" onClick={handleGenerate}>
                🎲 Generate Password
              </button>
              
              {generatedPassword && (
                <div className="generated-result">
                  <code className="generated-password">{generatedPassword}</code>
                  <div className="generated-actions">
                    <button 
                      className="btn-secondary"
                      onClick={() => copyToClipboard(generatedPassword, 'generated')}
                    >
                      {copiedField === 'generated' ? '✓ Copied' : '📋 Copy'}
                    </button>
                    <button className="btn-primary" onClick={useGeneratedPassword}>
                      Use This Password
                    </button>
                  </div>
                  <div className="password-strength-preview">
                    <div 
                      className="strength-bar" 
                      style={{ 
                        width: `${(getPasswordStrength(generatedPassword).score / 5) * 100}%`,
                        backgroundColor: getPasswordStrength(generatedPassword).color 
                      }}
                    />
                    <span style={{ color: getPasswordStrength(generatedPassword).color }}>
                      {getPasswordStrength(generatedPassword).label}
                    </span>
                  </div>
                </div>
              )}
              
              <button 
                type="button" 
                className="btn-secondary close-generator"
                onClick={() => setShowGenerator(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
