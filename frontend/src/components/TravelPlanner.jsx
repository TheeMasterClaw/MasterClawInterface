import React, { useState, useEffect } from 'react';
import './TravelPlanner.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const TRIP_PURPOSES = [
  { id: 'leisure', name: 'Leisure', icon: '🏖️' },
  { id: 'business', name: 'Business', icon: '💼' },
  { id: 'adventure', name: 'Adventure', icon: '🏔️' },
  { id: 'family', name: 'Family', icon: '👨‍👩‍👧‍👦' },
  { id: 'romantic', name: 'Romantic', icon: '❤️' },
  { id: 'other', name: 'Other', icon: '📌' }
];

const PACKING_CATEGORIES = [
  { id: 'clothing', name: 'Clothing', icon: '👕' },
  { id: 'toiletries', name: 'Toiletries', icon: '🧴' },
  { id: 'electronics', name: 'Electronics', icon: '🔌' },
  { id: 'documents', name: 'Documents', icon: '📄' },
  { id: 'medical', name: 'Medical', icon: '💊' },
  { id: 'other', name: 'Other', icon: '📦' }
];

const BOOKING_TYPES = [
  { id: 'flight', name: 'Flight', icon: '✈️' },
  { id: 'hotel', name: 'Hotel', icon: '🏨' },
  { id: 'car', name: 'Car Rental', icon: '🚗' },
  { id: 'activity', name: 'Activity', icon: '🎫' },
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
  { id: 'other', name: 'Other', icon: '📌' }
];

