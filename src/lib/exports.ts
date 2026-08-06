import ExcelJS from "exceljs";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { calculatePricing, type PricingInput, type PricingResult } from "@/lib/pricing";

export type SavedProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  data: PricingInput;
  createdAt: string;
  updatedAt: string;
};

const ars = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "producto"
  );
}

export async function buildExcel(products: SavedProduct[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CostoReal";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Productos");
  sheet.columns = [
    { header: "Producto", key: "name", width: 26 },
    { header: "Categoría", key: "category", width: 18 },
    { header: "Precio sugerido", key: "price", width: 16, style: { numFmt: "$#,##0" } },
    { header: "Margen real", key: "marginPercent", width: 13, style: { numFmt: "0.0\"%\"" } },
    { header: "Costo variable / u", key: "variableCostUnit", width: 17, style: { numFmt: "$#,##0" } },
    { header: "Costo fijo / u", key: "fixedCostUnit", width: 15, style: { numFmt: "$#,##0" } },
    { header: "Costo total / u", key: "totalCostUnit", width: 15, style: { numFmt: "$#,##0" } },
    { header: "Punto de equilibrio", key: "breakEvenUnits", width: 19, style: { numFmt: "0.0\" u/mes\"" } },
    { header: "Rango de precio", key: "range", width: 26 },
    { header: "Materia prima", key: "materials", width: 14, style: { numFmt: "$#,##0" } },
    { header: "Packaging", key: "packaging", width: 12, style: { numFmt: "$#,##0" } },
    { header: "Horas de mano de obra", key: "laborHours", width: 20, style: { numFmt: "0.00\" hs\"" } },
    { header: "Valor de la hora", key: "laborRate", width: 14, style: { numFmt: "$#,##0" } },
    { header: "Otros costos variables", key: "otherVariable", width: 20, style: { numFmt: "$#,##0" } },
    { header: "Costos fijos / mes", key: "fixedCosts", width: 17, style: { numFmt: "$#,##0" } },
    { header: "Unidades / mes", key: "unitsMonth", width: 14, style: { numFmt: "0\" u\"" } },
    { header: "Impuestos", key: "taxes", width: 11, style: { numFmt: "0\"%\"" } },
    { header: "Margen objetivo", key: "marginTarget", width: 14, style: { numFmt: "0\"%\"" } },
    { header: "Actualizado", key: "updatedAt", width: 18 },
  ];

  for (const product of products) {
    let result;
    try {
      result = calculatePricing(product.data);
    } catch {
      continue;
    }
    const d = product.data;
    sheet.addRow({
      name: product.name,
      category: product.category,
      price: result.price,
      marginPercent: result.marginPercent,
      variableCostUnit: result.variableCostUnit,
      fixedCostUnit: result.fixedCostUnit,
      totalCostUnit: result.totalCostUnit,
      breakEvenUnits: result.breakEvenUnits,
      range: d.mode === "margin" ? `${ars.format(result.priceMin)} – ${ars.format(result.priceMax)}` : "—",
      materials: d.materials,
      packaging: d.packaging,
      laborHours: d.laborHours,
      laborRate: d.laborRate,
      otherVariable: d.otherVariable,
      fixedCosts: d.fixedCosts,
      unitsMonth: d.unitsMonth,
      taxes: d.taxes * 100,
      marginTarget: d.mode === "margin" ? d.marginPercent * 100 : null,
      updatedAt: new Date(product.updatedAt).toLocaleDateString("es-AR"),
    });
  }

  const headerRow = sheet.getRow(1);
  headerRow.height = 20;
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF18181B" },
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(products.length + 1, 2), column: sheet.columnCount },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

type PdfFonts = { font: PDFFont; bold: PDFFont };

