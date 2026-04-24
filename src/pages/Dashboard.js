// Dashboard.js — live stats, map, and activity feed
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { api } from '../services/api';

export default function Dashboard({ goPage }) {
  const [resources,   setResources]   = useState([]);
  const [requests,    setRequests]    = useState([]);
  const [allocations, setAllocations] = useState([]);

  useEffect(() => {
    // Poll every 5 s for "live" feel
    const load = async () => {
      const [r, q, a] = await Promise.all([
        api.getResources(), api.getRequests(), api.getAllocations()
      ]);
      setResources(r); setRequests(q); setAllocations(a);
    };
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const available = resources.filter(r => r.status === 'available').length;
  const pending   = requests.filter(r => r.status === 'pending').length;
  const completed = allocations.filter(a => a.status === 'completed').length;

  // Map marker colours
  const resourceColor = s => ({ available:'#1D9E75', assigned:'#185FA5', busy:'#BA7517' }[s] || '#888');
  const severityColor = s => ({ high:'#E24B4A', medium:'#EF9F27', low:'#639922' }[s] || '#888');

  return (
    <>
      <p className="page-title">Dashboard</p>

      {/* Metric cards */}
      <div className="metrics">
        <div className="metric"><div className="metric-label">Total resources</div><div className="metric-val">{resources.length}</div></div>
        <div className="metric"><div className="metric-label">Available</div><div className="metric-val green">{available}</div></div>
        <div className="metric"><div className="metric-label">Pending requests</div><div className="metric-val amber">{pending}</div></div>
        <div className="metric"><div className="metric-label">Completed</div><div className="metric-val">{completed}</div></div>
      </div>

      {/* Leaflet map */}
      <div className="card">
        <div className="card-title">Live field map</div>
        <MapContainer center={[28.63, 77.22]} zoom={12} scrollWheelZoom={false}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {/* Resource dots */}
          {resources.map(r => (
            <CircleMarker key={r.id} center={[r.lat, r.lng]}
              radius={10} fillColor={resourceColor(r.status)} color="#fff"
              weight={2} fillOpacity={0.9}>
              <Popup><strong>{r.name}</strong><br />{r.type} — {r.status}</Popup>
            </CircleMarker>
          ))}
          {/* Request squares (rendered as circle markers with square colour) */}
          {requests.map(r => (
            <CircleMarker key={r.id} center={[r.lat, r.lng]}
              radius={7} fillColor={severityColor(r.severity)} color="#fff"
              weight={2} fillOpacity={0.85} pathOptions={{ dashArray: '0' }}>
              <Popup><strong>{r.location}</strong><br />Severity: {r.severity}<br />Status: {r.status}</Popup>
            </CircleMarker>
          ))}
        </MapContainer>
        <div style={{ display:'flex', gap:16, marginTop:10, fontSize:12, color:'var(--muted)', flexWrap:'wrap' }}>
          {[['#1D9E75','Available resource'],['#185FA5','Assigned'],['#E24B4A','High request'],['#EF9F27','Medium request'],['#639922','Low request']].map(([c,l])=>(
            <span key={l} style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:10, height:10, borderRadius:'50%', background:c, flexShrink:0 }} />{l}
            </span>
          ))}
        </div>
      </div>

      {/* Recent allocations */}
      <div className="card">
        <div className="card-title">Recent allocations</div>
        {allocations.length === 0
          ? <div className="empty">No allocations yet — <button className="btn" onClick={()=>goPage(1)}>create a request</button></div>
          : (
            <table>
              <thead><tr><th>ID</th><th>Location</th><th>Resource</th><th>Severity</th><th>Dist (km)</th><th>Status</th></tr></thead>
              <tbody>
                {allocations.slice().reverse().slice(0,8).map(a=>(
                  <tr key={a.id}>
                    <td style={{fontWeight:600}}>{a.id}</td>
                    <td>{a.location}</td>
                    <td>{a.resourceName}</td>
                    <td><span className={`badge badge-${a.severity}`}>{a.severity}</span></td>
                    <td>{a.distance}</td>
                    <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>
    </>
  );
}
