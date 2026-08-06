import { calculatePricing } from "../src/lib/pricing";

const r = calculatePricing({
  name: "Test",
  mode: "margin",
  materials: 1500,
  laborHours: 1,
  laborRate: 2500,
  packaging: 200,
  otherVariable: 0,
  fixedCosts: 200000,
  unitsMonth: 40,
  taxes: 0.05,
  marginPercent: 0.35,
  marginFloor: 0.2,
  marginCap: 0.5,
  targetPrice: 0,
});

console.log(r);
