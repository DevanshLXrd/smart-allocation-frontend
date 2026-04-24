// services/api.js — centralised API calls to the backend
const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

export const api = {
  getResources:       ()         => request('GET',   '/resources'),
  addResource:        (body)     => request('POST',  '/resources', body),
  updateResourceStatus:(id,stat) => request('PATCH', `/resources/${id}/status`, { status: stat }),

  createRequest:      (body)     => request('POST',  '/request', body),
  getRequests:        ()         => request('GET',   '/request'),

  allocate:           (requestId)=> request('POST',  '/allocate', { requestId }),
  completeAllocation: (id)       => request('PATCH', `/allocate/${id}/complete`),
  getAllocations:      ()         => request('GET',   '/allocate'),
};
