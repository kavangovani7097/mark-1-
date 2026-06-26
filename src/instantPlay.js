import { supabaseUrl, supabaseAnonKey } from './supabase';

const REQUEST_TTL_MS = 15 * 60 * 1000;

const restHeaders = (extra = {}) => ({
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
  'Content-Type': 'application/json',
  ...extra,
});

const restUrl = (path) => `${supabaseUrl}/rest/v1/${path}`;

const asArray = (data) => (Array.isArray(data) ? data : []);

export async function createInstantRequest({
  sport,
  playersNeeded,
  locationPref,
  requesterName,
}) {
  const expiresAt = new Date(Date.now() + REQUEST_TTL_MS).toISOString();

  const response = await fetch(restUrl('instant_requests'), {
    method: 'POST',
    headers: restHeaders({ Prefer: 'return=representation' }),
    body: JSON.stringify({
      sport,
      players_needed: playersNeeded,
      location_pref: locationPref,
      requester_name: requesterName,
      status: 'searching',
      expires_at: expiresAt,
    }),
  });

  const data = await response.json();
  return asArray(data)[0] ?? null;
}

export async function fetchOpenRequests() {
  const params = new URLSearchParams({
    select: '*',
    status: 'eq.searching',
    expires_at: `gt.${new Date().toISOString()}`,
    order: 'created_at.desc',
  });

  const response = await fetch(`${restUrl('instant_requests')}?${params}`, {
    headers: restHeaders(),
  });

  return asArray(await response.json());
}

export async function updateRequestStatus(requestId, status) {
  await fetch(`${restUrl('instant_requests')}?id=eq.${requestId}`, {
    method: 'PATCH',
    headers: restHeaders(),
    body: JSON.stringify({ status }),
  });
}

export async function acceptRequest({ requestId, playerName }) {
  await fetch(restUrl('instant_matches'), {
    method: 'POST',
    headers: restHeaders(),
    body: JSON.stringify({
      request_id: requestId,
      player_name: playerName,
    }),
  });
}

export async function fetchMatches(requestId) {
  const params = new URLSearchParams({
    select: '*',
    request_id: `eq.${requestId}`,
    order: 'joined_at.asc',
  });

  const response = await fetch(`${restUrl('instant_matches')}?${params}`, {
    headers: restHeaders(),
  });

  return asArray(await response.json());
}

export async function fetchMessages(roomId, since) {
  const params = new URLSearchParams({
    select: '*',
    room_id: `eq.${roomId}`,
    order: 'created_at.asc',
  });

  if (since) {
    params.set('created_at', `gte.${since}`);
  }

  const response = await fetch(`${restUrl('messages')}?${params}`, {
    headers: restHeaders(),
  });

  return asArray(await response.json());
}

export async function sendMessage({ roomId, senderName, text }) {
  await fetch(restUrl('messages'), {
    method: 'POST',
    headers: restHeaders(),
    body: JSON.stringify({
      room_id: roomId,
      sender_name: senderName,
      text,
    }),
  });
}
