import { supabaseUrl, supabaseAnonKey } from './supabase';

const restHeaders = (extra = {}) => ({
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
  'Content-Type': 'application/json',
  ...extra,
});

const restUrl = (path) => `${supabaseUrl}/rest/v1/${path}`;

const asArray = (data) => (Array.isArray(data) ? data : []);

const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function generateSquadrId() {
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += ID_CHARS.charAt(Math.floor(Math.random() * ID_CHARS.length));
  }
  return `SQUADR#${suffix}`;
}

export async function upsertUser({ name, squadrId, city, sports }) {
  await fetch(`${restUrl('users')}?on_conflict=squadr_id`, {
    method: 'POST',
    headers: restHeaders({ Prefer: 'resolution=merge-duplicates' }),
    body: JSON.stringify({
      name,
      squadr_id: squadrId,
      city,
      sports,
    }),
  });
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
