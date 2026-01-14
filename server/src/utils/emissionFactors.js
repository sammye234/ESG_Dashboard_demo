// server/src/utils/emissionFactors.js

/**
 * SCOPE 3 - Material Emission Factors (tCO₂e per tonne)
 * Source: PDF Section 5.1.1 - Fabrics
 */
exports.MATERIAL_EF = {
  // Recycled materials (lower emissions)
  'recycled polyester': 2.5,
  'recycled cotton': 3.5,
  'recycled nylon': 5.4,
  'recycled polyamide': 5.4,
  
  // Standard fabrics
  'fleece': 5.0,
  'organic cotton': 5.0,
  'polyester': 5.0,
  'poplin': 5.0,
  'ribstope': 5.0,
  'taslon': 5.0,
  'wrap knitted tricot': 5.0,
  'tpu': 5.3,
  'bci cotton': 5.5,
  'cotton': 6.5,
  'others': 6.5,
  'viscose': 6.5,
  'woven': 6.5,
  
  // Stretch materials
  'elastane': 8.0,
  'lyocell': 8.0,
  'spandex': 8.0,
  
  // High-impact materials
  'linen': 10.0,
  'nylon': 10.0,
  'polyamide': 10.0,
  'rayon': 14.0,
  'wool': 20.0,
  
  // Very high-impact materials
  'acrylic': 35.7,
  'mod acrylic': 35.7,
  'modacrylic': 35.7,
  
  // Specialty materials
  'cordura': 6.2,
  'synthetic': 5.0
};

/**
 * SCOPE 3 - Chemical & Accessories Emission Factors (tCO₂e per tonne)
 * Source: PDF Section 5.1.2
 */
exports.CHEMICAL_EF = {
  // Lubricants & oils
  'machine oil': 3.668,
  'machineoil': 3.668,
  'lubricant': 6.0,
  
  // Treatment chemicals
  'boilermate': 6.0,
  'boilermate is-101in': 6.0,
  'bwt-phb 301': 6.0,
  'bwtphb301': 6.0,
  'sodium chloride': 5.5,
  'sodiumchloride': 5.5,
  
  // Maintenance products
  'rotair plus': 6.0,
  'rotairplus': 6.0,
  'mizho rollax': 6.0,
  'mizhorollax': 6.0,
  
  // Inks & sprays
  'hoggly ink': 10.0,
  'hogglyink': 10.0,
  'wd-40': 2.0,
  'wd40': 2.0,
  'silicone spray': 2.0,
  'siliconespray': 2.0,
  'spot lifter': 2.0,
  'spot lifter-833': 2.0,
  'spotlifter': 2.0,
  
  // CK series
  'ck 3873': 6.0,
  'ck3873': 6.0,
  'ck 8012': 6.0,
  'ck8012': 6.0,
  'ck 9601': 6.0,
  'ck9601': 6.0,
  
  // Generic categories (using GZA Spend Based Calculator placeholders)
  'clothing': 2.0,
  'electrical item-small': 1.5,
  'metal': 2.5,
  'paint': 3.5,
  'paper and board': 0.8262,
  'plastics': 6.0,
  'rubber': 3.0,
  'stationary item': 1.2,
  'synthetic resin adhesive': 4.0
};

/**
 * SCOPE 3 - Capital Goods Emission Factors (tCO₂e per tonne)
 * Source: PDF Section 5.2 - Using GZA Spend Based Scope 3 Calculator
 */
exports.CAPITAL_GOODS_EF = {
  'bricks': 0.5,
  'cement': 0.9,
  'tiles': 0.4,
  'rod': 2.5,
  'steel': 2.5,
  'iron': 2.5,
  'machinery': 1.5,
  'equipment': 1.5,
  'factory equipment': 1.5
};

/**
 * Scope-based Emission Factors
 * SCOPE 1 & 2 aligned with UNFCC_GHG Calculator, Defra, IPCC
 */
