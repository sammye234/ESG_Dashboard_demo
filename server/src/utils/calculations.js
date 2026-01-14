// server/src/utils/calculations.js
const { EMISSION_FACTORS, SCOPE_KEYWORDS } = require('./emissionFactors');

/**
 * Calculate total emissions by scope from CSV data
 */
exports.calculateEmissions = (data) => {
  let scope1Total = 0;
  let scope2Total = 0;
  let scope3Total = 0;

  data.forEach((row) => {
    Object.keys(row).forEach((key) => {
      const keyLower = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const value = parseFloat(row[key]) || 0;
      
      if (value === 0) return;
      
      // Check if column explicitly mentions scope
      if (keyLower.includes('ghgscope1') || keyLower.includes('scope1')) {
        scope1Total += value;
      }
      else if (keyLower.includes('ghgscope2') || keyLower.includes('scope2')) {
        scope2Total += value;
      }
      else if (keyLower.includes('ghgscope3') || keyLower.includes('scope3')) {
        scope3Total += value;
      }
      else {
        // Classify by keywords
        if (SCOPE_KEYWORDS.scope1.some(keyword => keyLower.includes(keyword))) {
          scope1Total += value;
        }
        else if (SCOPE_KEYWORDS.scope2.some(keyword => keyLower.includes(keyword))) {
          scope2Total += value;
        }
        else if (SCOPE_KEYWORDS.scope3.some(keyword => keyLower.includes(keyword))) {
          scope3Total += value;
        }
      }
    });
  });

  // Convert to tons
  const scope1Tons = scope1Total / 1000;
  const scope2Tons = scope2Total / 1000;
  const scope3Tons = scope3Total / 1000;
  const totalTons = scope1Tons + scope2Tons + scope3Tons;

  return {
    scope1: Math.round(scope1Total),
    scope2: Math.round(scope2Total),
    scope3: Math.round(scope3Total),
    scope1Tons: scope1Tons.toFixed(4),
    scope2Tons: scope2Tons.toFixed(4),
    scope3Tons: scope3Tons.toFixed(4),
    total: totalTons.toFixed(4)
  };
};

/**
 * Calculate carbon emissions using emission factors
 */
exports.calculateCarbonEmissions = (data) => {
  let scope1Carbon = 0;
  let scope2Carbon = 0;
  let scope3Carbon = 0;

  data.forEach((row) => {
    Object.keys(row).forEach((key) => {
      const keyLower = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const value = parseFloat(row[key]) || 0;
      
      if (value === 0) return;
      
      // SCOPE 1
      Object.keys(EMISSION_FACTORS.scope1).forEach(factor => {
        if (keyLower.includes(factor)) {
          const ef = EMISSION_FACTORS.scope1[factor].value;
          scope1Carbon += value * ef;
        }
      });
      
      // SCOPE 2
      Object.keys(EMISSION_FACTORS.scope2).forEach(factor => {
        if (keyLower.includes(factor)) {
          let ef = EMISSION_FACTORS.scope2[factor].value;
          let activityValue = value;
          
          // Convert MWh to kWh for electricity
          if ((factor === 'electricity' || factor === 'reb') && keyLower.includes('mwh')) {
            activityValue = value * 1000;
          }
          
          scope2Carbon += activityValue * ef;
        }
      });
      
      // SCOPE 3
      Object.keys(EMISSION_FACTORS.scope3).forEach(factor => {
        if (keyLower.includes(factor)) {
          const ef = EMISSION_FACTORS.scope3[factor].value;
          scope3Carbon += value * ef;
        }
      });
    });
  });

  // Convert to tons
  const scope1Tons = scope1Carbon / 1000;
  const scope2Tons = scope2Carbon / 1000;
  const scope3Tons = scope3Carbon / 1000;
  const totalTons = scope1Tons + scope2Tons + scope3Tons;

  return {
    scope1: scope1Tons.toFixed(4),
    scope2: scope2Tons.toFixed(4),
    scope3: scope3Tons.toFixed(4),
    total: totalTons.toFixed(4)
  };
};

/**
 * Calculate material emission factor
 */
exports.calculateMaterialEF = ({ materialMix, length, width, gsm }) => {
  // Parse material mix (e.g., "50%Cotton50%Nylon")
  const materials = [];
  const regex = /(\d+(?:\.\d+)?)%\s*([a-zA-Z\s]+)/gi;
  let match;
  
  while ((match = regex.exec(materialMix)) !== null) {
    const percentage = parseFloat(match[1]);
    const material = match[2].trim().toLowerCase();
    materials.push({ percentage, material });
  }
  
  if (materials.length === 0) {
    throw new Error('Invalid material format');
  }

  // Check if percentages sum to 100
  const totalPercentage = materials.reduce((sum, m) => sum + m.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 0.1) {
    throw new Error(`Material percentages must sum to 100%. Current: ${totalPercentage}%`);
  }

  // Calculate weight in tons
  const weightKg = (parseFloat(length) * parseFloat(width) * parseFloat(gsm)) / 1550000;
  const weightTon = weightKg / 1000;

  // Calculate EF
  const { MATERIAL_EF } = require('./emissionFactors');
  let efSum = 0;
  let breakdown = [];
  
  materials.forEach((mat) => {
    const matEF = MATERIAL_EF[mat.material] || MATERIAL_EF['others'];
    const contribution = (mat.percentage / 100) * matEF;
    efSum += contribution;
    breakdown.push({
      material: mat.material,
      percentage: mat.percentage,
      ef: matEF,
      contribution: contribution.toFixed(4)
    });
  });

  const totalEF = weightTon * efSum;

  return {
    weight: weightTon.toFixed(6),
    ef: totalEF.toFixed(4),
    breakdown
  };
};

/**
 * Calculate intensity metrics
 */
exports.calculateIntensity = (emissions, denominator, unit = 'per unit') => {
  if (!denominator || denominator === 0) {
    throw new Error('Denominator cannot be zero');
  }
  
  return {
    value: (emissions / denominator).toFixed(4),
    unit: `kg CO₂e ${unit}`
  };
};