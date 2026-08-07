export type ItemType = "producto" | "servicio" | "digital";

export type PricingInput = {
  name: string;
  mode: "margin" | "target";
  itemType: ItemType;
  materials: number;        // costo de materia prima / insumos por venta
  laborHours: number;       // horas de trabajo por venta
  laborRate: number;        // costo de la hora de trabajo
  packaging: number;        // envase y presentación por venta
  otherVariable: number;    // otros costos variables por venta
  fixedCosts: number;       // costos fijos totales por mes (alquiler, servicios, sueldo, etc.)
  unitsMonth: number;       // ventas estimadas por mes (para prorratear fijos)
  taxes: number;            // impuestos como % del precio final (0.05 = 5%)
  marginPercent: number;    // margen deseado (0.35 = 35%) — modo "margin"
  marginFloor: number;      // margen mínimo aceptable (rango de precio)
  marginCap: number;        // margen máximo (rango de precio)
  targetPrice: number;      // precio objetivo — modo "target"
  discountPercent: number;  // descuento habitual (0.10 = 10%) aplicado sobre el precio de lista
  channelCommission: number; // comisión del canal de venta (0.17 = 17%) sobre el precio efectivo
  shippingPerSale: number;  // envío promedio por venta
  monthlyGoal: number;      // ganancia mensual objetivo
};

export type PricingResult = {
  variableCostUnit: number;
  fixedCostUnit: number;
  totalCostUnit: number;
  listPrice: number;
  price: number;
  marginAmount: number;
  marginPercent: number;
  breakEvenUnits: number;
  breakEvenRevenue: number;
  priceMin: number;
  priceMax: number;
  effectivePrice: number;
  channelCostUnit: number;
  belowFloor: boolean;
  unitsForGoal: number;
};

export const defaultInput = (): PricingInput => ({
  name: "",
  mode: "margin",
  itemType: "producto",
  materials: 0,
  laborHours: 0,
  laborRate: 0,
  packaging: 0,
  otherVariable: 0,
  fixedCosts: 0,
  unitsMonth: 0,
  taxes: 0,
  marginPercent: 0,
  marginFloor: 0,
  marginCap: 0,
  targetPrice: 0,
  discountPercent: 0,
  channelCommission: 0,
  shippingPerSale: 0,
  monthlyGoal: 0,
});

export function calculatePricing(input: PricingInput): PricingResult {
  const discount = Math.min(Math.max(input.discountPercent || 0, 0), 1);
  const commission = Math.min(Math.max(input.channelCommission || 0, 0), 1);
  const shipping = Math.max(input.shippingPerSale || 0, 0);
  const goal = Math.max(input.monthlyGoal || 0, 0);

  const variableCostUnit =
    input.materials +
    input.laborHours * input.laborRate +
    input.packaging +
    input.otherVariable;

  const fixedCostUnit =
    input.unitsMonth > 0 ? input.fixedCosts / input.unitsMonth : 0;

  const totalCostUnit = variableCostUnit + fixedCostUnit + shipping;

  let listPrice: number;
  let marginAmount: number;
  let marginPercent: number;
  let effectivePrice: number;

  const commissionShare = 1 - input.taxes - commission;
  if (input.mode === "margin") {
    const share = commissionShare - input.marginPercent;
    if (share <= 0) {
      throw new Error("Margen + impuestos + comisión deben sumar menos de 100%.");
    }
    listPrice = totalCostUnit / share;
    effectivePrice = listPrice * (1 - discount);
    marginAmount = effectivePrice * commissionShare - totalCostUnit;
    marginPercent = (marginAmount / effectivePrice) * 100;
  } else {
    listPrice = input.targetPrice;
    effectivePrice = listPrice * (1 - discount);
    marginAmount = effectivePrice * commissionShare - totalCostUnit;
    marginPercent = (marginAmount / effectivePrice) * 100;
  }

  const contribution = effectivePrice * (1 - input.taxes - commission) - (variableCostUnit + shipping);
  const breakEvenUnits =
    contribution > 0 ? input.fixedCosts / contribution : 0;
  const breakEvenRevenue = breakEvenUnits * effectivePrice;

  const unitsForGoal = contribution > 0 ? (input.fixedCosts + goal) / contribution : 0;

  const shareMin = 1 - input.marginFloor - input.taxes - commission;
  const shareMax = 1 - input.marginCap - input.taxes - commission;
  const priceMin = shareMin > 0 ? totalCostUnit / shareMin : 0;
  const priceMax = shareMax > 0 ? totalCostUnit / shareMax : 0;

  return {
    variableCostUnit,
    fixedCostUnit,
    totalCostUnit,
    listPrice,
    price: listPrice,
    marginAmount,
    marginPercent,
    breakEvenUnits,
    breakEvenRevenue,
    priceMin,
    priceMax,
    effectivePrice,
    channelCostUnit: commission * effectivePrice + shipping,
    belowFloor: marginPercent < input.marginFloor * 100,
    unitsForGoal,
  };
}

export function round(n: number, decimals = 2): number {
  return Math.round(n * 10 ** decimals) / 10 ** decimals;
}

export type Scenario = {
  costFactor: number;
  unitsFactor: number;
  taxPoints: number;
};

export function applyScenario(input: PricingInput, scenario: Scenario): PricingInput {
  return {
    ...input,
    materials: input.materials * scenario.costFactor,
    packaging: input.packaging * scenario.costFactor,
    laborRate: input.laborRate * scenario.costFactor,
    otherVariable: input.otherVariable * scenario.costFactor,
    fixedCosts: input.fixedCosts * scenario.costFactor,
    unitsMonth: Math.max(1, input.unitsMonth * scenario.unitsFactor),
    taxes: Math.max(0, input.taxes + scenario.taxPoints / 100),
  };
}
