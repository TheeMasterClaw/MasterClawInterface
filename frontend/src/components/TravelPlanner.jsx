import React, { useState, useEffect, useMemo } from 'react';
// import './TravelPlanner.css';

const TRIP_STATUSES = [
  { id: 'dreaming', label: 'Dreaming', icon: '💭', color: '#8b5cf6' },
  { id: 'planning', label: 'Planning', icon: '📋', color: '#3b82f6' },
  { id: 'booked', label: 'Booked', icon: '✈️', color: '#f97316' },
  { id: 'upcoming', label: 'Upcoming', icon: '🎒', color: '#22c55e' },
  { id: 'completed', label: 'Completed', icon: '✅', color: '#06b6d4' }
];

const ACCOMMODATION_TYPES = [
  { id: 'hotel', label: 'Hotel', icon: '🏨' },
  { id: 'airbnb', label: 'Airbnb', icon: '🏠' },
  { id: 'hostel', label: 'Hostel', icon: '🛏️' },
  { id: 'resort', label: 'Resort', icon: '🏖️' },
  { id: 'camping', label: 'Camping', icon: '⛺' },
  { id: 'other', label: 'Other', icon: '🏢' }
];

const TRANSPORT_TYPES = [
  { id: 'flight', label: 'Flight', icon: '✈️' },
  { id: 'train', label: 'Train', icon: '🚂' },
  { id: 'car', label: 'Car/Rental', icon: '🚗' },
  { id: 'bus', label: 'Bus', icon: '🚌' },
  { id: 'cruise', label: 'Cruise', icon: '🚢' },
  { id: 'other', label: 'Other', icon: '🚀' }
];

const PACKING_CATEGORIES = [
  { id: 'clothing', label: 'Clothing', icon: '👕' },
  { id: 'toiletries', label: 'Toiletries', icon: '🧴' },
  { id: 'electronics', label: 'Electronics', icon: '📱' },
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'medicine', label: 'Medicine', icon: '💊' },
  { id: 'misc', label: 'Miscellaneous', icon: '🎒' }
];

const QUICK_DESTINATIONS = [
  'Tokyo, Japan', 'Paris, France', 'New York, USA', 'Bali, Indonesia',
  'London, UK', 'Rome, Italy', 'Barcelona, Spain', 'Dubai, UAE',
  'Sydney, Australia', 'Reykjavik, Iceland', 'Bangkok, Thailand',
  'Cape Town, South Africa', 'Rio de Janeiro, Brazil', 'Istanbul, Turkey',
  'Amsterdam, Netherlands', 'Prague, Czech Republic', 'Singapore',
  'Vancouver, Canada', 'Marrakech, Morocco', 'Auckland, New Zealand'
];

