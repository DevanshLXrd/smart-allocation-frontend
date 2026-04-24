// Allocations.js — view all allocation results with AI scoring breakdown
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function Allocations({ notify }) {
  const [allocations, setAllocations] = useState([]);

  const load = () => api.getAllocations().then(data => setAllocations([...data].reverse()));
  useEffect(() => { load(); }, []);

  async function complete(id) {
    try {
      await api.completeAllocation(id);
      notify('Completed', 'Mission complete. Resource is free again.');
      load();
    } catch(e) { notify('Error', e.message); }
  }

  if (!allocations.length) return (
    <>
      <p className="page-title">Allocations</p>
      <div className="empty">No allocations yet. Create a request to see AI-based assignments here.</div>
    </>
  );

  return (
    <>
      <p className="page-title">Allocation results</p>
      {allocations.map(a => {
        // Score bar: invert score so lower score = fuller bar
        const maxScore = a.candidates ? Math.max(...a.candidates.map(c=>c.score)) || 1 : 1;
        const barW = Math.max(8, Math.round((1 - a.score / maxScore) * 100));
        const active = a.status === 'in-progress';

        return (
          <div key={a.id} className={active ? 'result-box' : 'card'}>
            {/* Header */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <strong>{a.id}</strong>
              <span className={`badge badge-${a.status}`}>{a.status}</span>
            </div>

            {/* Core details */}
            {[
              ['Location',        a.location],
              ['Severity',        <span className={`badge badge-${a.severity}`}>{a.severity}</span>],
              ['Assigned resource', `${a.resourceName} (${a.resourceType})`],
              ['Distance',        `${a.distance} km`],
              ['AI score',
                <span style={{display:'flex',alignItems:'center',gap:8}}>
                  {a.score}
                  <span className="score-bar"><span className="score-fill" style={{width:`${barW}%`}} /></span>
                  <span style={{fontSize:11,color:'var(--muted)'}}>lower = better</span>
                </span>
              ],
              ['Allocated at',    a.createdAt ? new Date(a.createdAt).toLocaleTimeString() : '—'],
              ['Requested type',   a.requestedType || 'any'],
['Type match',
  a.typeMatchFound
    ? <span className="badge badge-available">Exact match found</span>
    : <span className="badge badge-medium">Fallback used</span>
],
            ].map(([k,v])=>(
              <div className="result-row" key={k}>
                <span className="result-key">{k}</span>
                <span style={{fontWeight:500}}>{v}</span>
              </div>
            ))}

            {/* Candidate breakdown */}
            {a.candidates?.map((c, i) => (
  <div className="result-row" key={c.id}>
    <span className="result-key">
      #{i+1} {c.name}
      <span style={{fontSize:11, color:'var(--muted)', marginLeft:6}}>{c.type}</span>
    </span>
    <span style={{display:'flex', gap:10, alignItems:'center', fontSize:12}}>
      {/* NEW — show type match badge */}
      {c.typeMatch
        ? <span className="badge badge-available">type match</span>
        : <span className="badge badge-medium">type mismatch</span>
      }
      <span style={{color:'var(--muted)'}}>{c.distance} km</span>
      <span style={{color:'var(--muted)'}}>score {c.score}</span>
      {c.id === a.resourceId && <span className="badge badge-assigned">selected</span>}
    </span>
  </div>
))}
            {active && (
              <button className="btn primary full" onClick={()=>complete(a.id)} style={{marginTop:'1rem'}}>
                Mark as completed
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}
