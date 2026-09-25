'use client';

import { useState, useEffect } from 'react';
import {
  fetchUserByEmail,
  fetchActiveRequest,
  createRideRequest,
  cancelRideRequest,
  MVP_CAST,
} from '@/lib/api';

const LOCATIONS = ['Banani', 'Gulshan 1', 'Mohakhali', 'Dhanmondi', 'Uttara'];

const STATUS_CONFIG: Record<
  string,
  { label: string; badge: string; step: number; description: string }
> = {
  REQUESTED: {
    label: 'Looking for Tesla',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    step: 1,
    description: 'Scanning Banani hub for available shared Tesla Model 3 vehicles...',
  },
  MATCHED: {
    label: 'Matched with Bullet',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    step: 2,
    description: 'Driver Jashim accepted your request into "Bullet". Preparing for pickup.',
  },
  DRIVER_ARRIVED: {
    label: 'Driver Arrived',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    step: 3,
    description: 'Your Tesla has arrived at the pickup location. Please board the vehicle.',
  },
  STARTED: {
    label: 'Trip in Progress',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    step: 4,
    description: 'Cruising through Dhaka to your destination.',
  },
  COMPLETED: {
    label: 'Trip Completed',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    step: 5,
    description: 'You have safely reached your destination. Zero emissions emitted.',
  },
  CANCELLED: {
    label: 'Trip Cancelled',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    step: 0,
    description: 'This ride request has been cancelled.',
  },
};

export default function PassengerDashboard() {
  const [passenger, setPassenger] = useState<any>(null);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Booking form state
  const [pickup, setPickup] = useState('Banani');
  const [dropoff, setDropoff] = useState('Mohakhali');
  const [seats, setSeats] = useState(1);

  // Initialize Nusrat profile
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

  const handleRequestRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passenger?.id) return;
    setError(null);
    setSubmitting(true);

    try {
      const request = await createRideRequest({
        passengerId: passenger.id,
        pickupLocation: pickup,
        dropoffLocation: dropoff,
        seatsRequested: Number(seats),
      });
      setActiveRequest(request);
    } catch (err: any) {
      setError(err.message || 'Failed to submit ride request');
    } finally {
      setSubmitting(false);
    }
  };

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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="inline-block w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-medium text-slate-500">Connecting to Dhaka Commuter Network...</p>
      </div>
    );
  }

  const currentStatus = activeRequest?.status ? STATUS_CONFIG[activeRequest.status] : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Passenger Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Passenger Console</h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Commuter
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Logged in as <strong className="text-slate-800 font-semibold">{passenger?.name || 'Nusrat'}</strong> ({passenger?.email})
          </p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Dispatch Sync (3s)</span>
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
          {error}
        </div>
      )}

      {/* ACTIVE REQUEST / LIVE TRIP VIEW */}
      {activeRequest && (activeRequest.status !== 'CANCELLED' && activeRequest.status !== 'COMPLETED') ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
          {/* Header & Status Badge */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Trip Status</span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                {currentStatus?.label || activeRequest.status}
              </h2>
            </div>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                currentStatus?.badge || 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {activeRequest.status}
            </span>
          </div>

          {/* Stepper Progress Bar */}
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2">
              {[
                { step: 1, name: 'Requested' },
                { step: 2, name: 'Matched' },
                { step: 3, name: 'Arrived' },
                { step: 4, name: 'In Transit' },
              ].map((s) => {
                const isPassed = (currentStatus?.step || 0) >= s.step;
                const isCurrent = (currentStatus?.step || 0) === s.step;
                return (
                  <div key={s.step} className="space-y-1">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        isPassed ? 'bg-slate-900' : 'bg-slate-100'
                      } ${isCurrent ? 'ring-2 ring-slate-900/20' : ''}`}
                    ></div>
                    <span
                      className={`text-[10px] font-medium block text-center ${
                        isPassed ? 'text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      {s.name}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-3">
              {currentStatus?.description}
            </p>
          </div>

          {/* Trip Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 uppercase font-semibold text-[10px]">Route Corridors</span>
              <div className="font-semibold text-slate-800 text-sm">
                {activeRequest.pickupLocation} → {activeRequest.dropoffLocation}
              </div>
              <div className="text-slate-500">Reserved: {activeRequest.seatsRequested} {activeRequest.seatsRequested === 1 ? 'Seat' : 'Seats'}</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 uppercase font-semibold text-[10px]">Assigned Vehicle</span>
              <div className="font-semibold text-slate-800 text-sm">
                {activeRequest.pool?.vehicle ? `${activeRequest.pool.vehicle.name} (Tesla Model 3)` : 'Matching available Tesla...'}
              </div>
              <div className="text-slate-500">
                Driver: {activeRequest.pool?.driver ? activeRequest.pool.driver.name : 'Pending match'}
              </div>
            </div>
          </div>

          {/* Fare Summary */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex justify-between items-center text-xs">
            <div>
              <span className="font-semibold text-emerald-900">Calculated Pooled Fare</span>
              <p className="text-[11px] text-emerald-700">Fixed rate calculated in integer Poysha</p>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-emerald-900">
                ৳{(activeRequest.finalFarePoysha / 100).toFixed(2)}
              </span>
              <p className="text-[10px] text-emerald-600">Base ৳60 + Dist ৳120</p>
            </div>
          </div>

          {/* Cancellation Control */}
          {['REQUESTED', 'MATCHED', 'DRIVER_ARRIVED'].includes(activeRequest.status) && (
            <div className="pt-2">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full py-2.5 px-4 bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                {cancelling ? 'Cancelling Trip...' : 'Cancel Ride Request'}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* BOOKING FORM (When no active trip or trip completed) */
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          {activeRequest?.status === 'COMPLETED' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex justify-between items-center">
              <span>Your previous trip to <strong>{activeRequest.dropoffLocation}</strong> is completed!</span>
              <button
                onClick={() => setActiveRequest(null)}
                className="text-emerald-900 font-semibold underline ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          <div>
            <h2 className="text-lg font-bold text-slate-900">Book a Pooled Tesla</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select your Dhaka pickup and destination corridor to join a pooled vehicle.
            </p>
          </div>

          <form onSubmit={handleRequestRide} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pickup Hub
                </label>
                <select
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Destination Hub
                </label>
                <select
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition"
                >
                  {LOCATIONS.filter((l) => l !== pickup).map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Seats Needed (Max 3)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSeats(num)}
                    className={`py-2 text-xs font-semibold rounded-xl border transition ${
                      seats === num
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {num} {num === 1 ? 'Seat' : 'Seats'}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Preview Card */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center text-xs">
              <div>
                <span className="font-semibold text-slate-800">Estimated Non-Pooled Fare</span>
                <p className="text-[11px] text-slate-500">25% pool discount applies once grouped</p>
              </div>
              <span className="font-bold text-slate-900 text-sm">৳180.00</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Submitting Ride Request...' : 'Find Shared Tesla'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}