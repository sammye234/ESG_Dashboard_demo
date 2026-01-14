// client/src/utils/columnDetector.js

/**
 * Normalize column name - remove special characters, spaces, convert to lowercase
 */
const normalizeColumnName = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[\s\-_\(\)\[\]\.]/g, '') // Remove spaces, dashes, underscores, parentheses, brackets, dots
    .replace(/[^a-z0-9]/g, ''); // Keep only letters and numbers
};

/**
 * Check if a column name matches any of the possible names
 */
const matchesAnyName = (columnName, possibleNames) => {
  const normalized = normalizeColumnName(columnName);
  return possibleNames.some(name => {
    const normalizedName = normalizeColumnName(name);
    return normalized.includes(normalizedName) || normalizedName.includes(normalized);
  });
};

/**
 * Find a column by multiple possible names (flexible matching)
 */
export const findColumn = (row, possibleNames) => {
  if (!row || !possibleNames) return null;
  
  const keys = Object.keys(row);
  
  for (const key of keys) {
    if (matchesAnyName(key, possibleNames)) {
      return row[key];
    }
  }
  
  return null;
};

/**
 * Find column name (key) instead of value
 */
export const findColumnKey = (row, possibleNames) => {
  if (!row || !possibleNames) return null;
  
  const keys = Object.keys(row);
  
  for (const key of keys) {
    if (matchesAnyName(key, possibleNames)) {
      return key;
    }
  }
  
  return null;
};

/**
 * Column name mappings for common ESG data
 */
export const COLUMN_MAPPINGS = {
  // Month variations
  month: [
    'month', 'months', 'mon', 'periodo', 'period', 'date', 'time'
  ],
  
  // Total Emissions
  totalEmissions: [
    'total emissions', 'totalemissions', 'total_emissions',
    'emissions total', 'emissionstotal', 'emissions_total',
    'total co2', 'totalco2', 'total_co2',
    'total ghg', 'totalghg', 'total_ghg',
    'co2 total', 'co2total', 'co2_total'
  ],
  
  // Emission Intensity
  emissionIntensity: [
    'emission intensity', 'emissionintensity', 'emission_intensity',
    'intensity', 'carbon intensity', 'carbonintensity', 'carbon_intensity',
    'tco2 pc', 'tco2pc', 'tco2/pc', 'kgco2e', 'kg co2e',
    'co2 intensity', 'co2intensity', 'co2_intensity'
  ],
  
  // Production - Weight (Kg)
  productionKg: [
    'weight kg', 'weightkg', 'weight_kg', 'weight(kg)',
    'production kg', 'productionkg', 'production_kg', 'production(kg)',
    'kg', 'kilograms', 'kilogram', 'weight'
  ],
  
  // Production - Pieces
  productionPcs: [
    'pcs', 'pieces', 'piece', 'units', 'unit', 'quantity', 'qty',
    'production pcs', 'productionpcs', 'production_pcs', 'production(pcs)',
    'production pieces', 'productionpieces', 'production_pieces'
  ],
  
  // Production - USD/Revenue
  productionUSD: [
    'usd', 'revenue', 'sales', 'value', 'dollar', 'dollars',
    'sales usd', 'salesusd', 'sales_usd',
    'revenue usd', 'revenueusd', 'revenue_usd'
  ],
  
  // Diesel
  diesel: [
    'diesel', 'diesel l', 'diesell', 'diesel_l', 'diesel(l)',
    'diesel liters', 'dieselliters', 'diesel_liters',
    'diesel ltr', 'dieselltr', 'diesel_ltr'
  ],
  
  // Electricity/REB
  electricity: [
    'electricity', 'electric', 'power',
    'reb', 'reb kwh', 'rebkwh', 'reb_kwh', 'reb(kwh)',
    'kwh', 'kilowatt', 'kilowatthour'
  ],
  
  // Natural Gas
  naturalGas: [
    'natural gas', 'naturalgas', 'natural_gas',
    'ng', 'ng m3', 'ngm3', 'ng_m3', 'ng(m3)',
    'gas', 'methane'
  ],
  
  // Solar
  solar: [
    'solar', 'solar kwh', 'solarkwh', 'solar_kwh', 'solar(kwh)',
    'solar energy', 'solarenergy', 'solar_energy',
    'solar power', 'solarpower', 'solar_power'
  ],
  
  // Vehicle Fuel
  vehicleFuel: [
    'vehicle fuel', 'vehiclefuel', 'vehicle_fuel',
    'taka', 'vehicle taka', 'vehicletaka', 'vehicle_taka',
    'fuel', 'petrol', 'gasoline'
  ],
  
  // Scope 1
  scope1: [
    'scope 1', 'scope1', 'scope_1', 'scope1emissions',
    'scope 1 emissions', 'scope1emissions', 'scope_1_emissions'
  ],
  
  // Scope 2
  scope2: [
    'scope 2', 'scope2', 'scope_2', 'scope2emissions',
    'scope 2 emissions', 'scope2emissions', 'scope_2_emissions'
  ],
  
  // Scope 3
  scope3: [
    'scope 3', 'scope3', 'scope_3', 'scope3emissions',
    'scope 3 emissions', 'scope3emissions', 'scope_3_emissions'
  ]
};

/**
 * Auto-detect column names in a dataset
 */
export const detectColumns = (data) => {
  if (!data || data.length === 0) return {};
  
  const firstRow = data[0];
  const detected = {};
  
  Object.keys(COLUMN_MAPPINGS).forEach(key => {
    const columnKey = findColumnKey(firstRow, COLUMN_MAPPINGS[key]);
    if (columnKey) {
      detected[key] = columnKey;
    }
  });
  
  console.log('🔍 Auto-detected columns:', detected);
  return detected;
};

/**
 * Get value from row using flexible column matching
 */
export const getValueFromRow = (row, columnType) => {
  if (!row || !columnType) return null;
  
  const possibleNames = COLUMN_MAPPINGS[columnType];
  if (!possibleNames) return null;
  
  const value = findColumn(row, possibleNames);
  return value !== null && value !== '' ? parseFloat(value) : null;
};

/**
 * Get production value with priority: kg > pcs > USD
 */
export const getProductionValue = (row) => {
  // Priority 1: Weight in Kg
  const kg = getValueFromRow(row, 'productionKg');
  if (kg !== null && !isNaN(kg)) {
    return { value: kg, unit: 'kg' };
  }

  // Priority 2: Pieces
  const pcs = getValueFromRow(row, 'productionPcs');
  if (pcs !== null && !isNaN(pcs)) {
    return { value: pcs, unit: 'pcs' };
  }

  // Priority 3: USD
  const usd = getValueFromRow(row, 'productionUSD');
  if (usd !== null && !isNaN(usd)) {
    return { value: usd, unit: 'USD' };
  }

  return { value: 0, unit: 'N/A' };
};

export default {
  findColumn,
  findColumnKey,
  detectColumns,
  getValueFromRow,
  getProductionValue,
  COLUMN_MAPPINGS
};