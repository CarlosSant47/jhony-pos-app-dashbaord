/**
 * Sample data bank used only by the ticket preview.
 * Any {variable} or table column field is resolved here, so new fields
 * can be added without touching the editor logic.
 */

export type SampleRow = Record<string, unknown>;

const detail: SampleRow[] = [
  { productName: 'Coca-Cola 600ml', sku: 'SKU-0001', barcode: '7501055300075', quantity: 3, unitPrice: 18, price: 54, cost: 12, discount: 0, unit: 'PZA' },
  { productName: 'Sabritas Original 45g', sku: 'SKU-0002', barcode: '7501011111111', quantity: 2, unitPrice: 18.25, price: 36.5, cost: 13, discount: 0, unit: 'PZA' },
  { productName: 'Agua Bonafont 1L', sku: 'SKU-0003', barcode: '7501055311111', quantity: 5, unitPrice: 11, price: 55, cost: 7.5, discount: 0, unit: 'PZA' },
  { productName: 'Pan Bimbo Blanco', sku: 'SKU-0004', barcode: '7501000111111', quantity: 1, unitPrice: 42, price: 42, cost: 31, discount: 2, unit: 'PZA' },
  { productName: 'Leche Lala 1L', sku: 'SKU-0005', barcode: '7501020500000', quantity: 4, unitPrice: 26.5, price: 106, cost: 21, discount: 0, unit: 'PZA' }
];

export const SAMPLE_DATA: Record<string, unknown> = {
  // Document
  folio: '000123',
  ticketNumber: 'T-2026-000123',
  date: '06/10/2026',
  time: '21:45',
  dateTime: '06/10/2026 21:45',
  documentType: 'VENTA',
  status: 'PAGADO',
  notes: 'Gracias por su compra',
  footerMessage: '¡Vuelva pronto!',

  // Business
  storeName: 'Abarrotes Jhony',
  businessName: 'Comercializadora Jhony S.A. de C.V.',
  businessRfc: 'CJO120315AB9',
  businessPhone: '55 1234 5678',
  businessAddress: 'Av. Reforma 123, Col. Centro, CDMX',
  branchName: 'Sucursal Centro',
  website: 'www.jhonypos.mx',

  // People
  customerName: 'Juan Pérez López',
  customerCode: 'CLI-00045',
  firstName: 'Juan',
  lastName: 'Pérez López',
  name: 'Juan Pérez López',
  rfc: 'PELJ850101AB3',
  curp: 'PELJ850101HDFRPN09',
  nss: '12345678901',
  phone: '55 8765 4321',
  mobile: '+52 55 1122 3344',
  email: 'juan.perez@correo.mx',
  sellerName: 'María González',
  cashierName: 'Carlos Ramírez',
  driverName: 'Pedro Hernández',

  // Address (Mexico)
  address: 'Calle Hidalgo 45, Col. Centro',
  street: 'Calle Hidalgo',
  exteriorNumber: '45',
  interiorNumber: '2B',
  neighborhood: 'Col. Centro',
  city: 'Ciudad de México',
  municipality: 'Cuauhtémoc',
  state: 'CDMX',
  country: 'México',
  zipCode: '06000',

  // Route / logistics
  routeName: 'Ruta Centro',
  routeCode: 'R-03',
  vehicle: 'Nissan NP300',
  plates: 'ABC-123-D',

  // Products (single-item context)
  productName: 'Coca-Cola 600ml',
  nameProduct: 'Coca-Cola 600ml',
  product: 'Coca-Cola 600ml',
  sku: 'SKU-0001',
  barcode: '7501055300075',
  category: 'Bebidas',
  brand: 'Coca-Cola',
  unit: 'PZA',
  quantity: 3,
  unitPrice: 18,
  price: 54,
  cost: 12,

  // Amounts
  subtotal: 293.5,
  discount: 5,
  tax: 46.96,
  taxRate: '16%',
  grandTotal: 335.46,
  total: 335.46,
  totalItems: 15,
  amountPaid: 400,
  change: 64.54,
  balance: 0,
  paymentMethod: 'Efectivo',
  cardLast4: '4242',
  authCode: 'A1B2C3',
  currency: 'MXN',

  // Fiscal (CFDI)
  uuid: '3FA85F64-5717-4562-B3FC-2C963F66AFA6',
  cfdiUse: 'G03',
  fiscalRegime: '601',

  // Lists
  detail,
  items: detail,
  products: detail,
  payments: [
    { method: 'Efectivo', amount: 200, reference: '' },
    { method: 'Tarjeta', amount: 135.46, reference: 'A1B2C3' }
  ],
  customers: [
    { name: 'Juan Pérez López', rfc: 'PELJ850101AB3', phone: '55 8765 4321' },
    { name: 'Ana Martínez Ruiz', rfc: 'MARA900515CD4', phone: '55 2233 4455' },
    { name: 'Luis Sánchez Gómez', rfc: 'SAGL780920EF5', phone: '33 9988 7766' }
  ]
};

