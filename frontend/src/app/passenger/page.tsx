'use client';

import { useState, useEffect } from 'react';
import {
  fetchUserByEmail,
  fetchActiveRequest,
  cancelRideRequest,
  MVP_CAST,
} from '@/lib/api';

const STATUS_DESCRIPTIONS: Record<string, { label: string; badge: string }> = {
  REQUESTED: { label: 'Finding nearby Teslas in Banani...', badge: 'bg-yellow-100 text-yellow-800' },
  MATCHED: { label: 'Matched with Jashim (Bullet)! Waiting for arrival.', badge: 'bg-blue-100 text-blue-800' },
  DRIVER_ARRIVED: { label: 'Bullet has arrived at pickup point!', badge: 'bg-indigo-100 text-indigo-800' },
  STARTED: { label: 'Trip in progress - Heading to destination.', badge: 'bg-purple-100 text-purple-800' },
  COMPLETED: { label: 'Trip completed! Hope Dhaka traffic was merciful.', badge: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Trip cancelled.', badge: 'bg-gray-100 text-gray-800' },
};

export default function PassengerDashboard() {
  const [passenger, setPassenger] = useState<any>(null);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // Initialize Nusrat as default actor
  useEffect(() => {
    async function initUser() {
      try {
        const user = await fetchUserByEmail(MVP_CAST.NUSRAT);
        setPassenger(user);
      } catch (err) {
        console.error('Failed to load passenger profile', err);
      } finally {
        setLoading(false);
      }
    }
    initUser();
  }, []);

  // Poll active request status every 3 seconds
  useEffect(() => {
    if (!passenger?.id) return;

    const poll = async () => {
      try {
        const currentReq = await fetchActiveRequest(passenger.id);
        setActiveRequest(currentReq);
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [passenger?.id]);

  const handleCancel = async () => {
    if (!activeRequest?.id) return;
    setCancelling(true);
    try {
      await cancelRideRequest(activeRequest.id);
      setActiveRequest(null);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading passenger workspace...</div>;

  return (
    <div className="max-w-xl mx-auto mt-8 p-6 bg-white rounded-xl shadow text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">Passenger: {passenger?.name}</h1>
          <p className="text-sm text-gray-500">{passenger?.email}</p>
        </div>
      </div>

      {activeRequest ? (
        <div className="border border-gray-200 rounded-lg p-5 bg-gray-50 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-600">Status</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                STATUS_DESCRIPTIONS[activeRequest.status]?.badge || 'bg-gray-200'
              }`}
            >
              {activeRequest.status}
            </span>
          </div>

          <p className="text-sm text-gray-700">
            {STATUS_DESCRIPTIONS[activeRequest.status]?.label}
          </p>

          <div className="bg-white p-3 rounded border text-sm space-y-1">
            <p><strong>Route:</strong> {activeRequest.pickupLocation} → {activeRequest.dropoffLocation}</p>
            <p><strong>Seats Reserved:</strong> {activeRequest.seatsRequested}</p>
            <p><strong>Estimated Fare:</strong> ৳{(activeRequest.finalFarePoysha / 100).toFixed(2)}</p>
            {activeRequest.pool?.vehicle && (
              <p><strong>Assigned Tesla:</strong> {activeRequest.pool.vehicle.name} (Driver: {activeRequest.pool.driver.name})</p>
            )}
          </div>

          {['REQUESTED', 'MATCHED', 'DRIVER_ARRIVED'].includes(activeRequest.status) && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full mt-2 py-2 px-4 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 text-sm font-medium transition disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Request'}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 text-sm">
          No active trip. Request a ride above to get started.
        </div>
      )}
    </div>
  );
}