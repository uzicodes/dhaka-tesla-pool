export interface RideRequest {
  id: string;
  passengerId: string;
  pickupLocation: string;
  dropoffLocation: string;
  seatsRequested: number;
  status: 'REQUESTED' | 'MATCHED' | 'DRIVER_ARRIVED' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
  baseFarePoysha: number;
  distanceChargePoysha: number;
  poolDiscountPoysha: number;
  finalFarePoysha: number;
  createdAt: string;
  pool?: {
    id: string;
    status: string;
    driver: { name: string };
    vehicle: { name: string; capacity: number };
  } | null;
}

export interface ActivePool {
  id: string;
  driverId: string;
  status: 'MATCHING' | 'DRIVER_ARRIVED' | 'STARTED' | 'COMPLETED' | 'CANCELLED';
  vehicle: {
    name: string;
    capacity: number;
  };
  requests: Array<{
    id: string;
    seatsRequested: number;
    pickupLocation: string;
    dropoffLocation: string;
    status: string;
    passenger: { name: string };
  }>;
}