exports.EMISSION_FACTORS = {
  // SCOPE 1 - Direct Emissions (kgCO₂e per unit)
  // Source: PDF Section 5.8 + Standard protocols
  scope1: {
    'diesel': { value: 2.68, unit: 'L' },
    'petrol': { value: 2.31, unit: 'L' },
    'gasoline': { value: 2.31, unit: 'L' },
    'naturalgas': { value: 1.9, unit: 'm³' },
    'ng': { value: 1.9, unit: 'm³' },
    'lpg': { value: 3.03, unit: 'kg' },
    'coal': { value: 2.42, unit: 'kg' },
    'fueloil': { value: 3.15, unit: 'L' },
  },
  
  // SCOPE 2 - Indirect Emissions (kgCO₂e per unit)
  // Bangladesh grid factor: 0.62 kgCO₂e/kWh
  scope2: {
    'electricity': { value: 0.62, unit: 'kWh' },
    'reb': { value: 0.62, unit: 'kWh' },
    'grid': { value: 0.62, unit: 'kWh' },
    'steam': { value: 0.35, unit: 'kg' },
    'heating': { value: 0.25, unit: 'kWh' },
    'cooling': { value: 0.18, unit: 'kWh' },
  },
  
  // SCOPE 3 - Legacy/Generic factors (for backward compatibility)
  // For detailed Scope 3, use specific category exports below
  scope3: {
    'waste': { value: 0.75, unit: 'kg' },  // Updated to match PDF 5.7
    'metalwaste': { value: 0.022, unit: 'kg' },
    'electricwaste': { value: 0.6, unit: 'kg' },
    'foodwaste': { value: 0.6397, unit: 'kg' },
    'paper': { value: 0.8262, unit: 'kg' },
    'plastic': { value: 0.022, unit: 'kg' },
    'chemical': { value: 3.5, unit: 'kg' },
    'dyes': { value: 4.0, unit: 'kg' },
    'transport': { value: 0.00018, unit: 'tonne.km' },  // Large van default
  }
};

/**
 * SCOPE 3 - Transportation (tCO₂e per km.tonne)
 * Source: PDF Section 5.3 & 5.4
 * Reference: UNFCC_GHG Calculator, Defra, IPCC, Carbon Fact
 */
exports.TRANSPORT_EF = {
  'covered_van_small': {
    value: 0.00049,
    unit: 'tCO₂e/km.tonne',
    capacity: '3.5-7.5 tons',
    type: 'small'
  },
  'covered_van_large': {
    value: 0.00018,
    unit: 'tCO₂e/km.tonne',
    capacity: '>17 tons',
    type: 'large'
  },
  'van_small': {
    value: 0.00049,
    unit: 'tCO₂e/km.tonne',
    capacity: '3.5-7.5 tons',
    type: 'small'
  },
  'van_large': {
    value: 0.00018,
    unit: 'tCO₂e/km.tonne',
    capacity: '>17 tons',
    type: 'large'
  },
  'truck_small': {
    value: 0.00049,
    unit: 'tCO₂e/km.tonne',
    capacity: '3.5-7.5 tons',
    type: 'small'
  },
  'truck_large': {
    value: 0.00018,
    unit: 'tCO₂e/km.tonne',
    capacity: '>17 tons',
    type: 'large'
  }
};

/**
 * SCOPE 3 - Business Travel Routes (tCO₂e per trip)
 * Source: PDF Section 5.5
 * Reference: https://applications.icao.int/icec/Home/Index
 */
