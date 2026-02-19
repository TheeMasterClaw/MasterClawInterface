/**
 * Travel Planner Router
 * Plan trips, manage itineraries, and track travel details
 */

import express from 'express';
import { getDb, genId } from '../db.js';

const router = express.Router();

// Get all trips
router.get('/', (req, res) => {
  const db = getDb();
  if (!db.trips) db.trips = [];
  
  const { status } = req.query;
  let trips = [...db.trips];
  
  if (status) {
    trips = trips.filter(t => t.status === status);
  }
  
  // Sort by start date
  trips.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  
  res.json({ trips });
});

// Get trip stats
router.get('/stats', (req, res) => {
  const db = getDb();
  const trips = db.trips || [];
  
  const now = new Date();
  
  const upcoming = trips.filter(t => new Date(t.startDate) >= now);
  const past = trips.filter(t => new Date(t.endDate) < now);
  const current = trips.filter(t => {
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    return start <= now && end >= now;
  });
  
  // Countries visited
  const countries = [...new Set(past.map(t => t.destination?.country).filter(Boolean))];
  
  // Total trips
  const totalTrips = trips.length;
  
  // Upcoming trip
  const nextTrip = upcoming[0] || null;
  
  res.json({
    total: totalTrips,
    upcoming: upcoming.length,
    past: past.length,
    current: current.length,
    countriesVisited: countries.length,
    nextTrip
  });
});

// Create trip
router.post('/', (req, res) => {
  const db = getDb();
  if (!db.trips) db.trips = [];
  
  const {
    title,
    destination,
    startDate,
    endDate,
    purpose,
    budget,
    travelers,
    notes
  } = req.body;
  
  if (!title || !startDate || !endDate) {
    return res.status(400).json({ error: 'Title, start date, and end date are required' });
  }
  
  const trip = {
    id: genId(),
    title,
    destination: destination || { city: '', country: '' },
    startDate,
    endDate,
    purpose: purpose || 'leisure',
    budget: parseFloat(budget) || 0,
    travelers: parseInt(travelers) || 1,
    notes: notes || '',
    status: 'planned',
    itinerary: [],
    bookings: [],
    packingList: [],
    expenses: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.trips.push(trip);
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.status(201).json(trip);
});

// Get single trip
router.get('/:id', (req, res) => {
  const db = getDb();
  const trip = db.trips?.find(t => t.id === req.params.id);
  
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }
  
  res.json(trip);
});

// Update trip
router.patch('/:id', (req, res) => {
  const db = getDb();
  const trip = db.trips?.find(t => t.id === req.params.id);
  
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }
  
  Object.assign(trip, req.body, { updatedAt: new Date().toISOString() });
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.json(trip);
});

// Delete trip
router.delete('/:id', (req, res) => {
  const db = getDb();
  if (!db.trips) return res.json({ success: true });
  
  const index = db.trips.findIndex(t => t.id === req.params.id);
  if (index > -1) {
    db.trips.splice(index, 1);
    const { updateDb } = require('../db.js');
    updateDb();
  }
  
  res.json({ success: true });
});

// Add itinerary item
router.post('/:id/itinerary', (req, res) => {
  const db = getDb();
  const trip = db.trips?.find(t => t.id === req.params.id);
  
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }
  
  const item = {
    id: genId(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  if (!trip.itinerary) trip.itinerary = [];
  trip.itinerary.push(item);
  trip.updatedAt = new Date().toISOString();
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.status(201).json(item);
});

// Delete itinerary item
router.delete('/:id/itinerary/:itemId', (req, res) => {
  const db = getDb();
  const trip = db.trips?.find(t => t.id === req.params.id);
  
  if (!trip || !trip.itinerary) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const index = trip.itinerary.findIndex(i => i.id === req.params.itemId);
  if (index > -1) {
    trip.itinerary.splice(index, 1);
    trip.updatedAt = new Date().toISOString();
    const { updateDb } = require('../db.js');
    updateDb();
  }
  
  res.json({ success: true });
});

// Add booking
router.post('/:id/bookings', (req, res) => {
  const db = getDb();
  const trip = db.trips?.find(t => t.id === req.params.id);
  
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }
  
  const booking = {
    id: genId(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  
  if (!trip.bookings) trip.bookings = [];
  trip.bookings.push(booking);
  trip.updatedAt = new Date().toISOString();
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.status(201).json(booking);
});

// Delete booking
router.delete('/:id/bookings/:bookingId', (req, res) => {
  const db = getDb();
  const trip = db.trips?.find(t => t.id === req.params.id);
  
  if (!trip || !trip.bookings) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const index = trip.bookings.findIndex(b => b.id === req.params.bookingId);
  if (index > -1) {
    trip.bookings.splice(index, 1);
    trip.updatedAt = new Date().toISOString();
    const { updateDb } = require('../db.js');
    updateDb();
  }
  
  res.json({ success: true });
});

// Add packing item
router.post('/:id/packing', (req, res) => {
  const db = getDb();
  const trip = db.trips?.find(t => t.id === req.params.id);
  
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }
  
  const item = {
    id: genId(),
    name: req.body.name,
    category: req.body.category || 'other',
    packed: false,
    createdAt: new Date().toISOString()
  };
  
  if (!trip.packingList) trip.packingList = [];
  trip.packingList.push(item);
  trip.updatedAt = new Date().toISOString();
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.status(201).json(item);
});

// Toggle packing item
router.patch('/:id/packing/:itemId', (req, res) => {
  const db = getDb();
  const trip = db.trips?.find(t => t.id === req.params.id);
  
  if (!trip || !trip.packingList) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const item = trip.packingList.find(i => i.id === req.params.itemId);
  if (item) {
    item.packed = req.body.packed;
    trip.updatedAt = new Date().toISOString();
    const { updateDb } = require('../db.js');
    updateDb();
  }
  
  res.json(item);
});

// Add expense
router.post('/:id/expenses', (req, res) => {
  const db = getDb();
  const trip = db.trips?.find(t => t.id === req.params.id);
  
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }
  
  const expense = {
    id: genId(),
    ...req.body,
    amount: parseFloat(req.body.amount) || 0,
    createdAt: new Date().toISOString()
  };
  
  if (!trip.expenses) trip.expenses = [];
  trip.expenses.push(expense);
  trip.updatedAt = new Date().toISOString();
  
  const { updateDb } = require('../db.js');
  updateDb();
  
  res.status(201).json(expense);
});

export default router;
