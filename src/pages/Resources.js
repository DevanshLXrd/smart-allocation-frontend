// Resources.js — view and manage all field resources
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function Resources({ notify }) {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState({ name:'', type:'Ambulance', lat:'', lng:'' });
  const [adding, setAdding] = useState(false);

  const load = () => api.getResources().then(setResources);
  useEffect(() => { load(); }, []);

  async function markAvailable(id) {
    try {
      await api.updateResourceStatus(id, 'available');
      notify('Done', 'Resource marked as available.');
      load();
    } catch(e) { notify('Error', e.message); }
  }

  async function addResource() {
    if (!form.name || !form.lat || !form.lng) {
      notify('Missing fields', 'Name, lat and lng are required.'); return;
    }
    try {
      await api.addResource({ ...form, lat: parseFloat(form.lat), lng: parseFloat(form.lng) });
      notify('Added', `${form.name} added to the pool.`);
      setForm({ name:'', type:'Ambulance', lat:'', lng:'' });
      setAdding(false);
      load();
    } catch(e) { notify('Error', e.message); }
  }

  return (
    <>
      <p className="page-title">Resources</p>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Type</th><th>Coordinates</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {resources.map(r => (
              <tr key={r.id}>
                <td style={{fontWeight:600,color:'var(--muted)'}}>{r.id}</td>
                <td>{r.name}</td>
                <td>{r.type}</td>
                <td style={{fontFamily:'monospace',fontSize:12}}>{r.lat.toFixed(4)}, {r.lng.toFixed(4)}</td>
                <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                <td>
                  <button className="btn" disabled={r.status==='available'}
                    onClick={() => markAvailable(r.id)}>
                    Free up
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add resource */}
      {adding ? (
        <div className="card">
          <div className="card-title">Add new resource</div>
          <div className="form-grid">
            <div className="form-group"><label>Name</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Unit name" />
            </div>
            <div className="form-group"><label>Type</label>
              <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                <option>Ambulance</option><option>Responder</option><option>Delivery</option>
              </select>
            </div>
            <div className="form-group"><label>Latitude</label>
              <input type="number" step="0.0001" value={form.lat} onChange={e=>setForm(f=>({...f,lat:e.target.value}))} />
            </div>
            <div className="form-group"><label>Longitude</label>
              <input type="number" step="0.0001" value={form.lng} onChange={e=>setForm(f=>({...f,lng:e.target.value}))} />
            </div>
          </div>
          <div style={{display:'flex',gap:8,marginTop:'1rem'}}>
            <button className="btn primary" onClick={addResource}>Add resource</button>
            <button className="btn" onClick={()=>setAdding(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn" onClick={()=>setAdding(true)}>+ Add new resource</button>
      )}
    </>
  );
}