function drawProductPage(doc: PDFDocument, fonts: PdfFonts, product: SavedProduct): void {
  const { font, bold } = fonts;
  const page: PDFPage = doc.addPage([595, 842]);
  const W = page.getWidth();
  const M = 48;

  page.drawRectangle({
    x: 0,
    y: 0,
    width: W,
    height: 52,
    color: rgb(0.09, 0.09, 0.11),
  });
  page.drawText("CostoReal", { x: M, y: 17, size: 20, font: bold, color: rgb(1, 1, 1) });
  page.drawText(
    `Generado el ${new Date().toLocaleDateString("es-AR")}`,
    { x: W - M - 130, y: 20, size: 10, font, color: rgb(0.85, 0.85, 0.85) }
  );

  let result: PricingResult | null = null;
  try {
    result = calculatePricing(product.data);
  } catch {
    result = null;
  }

  page.drawText(product.name, { x: M, y: 90, size: 24, font: bold, color: rgb(0.09, 0.09, 0.11) });
  page.drawText(product.category.toUpperCase(), { x: M, y: 70, size: 10, font, color: rgb(0.45, 0.45, 0.45) });

  if (result) {
    page.drawText("Precio de venta sugerido", { x: M, y: 128, size: 11, font, color: rgb(0.45, 0.45, 0.45) });
    page.drawText(ars.format(result.price), { x: M, y: 138, size: 42, font: bold, color: rgb(0.09, 0.09, 0.11) });
  }

  const rows: Array<[string, string, boolean]> = [];
  if (result) {
    rows.push(["Costo variable por unidad", ars.format(result.variableCostUnit), false]);
    rows.push(["Costo fijo por unidad", ars.format(result.fixedCostUnit), false]);
    rows.push(["Costo total por unidad", ars.format(result.totalCostUnit), true]);
    rows.push(["Margen real", `${result.marginPercent.toFixed(1)}%`, false]);
    rows.push(["Punto de equilibrio", `${result.breakEvenUnits.toFixed(1)} u/mes`, true]);
  }
  rows.push(["Materia prima por unidad", ars.format(product.data.materials), false]);
  rows.push(["Packaging por unidad", ars.format(product.data.packaging), false]);
  rows.push(["Mano de obra por unidad", `${product.data.laborHours} hs × ${ars.format(product.data.laborRate)}`, false]);
  rows.push(["Otros costos variables", ars.format(product.data.otherVariable), false]);
  rows.push(["Costos fijos mensuales", ars.format(product.data.fixedCosts), false]);
  rows.push(["Unidades vendidas / mes", `${product.data.unitsMonth} u`, false]);
  rows.push(["Impuestos", `${(product.data.taxes * 100).toFixed(0)}%`, false]);
  if (product.data.mode === "margin") {
    rows.push(["Margen deseado", `${(product.data.marginPercent * 100).toFixed(0)}%`, false]);
  } else {
    rows.push(["Precio objetivo", ars.format(product.data.targetPrice), false]);
  }

  let y = 205;
  page.drawRectangle({ x: M, y: y - 4, width: W - M * 2, height: 24, color: rgb(0.09, 0.09, 0.11) });
  page.drawText("Detalle", { x: M, y: y + 6, size: 12, font: bold, color: rgb(1, 1, 1) });
  page.drawText("Valor", { x: W - M - 90, y: y + 6, size: 12, font: bold, color: rgb(1, 1, 1) });
  y -= 46;

  for (const [label, value, strong] of rows) {
    page.drawText(label, { x: M, y, size: 11, font: strong ? bold : font, color: rgb(0.09, 0.09, 0.11) });
    page.drawText(value, { x: W - M - 90, y, size: 11, font: strong ? bold : font, color: rgb(0.09, 0.09, 0.11) });
    y -= 26;
    if (strong) y -= 6;
  }

  if (result) {
    page.drawText(
      `Rango recomendado: ${ars.format(result.priceMin)} – ${ars.format(result.priceMax)}`,
      { x: M, y: y - 10, size: 11, font: bold, color: rgb(0.09, 0.09, 0.11) }
    );
  }

  page.drawText(
    "Los resultados son orientativos y no constituyen asesoramiento contable, impositivo ni legal.",
    { x: M, y: 36, size: 8, font, color: rgb(0.55, 0.55, 0.55) }
  );
}

export async function buildPdf(product: SavedProduct): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${product.name} — CostoReal`);
  doc.setAuthor("CostoReal");
  const fonts: PdfFonts = {
    font: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  drawProductPage(doc, fonts, product);
  return Buffer.from(await doc.save());
}

export async function buildPdfAll(products: SavedProduct[]): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setTitle("CostoReal — Productos");
  doc.setAuthor("CostoReal");
  const fonts: PdfFonts = {
    font: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  for (const product of products) {
    drawProductPage(doc, fonts, product);
  }
  return Buffer.from(await doc.save());
}

export function pdfFileName(name: string): string {
  return `costo-real-${slugify(name)}.pdf`;
}

export function excelFileName(): string {
  return "costo-real-productos.xlsx";
}

export function pdfAllFileName(): string {
  return "costo-real-productos.pdf";
}
