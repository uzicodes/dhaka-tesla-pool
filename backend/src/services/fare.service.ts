// Distances between key Dhaka zones in kilometers
const ZONE_DISTANCES: Record<string, Record<string, number>> = {
  Banani: { Mohakhali: 3, "Gulshan 1": 2, "Gulshan 2": 2, Dhanmondi: 8, Uttara: 11 },
  Mohakhali: { Banani: 3, "Gulshan 1": 3, Dhanmondi: 6, Farmgate: 4 },
  "Gulshan 1": { Banani: 2, Mohakhali: 3, "Gulshan 2": 2, Badda: 2 },
};

// Rates represented in Poysha (100 Poysha = 1 BDT)
const BASE_FARE_POYSHA = 5000;         // 50 BDT base
const RATE_PER_KM_POYSHA = 2000;       // 20 BDT per km
const POOL_DISCOUNT_PERCENT = 25;      // 25% discount for pooling

export interface FareBreakdown {
  baseFarePoysha: number;
  distanceChargePoysha: number;
  poolDiscountPoysha: number;
  finalFarePoysha: number;
}

export function calculateFare(
  pickup: string,
  dropoff: string,
  isPooled: boolean = false
): FareBreakdown {
  const distance = ZONE_DISTANCES[pickup]?.[dropoff] || 5; // Default 5 km if unmapped
  const distanceCharge = distance * RATE_PER_KM_POYSHA;
  const subtotal = BASE_FARE_POYSHA + distanceCharge;
  const poolDiscount = isPooled ? Math.round((subtotal * POOL_DISCOUNT_PERCENT) / 100) : 0;
  const finalFare = subtotal - poolDiscount;

  return {
    baseFarePoysha: BASE_FARE_POYSHA,
    distanceChargePoysha: distanceCharge,
    poolDiscountPoysha: poolDiscount,
    finalFarePoysha: finalFare,
  };
}