/** Alternative values so generated rows are not all identical. */
const VARIANTS: Record<string, unknown[]> = {
  name: ['Juan Pérez López', 'Ana Martínez Ruiz', 'Luis Sánchez Gómez'],
  customerName: ['Juan Pérez López', 'Ana Martínez Ruiz', 'Luis Sánchez Gómez'],
  rfc: ['PELJ850101AB3', 'MARA900515CD4', 'SAGL780920EF5'],
  curp: ['PELJ850101HDFRPN09', 'MARA900515MDFRZN02', 'SAGL780920HJCNMS08'],
  phone: ['55 8765 4321', '55 2233 4455', '33 9988 7766'],
  email: ['juan.perez@correo.mx', 'ana.martinez@correo.mx', 'luis.sanchez@correo.mx'],
  quantity: [3, 2, 5, 1, 4],
  price: [54, 36.5, 55, 42, 106],
  unitPrice: [18, 18.25, 11, 42, 26.5],
  cost: [12, 13, 7.5, 31, 21]
};


function lookup(source: unknown, path: string): unknown {
  let current: any = source;
  for (const part of path.split('.')) {
    if (current === null || typeof current !== 'object') return undefined;
    if (part in current) {
      current = current[part];
    } else {
      const key = Object.keys(current).find(k => k.toLowerCase() === part.toLowerCase());
      if (key === undefined) return undefined;
      current = current[key];
    }
  }
  return current;
}

/** Resolves a single value: row first, then the bank. Supports "a.b" paths. */
export function resolveSampleValue(path: string, row?: SampleRow, rowIndex = 0): unknown {
  const fromRow = row ? lookup(row, path) : undefined;
  if (fromRow !== undefined) return fromRow;
  const variants = lookup(VARIANTS, path);
  if (Array.isArray(variants) && variants.length) return variants[rowIndex % variants.length];
  const value = lookup(SAMPLE_DATA, path);
  return Array.isArray(value) ? undefined : value;
}

/** Resolves the rows of a table; unknown lists get generated rows from the bank. */
export function resolveSampleRows(field: string, columnFields: string[]): SampleRow[] {
  const list = lookup(SAMPLE_DATA, field);
  if (Array.isArray(list)) return list as SampleRow[];
  return Array.from({ length: 3 }, (_, i) =>
    Object.fromEntries(columnFields.map(f => [f, resolveSampleValue(f, undefined, i)]))
  );
}

/** Top-level variable names, to show the user what can be used. */
export const SAMPLE_VARIABLES: string[] = Object.keys(SAMPLE_DATA).filter(
  k => !Array.isArray(SAMPLE_DATA[k])
);
export const SAMPLE_LISTS: string[] = Object.keys(SAMPLE_DATA).filter(k => Array.isArray(SAMPLE_DATA[k]));