exports.BUSINESS_TRAVEL_ROUTES = {
  'dhaka_denmark': {
    emission_per_trip: 2.106,
    name: 'Dhaka → Denmark → Dhaka',
    distance_km: 7150,
    ghg_emission_factor: 20.07  // kgCO₂e/km
  },
  'dhaka_frankfurt': {
    emission_per_trip: 1.013,
    name: 'Dhaka → Frankfurt → Dhaka',
    distance_km: 6800,
    ghg_emission_factor: 22.57
  },
  'dhaka_sweden': {
    emission_per_trip: 1.013,
    name: 'Dhaka → Sweden → Dhaka',
    distance_km: 7200,
    ghg_emission_factor: 57.81
  },
  'dhaka_china': {
    emission_per_trip: 1.139,
    name: 'Dhaka → China → Dhaka',
    distance_km: 3200,
    ghg_emission_factor: 76.74
  },
  'dhaka_netherlands': {
    emission_per_trip: 1.035,
    name: 'Dhaka → Netherlands → Dhaka',
    distance_km: 7100,
    ghg_emission_factor: 23.78
  },
  'custom': {
    name: 'Custom Route',
    emission_per_km: 0.00011,  // tCO₂e/km for international flights
    emission_per_km_domestic: 0.00015  // tCO₂e/km for domestic flights
  }
};

/**
 * SCOPE 3 - Employee Commuting (kgCO₂e per km)
 * Source: PDF Section 5.6
 * Reference: Carbon Fact, UNFCC_GHG Calculator
 */
exports.COMMUTING_EF = {
  'public_bus': 0.1,
  'public_transport_bus': 0.1,
  'bus': 0.1,
  'employee_bus': 0.1,
  'company_bus': 0.1,
  
  'motor_bike': 0.08,
  'motorbike': 0.08,
  'motorcycle': 0.08,
  'bike': 0.08,
  
  'easy_bike': 0.05,
  'easy_bike_auto': 0.05,
  'auto': 0.05,
  'auto_rickshaw': 0.05,
  'cng': 0.05,
  
  'private_micro_bus': 0.24,
  'micro_bus': 0.24,
  'microbus': 0.24,
  
  'bicycle': 0,
  'foot': 0,
  'walking': 0,
  'walk': 0,
  
  // Additional modes (not in PDF but useful)
  'car': 0.2,
  'taxi': 0.2,
  'rideshare': 0.15,
  'train': 0.05,
  'subway': 0.04,
  'tram': 0.03
};

/**
 * SCOPE 3 - Waste Generation (tCO₂e per tonne)
 * Source: PDF Section 5.7
 * Reference: EPA GHG Emission Factors Hub
 */
exports.WASTE_EF = {
  'materials': 0.75,
  'material': 0.75,
  'textile': 0.75,
  'fabric': 0.75,
  
  'metal': 0.022,
  'metal_waste': 0.022,
  'metalwaste': 0.022,
  
  'plastic': 0.022,
  'plastic_waste': 0.022,
  'plasticwaste': 0.022,
  
  'rubber': 0.022,
  'rubber_waste': 0.022,
  'rubberwaste': 0.022,
  
  'paper': 0.8262,
  'paper_waste': 0.8262,
  'paperwaste': 0.8262,
  
  'food': 0.6397,
  'food_waste': 0.6397,
  'foodwaste': 0.6397,
  
  'carton': 0.022,
  'wastage_carton': 0.022,
  'wastagecarton': 0.022,
  'cardboard': 0.022
};

/**
 * SCOPE 3 - Fuel & Energy Related Activities (kgCO₂e per unit)
 * Source: PDF Section 5.8
 * Reference: UNFCC_GHG Calculator, WTT Fuels, Carbon Fact
 */
exports.UPSTREAM_FUEL_ENERGY_EF = {
  // Upstream fuel emissions
  'diesel': 0.62874,
  'cng': 0.09487,
  'octane': 0.60283,
  'petrol': 0.60283,
  'gasoline': 0.60283,
  'natural_gas': 0.34593,
  'naturalgas': 0.34593,
  'ng': 0.34593,
  
  // Electricity-related
  'transmission_loss': 0.0188,  // per kWh
  't_d_loss': 0.0188,
  'td_loss': 0.0188,
  'upstream_electricity': 0.55  // per kWh
};

