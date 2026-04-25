// CreateRequest.js — with Gemini API auto-detection (fixed)
import React, { useState } from 'react';
import { api } from '../services/api';

const PRESETS = [
  { name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
  { name: 'Lajpat Nagar',   lat: 28.5693, lng: 77.2439 },
  { name: 'Dwarka',          lat: 28.5921, lng: 77.0460 },
  { name: 'Rohini',          lat: 28.7041, lng: 77.1025 },
  { name: 'Saket',           lat: 28.5244, lng: 77.2066 },
];

const DEFAULT = {
  location: '',
  lat: '28.6139',
  lng: '77.2090',
  severity: 'medium',
  description: '',
  type: 'any',
};

export default function CreateRequest({ notify, goPage }) {
  const [form, setForm]           = useState(DEFAULT);
  const [loading, setLoading]     = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult]   = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Gemini API call (fixed) ────────────────────────────────────────────────
  async function analyzeWithGemini() {
  if (!form.description.trim()) {
    notify('Empty description', 'Please enter a description first.');
    return;
  }

  setAnalyzing(true);
  setAiResult(null);

  try {
    const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

    if (!API_KEY) {
      notify('Missing API Key', 'Add REACT_APP_GEMINI_API_KEY to your .env file and restart.');
      setAnalyzing(false);
      return;
    }

    // Simplified prompt — very direct, no ambiguity
    const prompt = `Return only this JSON with no extra text:
{"severity":"high","type":"Ambulance"}

Replace the values based on this emergency: "${form.description}"
severity options: high, medium, low
type options: Ambulance, Responder, Delivery, any`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,          // zero temperature = most deterministic
            maxOutputTokens: 256,     // very small — forces short response
          },
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      console.error('API error response:', errData);
      notify('Gemini API Error', errData?.error?.message || `HTTP ${response.status}`);
      setAnalyzing(false);
      return;
    }

    const data = await response.json();

    // Log everything so we can see exactly what Gemini returns
    console.log('=== GEMINI DEBUG ===');
    console.log('Full response:', JSON.stringify(data, null, 2));

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('Raw text:', rawText);
    console.log('Raw text length:', rawText.length);
    console.log('Raw text chars:', [...rawText].map(c => c.charCodeAt(0)));

    if (!rawText) {
      // Check why it is empty
      const finishReason = data?.candidates?.[0]?.finishReason;
      const blockReason  = data?.promptFeedback?.blockReason;
      console.log('Finish reason:', finishReason);
      console.log('Block reason:', blockReason);
      notify(
        'Empty response',
        `Gemini returned nothing. Reason: ${blockReason || finishReason || 'unknown'}`
      );
      setAnalyzing(false);
      return;
    }

    // Try every possible way to get the JSON out
    let severity = null;
    let type     = null;

    // Method 1 — direct parse
    try {
      const p = JSON.parse(rawText.trim());
      severity = p.severity;
      type     = p.type;
      console.log('Method 1 worked:', p);
    } catch(e) {
      console.log('Method 1 failed:', e.message);
    }

    // Method 2 — strip all whitespace and backticks
    if (!severity) {
      try {
        const cleaned = rawText
          .replace(/`/g, '')
          .replace(/json/gi, '')
          .replace(/\n/g, '')
          .trim();
        const p = JSON.parse(cleaned);
        severity = p.severity;
        type     = p.type;
        console.log('Method 2 worked:', p);
      } catch(e) {
        console.log('Method 2 failed:', e.message);
      }
    }

    // Method 3 — find { } block
    if (!severity) {
      const match = rawText.match(/\{[^}]+\}/);
      if (match) {
        try {
          const p = JSON.parse(match[0]);
          severity = p.severity;
          type     = p.type;
          console.log('Method 3 worked:', p);
        } catch(e) {
          console.log('Method 3 failed:', e.message);
        }
      } else {
        console.log('Method 3: no { } block found');
      }
    }

    // Method 4 — regex extract individual values
    if (!severity) {
      const sm = rawText.match(/severity["\s:]+([a-z]+)/i);
      const tm = rawText.match(/type["\s:]+([A-Za-z]+)/i);
      console.log('Method 4 severity match:', sm);
      console.log('Method 4 type match:', tm);
      if (sm) severity = sm[1].toLowerCase();
      if (tm) type     = tm[1];
    }

    // Method 5 — scan for keywords anywhere in the text
    if (!severity) {
      console.log('Method 5 — keyword scan');
      if (/high/i.test(rawText))   severity = 'high';
      if (/medium/i.test(rawText)) severity = 'medium';
      if (/low/i.test(rawText))    severity = 'low';
    }
    if (!type) {
      if (/ambulance/i.test(rawText))  type = 'Ambulance';
      if (/responder/i.test(rawText))  type = 'Responder';
      if (/delivery/i.test(rawText))   type = 'Delivery';
    }

    console.log('Final extracted — severity:', severity, 'type:', type);

    // Validate
    const validSeverities = ['high', 'medium', 'low'];
    const validTypes      = ['Ambulance', 'Responder', 'Delivery', 'any'];

    const finalSeverity = validSeverities.includes(severity) ? severity : 'medium';
    const finalType     = validTypes.includes(type)          ? type     : 'any';

    setForm(f => ({ ...f, severity: finalSeverity, type: finalType }));
    setAiResult({ severity: finalSeverity, type: finalType });
    notify('Gemini analysed!', `Severity → ${finalSeverity} | Type → ${finalType}`);

  } catch (err) {
    console.error('Gemini error:', err);
    notify('Gemini failed', err.message || 'Check browser console F12 for details.');
  } finally {
    setAnalyzing(false);
  }
}

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!form.location || !form.lat || !form.lng) {
      notify('Missing fields', 'Please fill in location, latitude and longitude.');
      return;
    }
    setLoading(true);
    try {
      const req   = await api.createRequest({
        ...form,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
      });
      const alloc = await api.allocate(req.id);
      notify('Allocated!', `${alloc.resourceName} dispatched to ${req.location}`);
      setForm(DEFAULT);
      setAiResult(null);
      goPage(3);
    } catch (err) {
      notify('Error', err.message, 4500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <p className="page-title">Create Request</p>

      <div className="card">
        <div className="card-title">Request details</div>
        <div className="form-grid">

          <div className="form-group">
            <label>Location name *</label>
            <input
              value={form.location}
              onChange={e => set('location', e.target.value)}
              placeholder="e.g. Sector 12, Delhi"
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <input
              value={form.description}
              onChange={e => { set('description', e.target.value); setAiResult(null); }}
              placeholder="Describe the emergency in detail..."
            />
          </div>

          {/* Gemini button */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <button
              className="btn"
              onClick={analyzeWithGemini}
              disabled={analyzing || !form.description.trim()}
              style={{
                background: analyzing ? '#f5f5f4' : '#4B6FE4',
                color: analyzing ? '#888' : '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontWeight: 600,
              }}
            >
              {analyzing ? '🤖 Gemini is analysing...' : '✨ Auto-detect with Gemini AI'}
            </button>

            {aiResult && (
              <div style={{
                marginTop: 8, padding: '8px 12px',
                background: '#E1F5EE', borderRadius: 8,
                fontSize: 13, color: '#085041',
                display: 'flex', gap: 16,
              }}>
                <span>🤖 Gemini detected:</span>
                <strong>Severity → {aiResult.severity}</strong>
                <strong>Type → {aiResult.type}</strong>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Severity * <span style={{ color: '#4B6FE4', fontSize: 11 }}>(auto-filled by Gemini)</span></label>
            <select value={form.severity} onChange={e => set('severity', e.target.value)}>
              <option value="high">High — immediate danger</option>
              <option value="medium">Medium — urgent but stable</option>
              <option value="low">Low — non-urgent</option>
            </select>
          </div>

          <div className="form-group">
            <label>Resource type <span style={{ color: '#4B6FE4', fontSize: 11 }}>(auto-filled by Gemini)</span></label>
            <select value={form.type} onChange={e => set('type', e.target.value)}>
              <option value="any">Any available</option>
              <option value="Ambulance">🚑 Ambulance</option>
              <option value="Responder">🦺 Responder</option>
              <option value="Delivery">📦 Delivery</option>
            </select>
            <span style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
              Gemini sets this automatically — you can still override manually.
            </span>
          </div>

          <div className="form-group">
            <label>Latitude *</label>
            <input type="number" step="0.0001" value={form.lat} onChange={e => set('lat', e.target.value)} />
          </div>

          <div className="form-group">
            <label>Longitude *</label>
            <input type="number" step="0.0001" value={form.lng} onChange={e => set('lng', e.target.value)} />
          </div>

        </div>

        <button className="btn primary full" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Allocating…' : 'Submit + Auto-allocate'}
        </button>
      </div>

      <div className="card">
        <div className="card-title">Quick-fill presets</div>
        <div className="preset-chips">
          {PRESETS.map(p => (
            <button key={p.name} className="btn"
              onClick={() => setForm(f => ({ ...f, location: p.name, lat: String(p.lat), lng: String(p.lng) }))}>
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}