import { supabaseUrl, supabaseAnonKey } from './supabase';

const restHeaders = (extra = {}) => ({
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
  'Content-Type': 'application/json',
  ...extra,
});

const restUrl = (path) => `${supabaseUrl}/rest/v1/${path}`;

const asArray = (data) => (Array.isArray(data) ? data : []);

const dedupeDiscoverablePlayers = (players) => {
  const bySquadrId = new Map();

  players.forEach((player) => {
    if (!player?.squadr_id || bySquadrId.has(player.squadr_id)) return;
    bySquadrId.set(player.squadr_id, player);
  });

  const byNameCity = new Map();
  const deduped = [];

  bySquadrId.forEach((player) => {
    const nameKey = (player.name || '').trim().toLowerCase();
    const cityKey = (player.city || '').trim().toLowerCase();
    const nameCityKey = `${nameKey}|${cityKey}`;
    if (byNameCity.has(nameCityKey)) return;
    byNameCity.set(nameCityKey, player);
    deduped.push(player);
  });

  return deduped;
};

const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function generateSquadrId() {
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += ID_CHARS.charAt(Math.floor(Math.random() * ID_CHARS.length));
  }
  return `SQUADR#${suffix}`;
}

export async function upsertUser({ name, squadrId, city, sports, lat, lng }) {
  await fetch(`${restUrl('users')}?on_conflict=squadr_id`, {
    method: 'POST',
    headers: restHeaders({ Prefer: 'resolution=merge-duplicates' }),
    body: JSON.stringify({
      name,
      squadr_id: squadrId,
      city,
      sports,
      ...(lat != null && lng != null ? { lat, lng } : {}),
    }),
  });
}

export async function fetchDiscoverablePlayers({ excludeSquadrId } = {}) {
  const filters = ['name.not.is.null', 'name.neq.', 'squadr_id.not.is.null'];
  if (excludeSquadrId) {
    filters.push(`squadr_id.neq.${excludeSquadrId}`);
  }

  const params = new URLSearchParams({
    select: 'squadr_id,name,city,sports',
    order: 'name.asc',
    and: `(${filters.join(',')})`,
  });

  const response = await fetch(`${restUrl('users')}?${params}`, {
    headers: restHeaders(),
  });

  return dedupeDiscoverablePlayers(asArray(await response.json()));
}

export async function findUserBySquadrId(squadrId) {
  const params = new URLSearchParams({
    select: '*',
    squadr_id: `eq.${squadrId}`,
  });

  const response = await fetch(`${restUrl('users')}?${params}`, {
    headers: restHeaders(),
  });

  return asArray(await response.json())[0] ?? null;
}

export async function sendFriendRequest({
  senderSquadrId,
  senderName,
  receiverSquadrId,
  receiverName,
}) {
  await fetch(restUrl('friend_requests'), {
    method: 'POST',
    headers: restHeaders(),
    body: JSON.stringify({
      sender_squadr_id: senderSquadrId,
      sender_name: senderName,
      receiver_squadr_id: receiverSquadrId,
      receiver_name: receiverName,
      status: 'pending',
    }),
  });
}

export async function fetchFriendRequests(squadrId) {
  const params = new URLSearchParams({
    select: '*',
    or: `(sender_squadr_id.eq.${squadrId},receiver_squadr_id.eq.${squadrId})`,
    order: 'created_at.desc',
  });

  const response = await fetch(`${restUrl('friend_requests')}?${params}`, {
    headers: restHeaders(),
  });

  return asArray(await response.json());
}

export async function updateFriendRequestStatus(id, status) {
  await fetch(`${restUrl('friend_requests')}?id=eq.${id}`, {
    method: 'PATCH',
    headers: restHeaders(),
    body: JSON.stringify({ status }),
  });
}

export async function createSessionInvites(sessionId, invitees) {
  if (!sessionId || !Array.isArray(invitees) || invitees.length === 0) {
    return;
  }

  const rows = invitees.map((invitee) => ({
    session_id: sessionId,
    invitee_squadr_id: invitee.squadrId,
    invitee_name: invitee.name,
    status: 'pending',
  }));

  await fetch(restUrl('session_invites'), {
    method: 'POST',
    headers: restHeaders(),
    body: JSON.stringify(rows),
  });
}

export async function fetchPendingInvites(squadrId) {
  const params = new URLSearchParams({
    select: '*',
    invitee_squadr_id: `eq.${squadrId}`,
    status: 'eq.pending',
    order: 'created_at.desc',
  });

  const response = await fetch(`${restUrl('session_invites')}?${params}`, {
    headers: restHeaders(),
  });

  return asArray(await response.json());
}

export async function updateInviteStatus(id, status) {
  await fetch(`${restUrl('session_invites')}?id=eq.${id}`, {
    method: 'PATCH',
    headers: restHeaders(),
    body: JSON.stringify({ status }),
  });
}
