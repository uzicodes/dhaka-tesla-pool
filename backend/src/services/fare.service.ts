export const calculateFare = (pickup: string, dropoff: string, isPooled: boolean) => {
  // Simple mock distance logic for the MVP
  const baseFarePoysha = 6000; // 60 BDT
  const distanceChargePoysha = 12000; // 120 BDT
  const poolDiscountPoysha = isPooled ? 4000 : 0; // 40 BDT discount if pooling

  return {
    baseFarePoysha,
    distanceChargePoysha,
    poolDiscountPoysha,
    finalFarePoysha: baseFarePoysha + distanceChargePoysha - poolDiscountPoysha,
  };
};