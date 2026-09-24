import { RideRequest, ActivePool } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const MVP_CAST = {
  JASHIM: 'jashim@tesla.com', 
  NUSRAT: 'nusrat@test.com',  
  RAFIQ: 'rafiq@test.com',    
  SHIRIN: 'shirin@test.com',  
};

export function formatPoyshaToBDT(poysha: number): string {
  return `৳${(poysha / 100).toFixed(2)}`;
}

export async function fetchUserByEmail(email: string) {
  const res = await fetch(`${API_URL}/users?email=${email}`);
  if (!res.ok) throw new Error('User not found');
  return res.json();
}

export async function createRideRequest(data: any) {
  const res = await fetch(`${API_URL}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchPendingRequests() {
  const res = await fetch(`${API_URL}/requests/pending`);
  if (!res.ok) {
    throw new Error('Failed to fetch pending requests');
  }
  return res.json();
}

export async function acceptRideRequest(driverId: string, requestId: string) {
  const res = await fetch(`${API_URL}/pools/accept`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ driverId, requestId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

export async function fetchActivePool(driverId: string) {
  const res = await fetch(`${API_URL}/pools/active/${driverId}`);
  if (!res.ok) throw new Error('Failed to fetch active pool');
  return res.json();
}

export async function updatePoolStatus(poolId: string, status: string) {
  const res = await fetch(`${API_URL}/pools/${poolId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update pool status');
  return res.json();
}

export async function fetchActiveRequest(passengerId: string) {
  const res = await fetch(`${API_URL}/requests/active/${passengerId}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch active request');
  return res.json();
}

export async function cancelRideRequest(requestId: string) {
  const res = await fetch(`${API_URL}/requests/${requestId}/cancel`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error('Failed to cancel ride request');
  return res.json();
}

export const api = {
  createRequest: createRideRequest,
  fetchUserByEmail,
  fetchPendingRequests,
  acceptRideRequest,
  fetchActivePool,
  updatePoolStatus,
  fetchActiveRequest,
  cancelRideRequest,
  getPassengerRequests: async (passengerId: string): Promise<RideRequest[]> => {
    const res = await fetch(`${API_URL}/passengers/${passengerId}/requests`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch requests');
    return res.json();
  },
  cancelRequest: cancelRideRequest,
  getAvailableRequests: async () => {
    const res = await fetch(`${API_URL}/requests/pending`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch available requests');
    return res.json();
  },
  getDriverActivePool: async (driverId: string): Promise<ActivePool | null> => {
    return fetchActivePool(driverId);
  },
  acceptIntoPool: acceptRideRequest,
};