/**
 * SCOPE 3 - End-of-Life Treatment (kgCO₂e per kg)
 * Source: PDF Section 5.9
 * Reference: ScienceDirect - Textile Environmental Impact Assessment
 */
exports.EOL_EF = {
  'nylon': 1.85,
  'polyester': 2.1,
  'recycled_polyester': 1.65,
  'recycledpolyester': 1.65,
  'others': 2.0,
  'other': 2.0
};

/**
 * Get emission factor by name and scope
 */
exports.getEmissionFactor = (name, scope) => {
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (scope && exports.EMISSION_FACTORS[scope]) {
    const factor = exports.EMISSION_FACTORS[scope][normalizedName];
    if (factor) return factor;
  }
  
  // Search all scopes
  for (const scopeName in exports.EMISSION_FACTORS) {
    const factor = exports.EMISSION_FACTORS[scopeName][normalizedName];
    if (factor) return factor;
  }
  
  return null;
};

/**
 * Get material emission factor
 */
exports.getMaterialEF = (materialName) => {
  const normalized = materialName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  for (const [key, value] of Object.entries(exports.MATERIAL_EF)) {
    const keyNormalized = key.replace(/[^a-z0-9]/g, '');
    if (normalized.includes(keyNormalized)) {
      return { name: key, ef: value, unit: 'tCO₂e/tonne' };
    }
  }
  
  return { name: 'others', ef: exports.MATERIAL_EF['others'], unit: 'tCO₂e/tonne' };
};

/**
 * Calculate fabric weight from dimensions
 * Formula: Weight (kg) = (Length × Width × GSM) / 1,550,000
 * Then convert to tonnes
 */
exports.calculateFabricWeight = (lengthYard, widthInch, gsm) => {
  const weightKg = (lengthYard * widthInch * gsm) / 1550000;
  return weightKg / 1000; // Convert to tonnes
};

/**
 * Calculate material blend emission factor
 * Example: "50% Cotton 50% Polyester" → weighted average EF
 */
exports.calculateMaterialEF = (materialMix) => {
  const materials = [];
  const regex = /(\d+(?:\.\d+)?)%\s*([a-zA-Z\s]+?)(?=\d+%|$)/gi;
  let match;
  
  while ((match = regex.exec(materialMix)) !== null) {
    const percentage = parseFloat(match[1]);
    const material = match[2].trim().toLowerCase();
    materials.push({ percentage, material });
  }
  
  if (materials.length === 0) {
    return {
      success: false,
      error: 'Invalid material format. Use format like: 50% Cotton 50% Polyester'
    };
  }

  const totalPercentage = materials.reduce((sum, m) => sum + m.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.1) {
    return {
      success: false,
      error: `Material percentages must sum to 100%. Current: ${totalPercentage.toFixed(1)}%`
    };
  }

  let efSum = 0;
  let breakdown = [];
  
  materials.forEach((mat) => {
    const matEF = exports.MATERIAL_EF[mat.material] || exports.MATERIAL_EF['others'];
    const contribution = (mat.percentage / 100) * matEF;
    efSum += contribution;
    breakdown.push({
      material: mat.material,
      percentage: mat.percentage,
      ef: matEF,
      contribution
    });
  });

  return {
    success: true,
    ef: efSum,
    unit: 'tCO₂e/tonne',
    breakdown
  };
};

/**
 * GHG Protocols - Scope classifications
 */
