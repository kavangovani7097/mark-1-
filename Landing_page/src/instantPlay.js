import { supabaseUrl, supabaseAnonKey } from './supabase';

const REQUEST_TTL_MS = 15 * 60 * 1000;
const GOOGLE_GEOCODING_KEY = 'AIzaSyA0Sr7npoE5MGMk9LzA4CWFGL-c-foQ30s';

export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function reverseGeocode(lat, lng) {
  const params = new URLSearchParams({
    latlng: `${lat},${lng}`,
    key: GOOGLE_GEOCODING_KEY,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${params}`
  );
  const data = await response.json();

  if (data.status !== 'OK' || !data.results?.length) {
    return 'Nearby area';
  }

  const components = data.results[0].address_components || [];
  const findType = (type) =>
    components.find((part) => part.types.includes(type))?.long_name;

  return (
    findType('neighborhood') ||
    findType('sublocality') ||
    findType('locality') ||
    data.results[0].formatted_address?.split(',')[0] ||
    'Nearby area'
  );
}

export async function updateUserLocation({ squadrId, lat, lng }) {
  if (!squadrId) return;

  await fetch(`${restUrl('users')}?squadr_id=eq.${squadrId}`, {
    method: 'PATCH',
    headers: restHeaders(),
    body: JSON.stringify({ lat, lng }),
  });
}

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
  lat,
  lng,
  radiusKm,
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
      lat,
      lng,
      radius_km: radiusKm,
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

export async function joinSession({ sessionId, playerName, slotsRemaining }) {
  await fetch(restUrl('session_participants'), {
    method: 'POST',
    headers: restHeaders(),
    body: JSON.stringify({
      session_id: sessionId,
      player_name: playerName,
    }),
  });

  const newSlots = Math.max(0, (slotsRemaining ?? 1) - 1);
  await fetch(`${restUrl('sessions')}?id=eq.${sessionId}`, {
    method: 'PATCH',
    headers: restHeaders(),
    body: JSON.stringify({ slots_remaining: newSlots }),
  });

  return newSlots;
}

export async function fetchMyParticipations(playerName) {
  const params = new URLSearchParams({
    select: 'session_id',
    player_name: `eq.${playerName}`,
  });

  const response = await fetch(
    `${restUrl('session_participants')}?${params}`,
    { headers: restHeaders() }
  );

  return asArray(await response.json());
}

export async function fetchMyRatings(raterName) {
  const params = new URLSearchParams({
    select: 'session_id',
    rater_name: `eq.${raterName}`,
  });

  const response = await fetch(`${restUrl('ratings')}?${params}`, {
    headers: restHeaders(),
  });

  return asArray(await response.json());
}

export async function submitRating({ sessionId, raterName, rating }) {
  await fetch(restUrl('ratings'), {
    method: 'POST',
    headers: restHeaders(),
    body: JSON.stringify({
      session_id: sessionId,
      rater_name: raterName,
      rating,
    }),
  });
}

export async function deleteUserData(playerName) {
  const value = encodeURIComponent(`eq.${playerName}`);
  const targets = [
    `session_participants?player_name=${value}`,
    `instant_matches?player_name=${value}`,
    `messages?sender_name=${value}`,
    `ratings?rater_name=${value}`,
  ];

  await Promise.all(
    targets.map((path) =>
      fetch(restUrl(path), {
        method: 'DELETE',
        headers: restHeaders(),
      }).catch(() => {})
    )
  );
}
