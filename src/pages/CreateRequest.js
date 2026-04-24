// CreateRequest.js — form to submit a new request + auto-allocate
import React, { useState } from 'react';
import { api } from '../services/api';

const PRESETS = [
  { name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
  { name: 'Lajpat Nagar',   lat: 28.5693, lng: 77.2439 },
  { name: 'Dwarka',          lat: 28.5921, lng: 77.0460 },
  { name: 'Rohini',          lat: 28.7041, lng: 77.1025 },
  { name: 'Saket',           lat: 28.5244, lng: 77.2066 },
];

const DEFAULT = { location:'', lat:'28.6139', lng:'77.2090', severity:'high', description:'', type:'any' };

export default function CreateRequest({ notify, goPage }) {
  const [form, setForm]       = useState(DEFAULT);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit() {
    if (!form.location || !form.lat || !form.lng) {
      notify('Missing fields', 'Please fill in location, latitude and longitude.');
      return;
    }
    setLoading(true);
    try {
      // Step 1 — create the request
      const req = await api.createRequest({
        ...form, lat: parseFloat(form.lat), lng: parseFloat(form.lng),
      });
      // Step 2 — auto-allocate
      const alloc = await api.allocate(req.id);
      notify('Allocated!', `${alloc.resourceName} dispatched to ${req.location}`);
      setForm(DEFAULT);
      goPage(3); // jump to Allocations
    } catch (err) {
      notify('Error', err.message, 4500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <p className="page-title">Create request</p>

      <div className="card">
        <div className="card-title">Request details</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Location name *</label>
            <input value={form.location} onChange={e=>set('location',e.target.value)} placeholder="e.g. Sector 12, Delhi" />
          </div>
          <div className="form-group">
            <label>Severity *</label>
            <select value={form.severity} onChange={e=>set('severity',e.target.value)}>
              <option value="high">High — immediate danger</option>
              <option value="medium">Medium — urgent but stable</option>
              <option value="low">Low — non-urgent</option>
            </select>
          </div>
          <div className="form-group">
            <label>Latitude *</label>
            <input type="number" step="0.0001" value={form.lat} onChange={e=>set('lat',e.target.value)} />
          </div>
          <div className="form-group">
            <label>Longitude *</label>
            <input type="number" step="0.0001" value={form.lng} onChange={e=>set('lng',e.target.value)} />
          </div>
          <div className="form-group">
  <label>Resource type needed</label>
  <select value={form.type} onChange={e=>set('type',e.target.value)}>
    <option value="any">Any available</option>
    <option value="Ambulance">🚑 Ambulance</option>
    <option value="Responder">🦺 Responder</option>
    <option value="Delivery">📦 Delivery</option>
  </select>
  <span style={{fontSize:11, color:'var(--muted)', marginTop:3}}>
    The AI will prioritise this type — a fallback is used if none are free.
  </span>
</div>
          <div className="form-group">
            <label>Description</label>
            <input value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Brief situation description" />
          </div>
        </div>
        <button className="btn primary full" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Allocating…' : 'Submit + Auto-allocate'}
        </button>
      </div>

      <div className="card">
        <div className="card-title">Quick-fill presets</div>
        <div className="preset-chips">
          {PRESETS.map(p=>(
            <button key={p.name} className="btn" onClick={()=>setForm(f=>({...f,location:p.name,lat:String(p.lat),lng:String(p.lng)}))}>
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
