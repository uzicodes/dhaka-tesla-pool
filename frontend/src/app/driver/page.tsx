'use client';

import { useState, useEffect } from 'react';
import { 
  fetchUserByEmail, 
  fetchPendingRequests, 
  acceptRideRequest, 
  fetchActivePool, 
  updatePoolStatus, 
  MVP_CAST 
} from '@/lib/api';

const POOL_STATUS_CONFIG: Record<string, { label: string; badge: string; nextAction?: string; nextStatus?: string; btnColor?: string }> = {
  MATCHING: {
    label: 'Matching Commuters',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    nextAction: 'Mark Driver Arrived at Pickup',
    nextStatus: 'DRIVER_ARRIVED',
    btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  DRIVER_ARRIVED: {
    label: 'At Pickup Location',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    nextAction: 'Start Pooled Trip',
    nextStatus: 'STARTED',
    btnColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  },
  STARTED: {
    label: 'Trip in Progress',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    nextAction: 'Complete Trip & Free Seats',
    nextStatus: 'COMPLETED',
    btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  COMPLETED: {
    label: 'Trip Completed',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

export default function DriverDashboard() {
  const [driverId, setDriverId] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [activePool, setActivePool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const driver = await fetchUserByEmail(MVP_CAST.JASHIM);
      setDriverId(driver.id);

      const [pending, pool] = await Promise.all([
        fetchPendingRequests(),
        fetchActivePool(driver.id),
      ]);
      setRequests(pending || []);
      setActivePool(pool);
    } catch (err: any) {
      console.error('Error loading driver data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (requestId: string) => {
    if (!driverId) return;
    setError('');
    setActionLoading(true);
    try {
      await acceptRideRequest(driverId, requestId);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to accept ride request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!activePool) return;
    setError('');
    setActionLoading(true);
    try {
      await updatePoolStatus(activePool.id, status);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update pool status');
    } finally {
      setActionLoading(false);
    }
  };

  const totalOccupiedSeats = activePool?.requests
    ? activePool.requests.reduce((sum: number, r: any) => sum + r.seatsRequested, 0)
    : 0;

  const currentPoolStatus = activePool?.status ? POOL_STATUS_CONFIG[activePool.status] : null;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="inline-block w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-medium text-slate-500">Connecting to Tesla "Bullet" telemetry...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Driver Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">Driver Console: Jashim</h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Assigned Pilot
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Vehicle: <strong className="text-slate-800 font-semibold">Bullet</strong> (Tesla Model 3 • Max 3 Seats)
          </p>
        </div>
        <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Online & Ready</span>
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-900 font-bold ml-2">×</button>
        </div>
      )}

      {/* ACTIVE POOL CARD */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Trip Pool</span>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              {activePool ? currentPoolStatus?.label || activePool.status : 'No Active Pool'}
            </h2>
          </div>
          {activePool && (
            <span
              className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                currentPoolStatus?.badge || 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {activePool.status}
            </span>
          )}
        </div>

        {/* Capacity Meter */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700">Vehicle Seat Capacity</span>
            <span className="font-bold text-slate-900">
              {totalOccupiedSeats} / 3 Seats Claimed
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((slot) => {
              const isOccupied = slot <= totalOccupiedSeats;
              return (
                <div
                  key={slot}
                  className={`py-1.5 text-center rounded-lg text-[10px] font-semibold uppercase tracking-wider border transition-all ${
                    isOccupied
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-400 border-slate-200'
                  }`}
                >
                  Seat {slot}: {isOccupied ? 'Occupied' : 'Free'}
                </div>
              );
            })}
          </div>
        </div>

        {activePool ? (
          <div className="space-y-4">
            {/* Passengers in Vehicle */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Passenger Manifest ({activePool.requests?.length || 0})
              </span>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                {activePool.requests?.length === 0 ? (
                  <p className="p-3 text-xs text-slate-400 italic">No passengers currently assigned.</p>
                ) : (
                  activePool.requests.map((req: any) => (
                    <div key={req.id} className="p-3 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">{req.passenger?.name || 'Passenger'}</div>
                        <div className="text-[11px] text-slate-500">{req.pickupLocation} → {req.dropoffLocation}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold text-[11px]">
                        {req.seatsRequested} {req.seatsRequested === 1 ? 'seat' : 'seats'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Lifecycle Control Action */}
            {currentPoolStatus?.nextStatus && (
              <div className="pt-1">
                <button
                  onClick={() => handleStatusChange(currentPoolStatus.nextStatus!)}
                  disabled={actionLoading}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-semibold shadow-xs transition ${
                    currentPoolStatus.btnColor || 'bg-slate-900 text-white hover:bg-slate-800'
                  } disabled:opacity-50`}
                >
                  {actionLoading ? 'Updating Lifecycle...' : currentPoolStatus.nextAction}
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            Bullet is currently idle. Accept a commuter request below to create an active pool.
          </p>
        )}
      </div>

      {/* PENDING REQUESTS SECTION */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pending Commuter Requests</h2>
            <p className="text-xs text-slate-500">Live requests waiting for Tesla pickup in Dhaka corridors</p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {requests.length} waiting
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
            <p className="font-semibold text-slate-700">No pending ride requests</p>
            <p className="text-[11px] text-slate-400">Commuters requesting rides from Banani or Gulshan will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const exceedsCapacity = totalOccupiedSeats + req.seatsRequested > 3;

              return (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{req.passenger?.name || 'Commuter'}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                        {req.seatsRequested} {req.seatsRequested === 1 ? 'seat' : 'seats'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium">
                      {req.pickupLocation} → {req.dropoffLocation}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Fare: ৳{(req.finalFarePoysha / 100).toFixed(2)}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAccept(req.id)}
                    disabled={exceedsCapacity || actionLoading}
                    className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold transition shadow-xs ${
                      exceedsCapacity
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {exceedsCapacity
                      ? `Exceeds Capacity (${3 - totalOccupiedSeats} left)`
                      : 'Accept & Pool →'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}