export default function TravelPlanner({ isOpen, onClose }) {
  const [trips, setTrips] = useState([]);
  const [activeTab, setActiveTab] = useState('trips'); // trips, wishlist, packing
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    destination: '',
    country: '',
    startDate: '',
    endDate: '',
    status: 'dreaming',
    budget: '',
    notes: '',
    accommodation: { type: '', name: '', confirmation: '' },
    transport: { type: '', details: '', confirmation: '' }
  });

  // Load trips from localStorage
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('mc-travel-planner');
      if (saved) {
        try {
          setTrips(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse travel data:', e);
        }
      } else {
        // Add sample trips
        const today = new Date();
        const sampleTrips = [
          {
            id: '1',
            destination: 'Kyoto',
            country: 'Japan',
            startDate: new Date(today.getTime() + 45 * 86400000).toISOString().split('T')[0],
            endDate: new Date(today.getTime() + 52 * 86400000).toISOString().split('T')[0],
            status: 'planning',
            budget: 3500,
            spent: 1200,
            notes: 'Cherry blossom season! Book hotels early.',
            accommodation: { type: 'hotel', name: 'Ryokan Sakura', confirmation: 'ABC123' },
            transport: { type: 'flight', details: 'JFK → NRT', confirmation: 'JL045' },
            packingList: [
              { id: 'p1', category: 'clothing', item: 'Comfortable walking shoes', packed: false },
              { id: 'p2', category: 'documents', item: 'Passport', packed: true },
              { id: 'p3', category: 'electronics', item: 'Universal adapter', packed: false }
            ],
            createdAt: today.toISOString()
          },
          {
            id: '2',
            destination: 'Santorini',
            country: 'Greece',
            startDate: new Date(today.getTime() + 180 * 86400000).toISOString().split('T')[0],
            endDate: new Date(today.getTime() + 187 * 86400000).toISOString().split('T')[0],
            status: 'dreaming',
            budget: 2500,
            spent: 0,
            notes: 'Summer getaway. Research best sunset spots.',
            accommodation: { type: 'airbnb', name: '', confirmation: '' },
            transport: { type: 'flight', details: '', confirmation: '' },
            packingList: [],
            createdAt: new Date(today.getTime() - 86400000).toISOString()
          },
          {
            id: '3',
            destination: 'Barcelona',
            country: 'Spain',
            startDate: new Date(today.getTime() - 30 * 86400000).toISOString().split('T')[0],
            endDate: new Date(today.getTime() - 25 * 86400000).toISOString().split('T')[0],
            status: 'completed',
            budget: 1800,
            spent: 1650,
            notes: 'Amazing architecture and food! Gaudi tour was highlight.',
            accommodation: { type: 'hotel', name: 'Hotel Arts', confirmation: 'HA789' },
            transport: { type: 'flight', details: 'BOS → BCN', confirmation: 'IB456' },
            packingList: [],
            createdAt: new Date(today.getTime() - 60 * 86400000).toISOString()
          }
        ];
        setTrips(sampleTrips);
        localStorage.setItem('mc-travel-planner', JSON.stringify(sampleTrips));
      }
    }
  }, [isOpen]);

  // Save to localStorage
  const saveTrips = (newTrips) => {
    setTrips(newTrips);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mc-travel-planner', JSON.stringify(newTrips));
    }
  };

  // Filter trips
  const filteredTrips = useMemo(() => {
    let filtered = trips;
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }
    // Sort: upcoming first, then by start date
    return filtered.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }, [trips, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const totalTrips = trips.length;
    const completed = trips.filter(t => t.status === 'completed').length;
    const upcoming = trips.filter(t => ['booked', 'upcoming'].includes(t.status)).length;
    const totalBudget = trips.reduce((sum, t) => sum + (t.budget || 0), 0);
    const totalSpent = trips.reduce((sum, t) => sum + (t.spent || 0), 0);
    const countries = [...new Set(trips.map(t => t.country).filter(Boolean))].length;
    return { totalTrips, completed, upcoming, totalBudget, totalSpent, countries };
  }, [trips]);

  // Countdown for upcoming trips
  const getDaysUntil = (dateString) => {
    const days = Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const handleAddTrip = () => {
    if (!formData.destination || !formData.startDate) return;
    
    const newTrip = {
      id: Date.now().toString(),
      ...formData,
      spent: 0,
      packingList: generateDefaultPackingList(),
      createdAt: new Date().toISOString()
    };
    
    saveTrips([...trips, newTrip]);
    setShowAddForm(false);
    resetForm();
  };

  const generateDefaultPackingList = () => {
    const defaults = [
      { id: `p${Date.now()}-1`, category: 'documents', item: 'Passport/ID', packed: false },
      { id: `p${Date.now()}-2`, category: 'electronics', item: 'Phone & charger', packed: false },
      { id: `p${Date.now()}-3`, category: 'clothing', item: 'Underwear', packed: false },
      { id: `p${Date.now()}-4`, category: 'toiletries', item: 'Toothbrush & toothpaste', packed: false },
      { id: `p${Date.now()}-5`, category: 'medicine', item: 'Prescription medications', packed: false }
    ];
    return defaults;
  };

  const resetForm = () => {
    setFormData({
      destination: '',
      country: '',
      startDate: '',
      endDate: '',
      status: 'dreaming',
      budget: '',
      notes: '',
      accommodation: { type: '', name: '', confirmation: '' },
      transport: { type: '', details: '', confirmation: '' }
    });
  };

  const handleDeleteTrip = (id) => {
    if (confirm('Delete this trip?')) {
      saveTrips(trips.filter(t => t.id !== id));
      if (selectedTrip?.id === id) setSelectedTrip(null);
    }
  };

  const handleUpdateStatus = (tripId, newStatus) => {
    saveTrips(trips.map(t => 
      t.id === tripId ? { ...t, status: newStatus } : t
    ));
    if (selectedTrip?.id === tripId) {
      setSelectedTrip({ ...selectedTrip, status: newStatus });
    }
  };

  const togglePackingItem = (tripId, itemId) => {
    saveTrips(trips.map(t => {
      if (t.id !== tripId) return t;
      return {
        ...t,
        packingList: t.packingList.map(p => 
          p.id === itemId ? { ...p, packed: !p.packed } : p
        )
      };
    }));
  };

  const addPackingItem = (tripId, category, item) => {
    if (!item.trim()) return;
    saveTrips(trips.map(t => {
      if (t.id !== tripId) return t;
      return {
        ...t,
        packingList: [...t.packingList, {
          id: `p${Date.now()}`,
          category,
          item: item.trim(),
          packed: false
        }]
      };
    }));
  };

  const deletePackingItem = (tripId, itemId) => {
    saveTrips(trips.map(t => {
      if (t.id !== tripId) return t;
      return {
        ...t,
        packingList: t.packingList.filter(p => p.id !== itemId)
      };
    }));
  };

  const updateBudget = (tripId, field, value) => {
    saveTrips(trips.map(t => 
      t.id === tripId ? { ...t, [field]: parseFloat(value) || 0 } : t
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="travel-planner-overlay" onClick={onClose}>
      <div className="travel-planner-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="travel-planner-header">
          <div className="travel-planner-title">
            <span className="travel-planner-icon">🧳</span>
            <div>
              <h2>Travel Planner</h2>
              <p className="travel-planner-subtitle">Plan trips, track adventures, organize journeys</p>
            </div>
          </div>
          <button className="travel-planner-close" onClick={onClose}>×</button>
        </div>

        {/* Stats Bar */}
        <div className="travel-planner-stats">
          <div className="travel-stat">
            <span className="travel-stat-value">{stats.totalTrips}</span>
            <span className="travel-stat-label">Trips</span>
          </div>
          <div className="travel-stat">
            <span className="travel-stat-value">{stats.countries}</span>
            <span className="travel-stat-label">Countries</span>
          </div>
          <div className="travel-stat">
            <span className="travel-stat-value">{stats.completed}</span>
            <span className="travel-stat-label">Completed</span>
          </div>
          <div className="travel-stat">
            <span className="travel-stat-value">{stats.upcoming}</span>
            <span className="travel-stat-label">Upcoming</span>
          </div>
          <div className="travel-stat">
            <span className="travel-stat-value">${stats.totalSpent.toLocaleString()}</span>
            <span className="travel-stat-label">Total Spent</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="travel-planner-tabs">
          <button 
            className={activeTab === 'trips' ? 'active' : ''}
            onClick={() => { setActiveTab('trips'); setSelectedTrip(null); }}
          >
            🗺️ My Trips
          </button>
          <button 
            className={activeTab === 'packing' ? 'active' : ''}
            onClick={() => setActiveTab('packing')}
          >
            📦 Packing Lists
          </button>
          <button 
            className={activeTab === 'wishlist' ? 'active' : ''}
            onClick={() => setActiveTab('wishlist')}
          >
            💫 Wishlist
          </button>
        </div>

        {/* Content */}
        <div className="travel-planner-content">
          {activeTab === 'trips' && !selectedTrip && (
            <>
              {/* Filters */}
              <div className="travel-filters">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All Trips</option>
                  {TRIP_STATUSES.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                  ))}
                </select>
                <button className="travel-add-btn" onClick={() => setShowAddForm(true)}>
                  + Add Trip
                </button>
              </div>

              {/* Trips Grid */}
              <div className="trips-grid">
                {filteredTrips.map(trip => {
                  const status = TRIP_STATUSES.find(s => s.id === trip.status);
                  const daysUntil = getDaysUntil(trip.startDate);
                  const isUpcoming = daysUntil > 0 && trip.status !== 'completed';
                  
                  return (
                    <div 
                      key={trip.id} 
                      className="trip-card"
                      style={{ borderLeftColor: status?.color }}
                      onClick={() => setSelectedTrip(trip)}
                    >
                      <div className="trip-card-header">
                        <h3>{trip.destination}</h3>
                        <span className="trip-status" style={{ background: status?.color }}>
                          {status?.icon} {status?.label}
                        </span>
                      </div>
                      <p className="trip-country">{trip.country}</p>
                      <div className="trip-dates">
                        <span>📅 {new Date(trip.startDate).toLocaleDateString()}</span>
                        {trip.endDate && (
                          <span> → {new Date(trip.endDate).toLocaleDateString()}</span>
                        )}
                      </div>
                      {isUpcoming && (
                        <div className="trip-countdown">
                          ⏰ {daysUntil} day{daysUntil !== 1 ? 's' : ''} until departure
                        </div>
                      )}
                      {trip.budget > 0 && (
                        <div className="trip-budget-preview">
                          <div className="budget-bar">
                            <div 
                              className="budget-progress" 
                              style={{ 
                                width: `${Math.min((trip.spent / trip.budget) * 100, 100)}%`,
                                background: trip.spent > trip.budget ? '#ef4444' : status?.color
                              }}
                            />
                          </div>
                          <span>${trip.spent.toLocaleString()} / ${trip.budget.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {filteredTrips.length === 0 && (
                <div className="travel-empty">
                  <span className="travel-empty-icon">🌍</span>
                  <p>No trips found. Start planning your next adventure!</p>
                  <button onClick={() => setShowAddForm(true)}>Add Your First Trip</button>
                </div>
              )}
            </>
          )}

          {activeTab === 'trips' && selectedTrip && (
            <div className="trip-detail">
              <button className="trip-back" onClick={() => setSelectedTrip(null)}>
                ← Back to trips
              </button>
              
              <div className="trip-detail-header">
                <div>
                  <h2>{selectedTrip.destination}</h2>
                  <p>{selectedTrip.country}</p>
                </div>
                <select 
                  value={selectedTrip.status}
                  onChange={e => handleUpdateStatus(selectedTrip.id, e.target.value)}
                  style={{ background: TRIP_STATUSES.find(s => s.id === selectedTrip.status)?.color }}
                >
                  {TRIP_STATUSES.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                  ))}
                </select>
              </div>

              <div className="trip-detail-grid">
                <div className="trip-detail-section">
                  <h4>📅 Dates</h4>
                  <p><strong>Start:</strong> {new Date(selectedTrip.startDate).toLocaleDateString()}</p>
                  {selectedTrip.endDate && (
                    <p><strong>End:</strong> {new Date(selectedTrip.endDate).toLocaleDateString()}</p>
                  )}
                  {getDaysUntil(selectedTrip.startDate) > 0 && selectedTrip.status !== 'completed' && (
                    <p className="countdown-highlight">
                      ⏰ {getDaysUntil(selectedTrip.startDate)} days until departure
                    </p>
                  )}
                </div>

                <div className="trip-detail-section">
                  <h4>💰 Budget</h4>
                  <div className="budget-inputs">
                    <label>
                      Budget: $
                      <input 
                        type="number" 
                        value={selectedTrip.budget || ''}
                        onChange={e => updateBudget(selectedTrip.id, 'budget', e.target.value)}
                      />
                    </label>
                    <label>
                      Spent: $
                      <input 
                        type="number" 
                        value={selectedTrip.spent || ''}
                        onChange={e => updateBudget(selectedTrip.id, 'spent', e.target.value)}
                      />
                    </label>
                  </div>
                  {selectedTrip.budget > 0 && (
                    <div className="budget-progress-bar">
                      <div 
                        className="budget-progress-fill"
                        style={{ 
                          width: `${Math.min((selectedTrip.spent / selectedTrip.budget) * 100, 100)}%`,
                          background: selectedTrip.spent > selectedTrip.budget ? '#ef4444' : '#22c55e'
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="trip-detail-section">
                  <h4>🏨 Accommodation</h4>
                  {selectedTrip.accommodation?.name ? (
                    <>
                      <p><strong>{selectedTrip.accommodation.name}</strong></p>
                      <p>{ACCOMMODATION_TYPES.find(a => a.id === selectedTrip.accommodation.type)?.icon} {ACCOMMODATION_TYPES.find(a => a.id === selectedTrip.accommodation.type)?.label}</p>
                      {selectedTrip.accommodation.confirmation && (
                        <p className="confirmation">Confirmation: {selectedTrip.accommodation.confirmation}</p>
                      )}
                    </>
                  ) : (
                    <p className="empty">No accommodation details yet</p>
                  )}
                </div>

                <div className="trip-detail-section">
                  <h4>✈️ Transport</h4>
                  {selectedTrip.transport?.details ? (
                    <>
                      <p>{TRANSPORT_TYPES.find(t => t.id === selectedTrip.transport.type)?.icon} {selectedTrip.transport.details}</p>
                      {selectedTrip.transport.confirmation && (
                        <p className="confirmation">Confirmation: {selectedTrip.transport.confirmation}</p>
                      )}
                    </>
                  ) : (
                    <p className="empty">No transport details yet</p>
                  )}
                </div>
              </div>

              {selectedTrip.notes && (
                <div className="trip-notes">
                  <h4>📝 Notes</h4>
                  <p>{selectedTrip.notes}</p>
                </div>
              )}

              <button 
                className="trip-delete-btn"
                onClick={() => handleDeleteTrip(selectedTrip.id)}
              >
                🗑️ Delete Trip
              </button>
            </div>
          )}

          {activeTab === 'packing' && (
            <div className="packing-view">
              <select 
                className="packing-trip-select"
                value={selectedTrip?.id || ''}
                onChange={e => {
                  const trip = trips.find(t => t.id === e.target.value);
                  setSelectedTrip(trip || null);
                }}
              >
                <option value="">Select a trip to pack for...</option>
                {trips.filter(t => t.status !== 'completed').map(trip => (
                  <option key={trip.id} value={trip.id}>
                    {trip.destination} ({new Date(trip.startDate).toLocaleDateString()})
                  </option>
                ))}
              </select>

              {selectedTrip && (
                <div className="packing-list">
                  <h3>📦 Packing List for {selectedTrip.destination}</h3>
                  
                  {PACKING_CATEGORIES.map(category => {
                    const items = selectedTrip.packingList?.filter(p => p.category === category.id) || [];
                    const packed = items.filter(i => i.packed).length;
                    
                    return (
                      <div key={category.id} className="packing-category">
                        <h4>{category.icon} {category.label} 
                          <span className="packing-progress">({packed}/{items.length})</span>
                        </h4>
                        
                        <div className="packing-items">
                          {items.map(item => (
                            <label key={item.id} className={item.packed ? 'packed' : ''}>
                              <input 
                                type="checkbox"
                                checked={item.packed}
                                onChange={() => togglePackingItem(selectedTrip.id, item.id)}
                              />
                              <span>{item.item}</span>
                              <button 
                                className="delete-item"
                                onClick={() => deletePackingItem(selectedTrip.id, item.id)}
                              >
                                ×
                              </button>
                            </label>
                          ))}
                        </div>
                        
                        <AddPackingItem 
                          category={category.id}
                          onAdd={(item) => addPackingItem(selectedTrip.id, category.id, item)}
                        />
                      </div>
                    );
                  })}
                  
                  <div className="packing-summary">
                    <h4>📊 Packing Summary</h4>
                    <p>
                      {selectedTrip.packingList?.filter(p => p.packed).length || 0} of {selectedTrip.packingList?.length || 0} items packed
                      {' '}({Math.round(((selectedTrip.packingList?.filter(p => p.packed).length || 0) / (selectedTrip.packingList?.length || 1)) * 100)}%)
                    </p>
                    <div className="packing-progress-bar">
                      <div 
                        className="packing-progress-fill"
                        style={{ 
                          width: `${((selectedTrip.packingList?.filter(p => p.packed).length || 0) / (selectedTrip.packingList?.length || 1)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {!selectedTrip && (
                <div className="travel-empty">
                  <span className="travel-empty-icon">🎒</span>
                  <p>Select a trip to manage your packing list</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div className="wishlist-view">
              <h3>💫 Dream Destinations</h3>
              <p className="wishlist-subtitle">Places you want to visit someday</p>
              
              <div className="destinations-grid">
                {QUICK_DESTINATIONS.map(dest => {
                  const isPlanned = trips.some(t => t.destination.includes(dest.split(',')[0]));
                  return (
                    <button 
                      key={dest}
                      className={`destination-card ${isPlanned ? 'planned' : ''}`}
                      onClick={() => {
                        const [city, country] = dest.split(', ');
                        setFormData(prev => ({ ...prev, destination: city, country }));
                        setShowAddForm(true);
                        setActiveTab('trips');
                      }}
                    >
                      <span className="dest-name">{dest}</span>
                      {isPlanned && <span className="dest-badge">Planned</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Trip Modal */}
      {showAddForm && (
        <div className="travel-modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="travel-modal" onClick={e => e.stopPropagation()}>
            <h3>✈️ Add New Trip</h3>
            
            <div className="travel-form-group">
              <label>Destination *</label>
              <input 
                type="text"
                value={formData.destination}
                onChange={e => setFormData({...formData, destination: e.target.value})}
                placeholder="e.g., Paris"
              />
            </div>

            <div className="travel-form-group">
              <label>Country</label>
              <input 
                type="text"
                value={formData.country}
                onChange={e => setFormData({...formData, country: e.target.value})}
                placeholder="e.g., France"
              />
            </div>

            <div className="travel-form-row">
              <div className="travel-form-group">
                <label>Start Date *</label>
                <input 
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div className="travel-form-group">
                <label>End Date</label>
                <input 
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="travel-form-row">
              <div className="travel-form-group">
                <label>Status</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  {TRIP_STATUSES.map(s => (
                    <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                  ))}
                </select>
              </div>
              <div className="travel-form-group">
                <label>Budget ($)</label>
                <input 
                  type="number"
                  value={formData.budget}
                  onChange={e => setFormData({...formData, budget: e.target.value})}
                  placeholder="3000"
                />
              </div>
            </div>

            <div className="travel-form-group">
              <label>Notes</label>
              <textarea 
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                placeholder="Trip notes, ideas, reminders..."
                rows={3}
              />
            </div>

            <div className="travel-modal-actions">
              <button className="travel-btn-secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
              <button 
                className="travel-btn-primary"
                onClick={handleAddTrip}
                disabled={!formData.destination || !formData.startDate}
              >
                Add Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddPackingItem({ category, onAdd }) {
  const [value, setValue] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(value);
    setValue('');
  };
  
  return (
    <form className="add-packing-item" onSubmit={handleSubmit}>
      <input 
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Add item..."
      />
      <button type="submit" disabled={!value.trim()}>+</button>
    </form>
  );
}