exports.SCOPE_KEYWORDS = {
  scope1: [
    'diesel', 'petrol', 'gasoline', 'gas', 'naturalgas', 'ng', 'lpg',
    'coal', 'fueloil', 'gasboiler', 'gasgenerator', 'direct', 'combustion',
    'fuel', 'boiler', 'generator'
  ],
  scope2: [
    'electricity', 'reb', 'energy', 'grid', 'purchased', 'steam',
    'heating', 'cooling', 'heater', 'cooler', 'power', 'solar'
  ],
  scope3: [
    // Purchased goods & services
    'fabric', 'material', 'chemical', 'dyes', 'auxiliary', 'accessories',
    
    // Transportation
    'transport', 'distribution', 'vehicle', 'freight', 'shipping', 'logistics',
    
    // Waste
    'waste', 'metalwaste', 'electricwaste', 'foodwaste', 'ewaste', 'scrap',
    
    // Travel & commuting
    'travel', 'commute', 'flight', 'trip', 'business travel',
    
    // Other
    'upstream', 'downstream', 'lease', 'franchise', 'investment',
    'capital goods', 'end of life', 'eol'
  ]
};

/**
 * Scope 3 category mapping for automated classification
 */
exports.SCOPE3_CATEGORIES = {
  1: {
    name: 'Purchased Goods & Services',
    keywords: ['fabric', 'material', 'chemical', 'dyes', 'accessories'],
    ef_source: 'MATERIAL_EF, CHEMICAL_EF'
  },
  2: {
    name: 'Capital Goods',
    keywords: ['machinery', 'equipment', 'building', 'infrastructure'],
    ef_source: 'CAPITAL_GOODS_EF'
  },
  3: {
    name: 'Fuel & Energy Related Activities',
    keywords: ['upstream', 'transmission', 'distribution', 't&d loss'],
    ef_source: 'UPSTREAM_FUEL_ENERGY_EF'
  },
  4: {
    name: 'Upstream Transportation',
    keywords: ['inbound', 'supplier', 'incoming'],
    ef_source: 'TRANSPORT_EF'
  },
  5: {
    name: 'Waste Generated in Operations',
    keywords: ['waste', 'scrap', 'disposal'],
    ef_source: 'WASTE_EF'
  },
  6: {
    name: 'Business Travel',
    keywords: ['flight', 'trip', 'business travel', 'air travel'],
    ef_source: 'BUSINESS_TRAVEL_ROUTES'
  },
  7: {
    name: 'Employee Commuting',
    keywords: ['commute', 'employee transport', 'daily travel'],
    ef_source: 'COMMUTING_EF'
  },
  9: {
    name: 'Downstream Transportation',
    keywords: ['outbound', 'delivery', 'distribution to customer'],
    ef_source: 'TRANSPORT_EF'
  },
  12: {
    name: 'End-of-Life Treatment',
    keywords: ['eol', 'end of life', 'disposal', 'recycling'],
    ef_source: 'EOL_EF'
  }
};

/**
 * Validation helper
 */
exports.validateEmissionCalculation = (scope, value, unit) => {
  const warnings = [];
  
  if (scope === 1 && value > 10000) {
    warnings.push('Scope 1 emissions seem unusually high. Verify fuel consumption data.');
  }
  
  if (scope === 2 && value > 50000) {
    warnings.push('Scope 2 emissions seem unusually high. Verify electricity consumption data.');
  }
  
  if (unit && !['kg', 'tonne', 't', 'kWh', 'L', 'm³'].includes(unit)) {
    warnings.push(`Unusual unit detected: ${unit}. Verify unit conversion.`);
  }
  
  return { valid: warnings.length === 0, warnings };
};

/**
 * Unit conversion helpers
 */
exports.convertToTonnes = (value, currentUnit) => {
  const conversions = {
    'kg': 1000,
    'g': 1000000,
    'lb': 2204.62,
    't': 1,
    'ton': 1,
    'tonne': 1
  };
  
  const factor = conversions[currentUnit.toLowerCase()];
  return factor ? value / factor : value;
};

exports.convertToCO2e = (value, currentUnit) => {
  if (currentUnit.toLowerCase().includes('tco2e') || currentUnit.toLowerCase().includes('t co2e')) {
    return value;
  }
  if (currentUnit.toLowerCase().includes('kgco2e') || currentUnit.toLowerCase().includes('kg co2e')) {
    return value / 1000;
  }
  return value;
};