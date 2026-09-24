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

export default function DriverDashboard() {
  const [driverId, setDriverId] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [activePool, setActivePool] = useState<any>(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      // 1. Get Jashim
      const driver = await fetchUserByEmail(MVP_CAST.JASHIM);
      setDriverId(driver.id);
      
      // 2. Get Pending Requests
      const pending = await fetchPendingRequests();
      setRequests(pending);

      // 3. Get Active Pool
      const pool = await fetchActivePool(driver.id);
      setActivePool(pool);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAccept = async (requestId: string) => {
    if (!driverId) return;
    setError('');
    try {
      await acceptRideRequest(driverId, requestId);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!activePool) return;
    setError('');
    try {
      await updatePoolStatus(activePool.id, status);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md text-black">
      <h1 className="text-2xl font-bold mb-2">Driver Dashboard (Jashim - Bullet)</h1>
      <p className="text-sm text-gray-600 mb-6">Status: Online | Capacity: 3 Seats</p>
      
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      {/* ACTIVE POOL SECTION */}
      {activePool && (
        <div className="mb-8 p-4 border-2 border-blue-500 bg-blue-50 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-blue-900">Active Pool: {activePool.status}</h2>
            <div className="space-x-2">
              {activePool.status === 'MATCHING' && (
                <button onClick={() => handleStatusChange('DRIVER_ARRIVED')} className="bg-blue-600 text-white px-3 py-1 rounded">Mark Arrived</button>
              )}
              {activePool.status === 'DRIVER_ARRIVED' && (
                <button onClick={() => handleStatusChange('STARTED')} className="bg-indigo-600 text-white px-3 py-1 rounded">Start Trip</button>
              )}
              {activePool.status === 'STARTED' && (
                <button onClick={() => handleStatusChange('COMPLETED')} className="bg-green-600 text-white px-3 py-1 rounded">Complete Trip</button>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="font-semibold text-sm text-gray-700">Passengers in vehicle:</p>
            {activePool.requests.map((req: any) => (
              <div key={req.id} className="bg-white p-2 rounded shadow-sm flex justify-between">
                <span>{req.passenger?.name} ({req.seatsRequested} seat)</span>
                <span className="text-sm text-gray-500">{req.pickupLocation} → {req.dropoffLocation}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PENDING REQUESTS SECTION */}
      <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
      {requests.length === 0 ? (
        <p className="text-gray-500">No passengers looking for rides right now.</p>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="border p-4 rounded flex justify-between items-center">
              <div>
                <p className="font-bold">{req.passenger?.name || 'Passenger'}</p>
                <p className="text-sm">{req.pickupLocation} → {req.dropoffLocation}</p>
                <p className="text-sm text-blue-600">Seats requested: {req.seatsRequested}</p>
              </div>
              <button 
                onClick={() => handleAccept(req.id)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Accept & Pool
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}