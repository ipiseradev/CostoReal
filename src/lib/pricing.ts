    export type PricingInput = {
    name: string;
    mode: "margin" | "target";
    materials: number;        // costo de materia prima por unidad
    laborHours: number;       // horas de mano de obra por unidad
    laborRate: number;        // costo de la hora de mano de obra
    packaging: number;        // packaging por unidad
    otherVariable: number;    // otros costos variables por unidad
    fixedCosts: number;       // costos fijos totales por mes (alquiler, servicios, sueldo, etc.)
    unitsMonth: number;       // unidades estimadas por mes (para prorratear fijos)
    taxes: number;            // impuestos como % del precio final (0.05 = 5%)
    marginPercent: number;    // margen deseado (0.35 = 35%) — modo "margin"
    marginFloor: number;      // margen mínimo aceptable (rango de precio)
    marginCap: number;        // margen máximo (rango de precio)
    targetPrice: number;      // precio objetivo — modo "target"
    };

    export type PricingResult = {
    variableCostUnit: number;
    fixedCostUnit: number;
    totalCostUnit: number;
    price: number;
    marginAmount: number;
    marginPercent: number;
    breakEvenUnits: number;
    breakEvenRevenue: number;
    priceMin: number;
    priceMax: number;
    };

    export function calculatePricing(input: PricingInput): PricingResult {
    const variableCostUnit =
        input.materials +
        input.laborHours * input.laborRate +
        input.packaging +
        input.otherVariable;

    const fixedCostUnit =
        input.unitsMonth > 0 ? input.fixedCosts / input.unitsMonth : 0;

    const totalCostUnit = variableCostUnit + fixedCostUnit;

    let price: number;
    let marginAmount: number;
    let marginPercent: number;

    if (input.mode === "margin") {
        const share = 1 - input.marginPercent - input.taxes;
        if (share <= 0) {
        throw new Error("Margen + impuestos deben sumar menos de 100%.");
        }
        price = totalCostUnit / share;
        marginAmount = price - totalCostUnit - price * input.taxes;
        marginPercent = (marginAmount / price) * 100;
    } else {
        price = input.targetPrice;
        marginAmount = price * (1 - input.taxes) - totalCostUnit;
        marginPercent = (marginAmount / price) * 100;
    }

    const contribution = price * (1 - input.taxes) - variableCostUnit;
    const breakEvenUnits =
        contribution > 0 ? input.fixedCosts / contribution : 0;
    const breakEvenRevenue = breakEvenUnits * price;

    const shareMin = 1 - input.marginFloor - input.taxes;
    const shareMax = 1 - input.marginCap - input.taxes;
    const priceMin = shareMin > 0 ? totalCostUnit / shareMin : 0;
    const priceMax = shareMax > 0 ? totalCostUnit / shareMax : 0;

    return {
        variableCostUnit,
        fixedCostUnit,
        totalCostUnit,
        price,
        marginAmount,
        marginPercent,
        breakEvenUnits,
        breakEvenRevenue,
        priceMin,
        priceMax,
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