export default function TravelPlanner({ isOpen, onClose }) {
  const [trips, setTrips] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showTripForm, setShowTripForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tripsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/travel`),
        fetch(`${API_URL}/travel/stats`)
      ]);
      
      setTrips((await tripsRes.json()).trips || []);
      setStats(await statsRes.json());
    } catch (err) {
      console.error('Failed to fetch travel data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTrips = () => {
    const now = new Date();
    
    switch (activeTab) {
      case 'upcoming':
        return trips.filter(t => new Date(t.startDate) >= now);
      case 'past':
        return trips.filter(t => new Date(t.endDate) < now).reverse();
      case 'current':
        return trips.filter(t => {
          const start = new Date(t.startDate);
          const end = new Date(t.endDate);
          return start <= now && end >= now;
        });
      default:
        return trips;
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (!isOpen) return null;

  return (
    <div className="travel-planner-overlay" onClick={onClose}>
      <div className="travel-planner-panel" onClick={e => e.stopPropagation()}>
        <div className="travel-planner-header">
          <div className="header-title">
            <span className="header-icon">✈️</span>
            <h2>Travel Planner</h2>
            {stats && (
              <span className="header-stats">
                {stats.upcoming} upcoming · {stats.countriesVisited} countries
              </span>
            )}
          </div>
          <div className="header-actions">
            {!selectedTrip ? (
              <button 
                className="btn-primary small"
                onClick={() => setShowTripForm(true)}
              >
                ➕ New Trip
              </button>
            ) : (
              <button 
                className="btn-secondary small"
                onClick={() => setSelectedTrip(null)}
              >
                ← Back
              </button>
            )}
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Stats Bar */}
        {stats && !selectedTrip && (
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Trips</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.upcoming}</span>
              <span className="stat-label">Upcoming</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.countriesVisited}</span>
              <span className="stat-label">Countries</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats.current}</span>
              <span className="stat-label">Current</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="travel-content">
          {loading ? (
            <div className="loading-state">⏳ Loading...</div>
          ) : selectedTrip ? (
            <TripDetail 
              trip={selectedTrip} 
              onUpdate={fetchData}
              onBack={() => setSelectedTrip(null)}
            />
          ) : (
            <>
              {/* New Trip Form */}
              {showTripForm && (
                <NewTripForm 
                  onClose={() => setShowTripForm(false)}
                  onCreated={fetchData}
                />
              )}

              {/* Next Trip Highlight */}
              {stats?.nextTrip && activeTab === 'upcoming' && (
                <div className="next-trip-card">
                  <div className="next-trip-header">
                    <span className="next-label">🌟 Next Adventure</span>
                    <span className="days-until">
                      {getDaysUntil(stats.nextTrip.startDate)} days away
                    </span>
                  </div>
                  
                  <h3>{stats.nextTrip.title}</h3>
                  
                  <div className="next-trip-destination">
                    📍 {stats.nextTrip.destination?.city}, {stats.nextTrip.destination?.country}
                  </div>
                  
                  <div className="next-trip-dates">
                    {formatDate(stats.nextTrip.startDate)} - {formatDate(stats.nextTrip.endDate)}
                  </div>
                  
                  <button 
                    className="btn-view-trip"
                    onClick={() => setSelectedTrip(stats.nextTrip)}
                  >
                    View Details →
                  </button>
                </div>
              )}

              {/* Filter Tabs */}
              <div className="trip-tabs">
                {[
                  { id: 'upcoming', name: 'Upcoming', icon: '✈️' },
                  { id: 'current', name: 'Current', icon: '📍' },
                  { id: 'past', name: 'Past', icon: '📸' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    className={`trip-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon} {tab.name}
                  </button>
                ))}
              </div>

              {/* Trips List */}
              <div className="trips-list">
                {getFilteredTrips().length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🗺️</div>
                    <h3>No trips yet</h3>
                    <p>Start planning your next adventure!</p>
                    <button className="btn-primary" onClick={() => setShowTripForm(true)}>
                      Plan a Trip
                    </button>
                  </div>
                ) : (
                  getFilteredTrips().map(trip => (
                    <div 
                      key={trip.id} 
                      className="trip-card"
                      onClick={() => setSelectedTrip(trip)}
                    >
                      <div className="trip-image">
                        <span className="trip-emoji">
                          {TRIP_PURPOSES.find(p => p.id === trip.purpose)?.icon || '📍'}
                        </span>
                      </div>
                      
                      <div className="trip-info">
                        <h4>{trip.title}</h4>
                        
                        <div className="trip-destination">
                          📍 {trip.destination?.city || 'Unknown'}, {trip.destination?.country || 'Unknown'}
                        </div>
                        
                        <div className="trip-dates">
                          📅 {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                        </div>
                        
                        <div className="trip-meta">
                          <span>👥 {trip.travelers} traveler{trip.travelers !== 1 ? 's' : ''}</span>
                          <span>💰 ${trip.budget?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                      
                      <div className="trip-arrow">→</div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// New Trip Form Component
function NewTripForm({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    city: '',
    country: '',
    startDate: '',
    endDate: '',
    purpose: 'leisure',
    budget: '',
    travelers: 1,
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await fetch(`${API_URL}/travel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          destination: { city: formData.city, country: formData.country },
          startDate: formData.startDate,
          endDate: formData.endDate,
          purpose: formData.purpose,
          budget: formData.budget,
          travelers: formData.travelers,
          notes: formData.notes
        })
      });
      
      onCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create trip:', err);
    }
  };

  return (
    <div className="trip-form-container">
      <h3>Plan New Trip</h3>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Trip title *"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
        
        <div className="form-row">
          <input
            type="text"
            placeholder="City *"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
          
          <input
            type="text"
            placeholder="Country *"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            required
          />
        </div>
        
        <div className="form-row">
          <input
            type="date"
            placeholder="Start date *"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
          
          <input
            type="date"
            placeholder="End date *"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />
        </div>
        
        <select
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
        >
          {TRIP_PURPOSES.map(p => (
            <option key={p.id} value={p.id}>{p.icon} {p.name}</option>
          ))}
        </select>
        
        <div className="form-row">
          <input
            type="number"
            placeholder="Budget"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
          />
          
          <input
            type="number"
            placeholder="Travelers"
            min="1"
            value={formData.travelers}
            onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
          />
        </div>
        
        <textarea
          placeholder="Notes / Ideas"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
        
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Create Trip</button>
        </div>
      </form>
    </div>
  );
}

// Trip Detail Component
function TripDetail({ trip, onUpdate, onBack }) {
  const [activeSection, setActiveSection] = useState('itinerary');
  const [newItem, setNewItem] = useState({ name: '', category: 'other' });

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const addPackingItem = async (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    
    try {
      await fetch(`${API_URL}/travel/${trip.id}/packing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      setNewItem({ name: '', category: 'other' });
      onUpdate();
    } catch (err) {
      console.error('Failed to add item:', err);
    }
  };

  const togglePacked = async (itemId, packed) => {
    try {
      await fetch(`${API_URL}/travel/${trip.id}/packing/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packed: !packed })
      });
      onUpdate();
    } catch (err) {
      console.error('Failed to toggle item:', err);
    }
  };

  const packingProgress = trip.packingList?.length 
    ? Math.round((trip.packingList.filter(i => i.packed).length / trip.packingList.length) * 100)
    : 0;

  return (
    <div className="trip-detail">
      <div className="trip-detail-header">
        <div className="detail-title-section">
          <h3>{trip.title}</h3>
          <div className="detail-destination">
            📍 {trip.destination?.city}, {trip.destination?.country}
          </div>
          <div className="detail-dates">
            📅 {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          </div>
        </div>
        
        <div className="detail-stats">
          <div className="detail-stat">
            <span className="stat-label">Travelers</span>
            <span className="stat-value">{trip.travelers}</span>
          </div>
          <div className="detail-stat">
            <span className="stat-label">Budget</span>
            <span className="stat-value">${trip.budget?.toLocaleString() || 0}</span>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="detail-tabs">
        {[
          { id: 'itinerary', name: 'Itinerary', icon: '📅' },
          { id: 'bookings', name: 'Bookings', icon: '🎫' },
          { id: 'packing', name: 'Packing', icon: '🎒' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`detail-tab ${activeSection === tab.id ? 'active' : ''}`}
            onClick={() => setActiveSection(tab.id)}
          >
            {tab.icon} {tab.name}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="detail-content">
        {activeSection === 'packing' && (
          <div className="packing-section">
            <div className="packing-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${packingProgress}%` }}
                />
              </div>
              <span>{packingProgress}% packed</span>
            </div>

            <form className="add-packing-form" onSubmit={addPackingItem}>
              <input
                type="text"
                placeholder="Add item..."
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              >
                {PACKING_CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
              
              <button type="submit">Add</button>
            </form>

            <div className="packing-list">
              {trip.packingList?.map(item => (
                <div 
                  key={item.id} 
                  className={`packing-item ${item.packed ? 'packed' : ''}`}
                  onClick={() => togglePacked(item.id, item.packed)}
                >
                  <span className="packing-checkbox">{item.packed ? '✓' : '○'}</span>
                  <span className="packing-name">{item.name}</span>
                  <span className="packing-category">
                    {PACKING_CATEGORIES.find(c => c.id === item.category)?.icon}
                  </span>
                </div>
              ))}
            </div>          
          </div>
        )}

        {activeSection === 'itinerary' && (
          <div className="itinerary-placeholder">
            <p>📝 Itinerary planning coming soon!</p>
            <p className="hint">Add your daily activities and plans here.</p>
          </div>
        )}

        {activeSection === 'bookings' && (
          <div className="bookings-placeholder">
            <p>🎫 Booking management coming soon!</p>
            <p className="hint">Track your flights, hotels, and reservations.</p>
          </div>
        )}
      </div>
    </div>
  );
}
