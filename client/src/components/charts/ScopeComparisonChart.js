// client/src/components/charts/ScopeComparisonChart.js
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ScopeComparisonChart = ({ scope1, scope2 }) => {
  const data = [
    {
      name: 'Emissions',
      'Scope 1': scope1 || 0,
      'Scope 2': scope2 || 0
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Scope 1 & 2 Emissions Comparison
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Direct and indirect emissions from purchased energy
      </p>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis 
            label={{ value: 't CO₂e', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value) => [`${value.toFixed(2)} t CO₂e`]}
          />
          <Legend />
          <Bar 
            dataKey="Scope 1" 
            fill="#EF4444" 
            radius={[8, 8, 0, 0]}
          />
          <Bar 
            dataKey="Scope 2" 
            fill="#3B82F6" 
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-red-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Scope 1 (Direct)</p>
          <p className="text-2xl font-bold text-red-600">{(scope1 || 0).toFixed(2)} t CO₂e</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Scope 2 (Indirect)</p>
          <p className="text-2xl font-bold text-blue-600">{(scope2 || 0).toFixed(2)} t CO₂e</p>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        💡 <strong>Scope 1:</strong> Direct emissions (fuel, gas)  |  <strong>Scope 2:</strong> Purchased electricity/energy
      </div>
    </div>
  );
};

export default ScopeComparisonChart;