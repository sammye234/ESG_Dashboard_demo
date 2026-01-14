// client/src/components/charts/ScopePieChart.js
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const ScopePieChart = ({ scope1, scope2, scope3 }) => {
  const data = [
    { name: 'Scope 1', value: scope1 || 0, color: '#EF4444' },
    { name: 'Scope 2', value: scope2 || 0, color: '#3B82F6' },
    { name: 'Scope 3', value: scope3 || 0, color: '#10B981' }
  ];

  const total = (scope1 || 0) + (scope2 || 0) + (scope3 || 0);

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="font-bold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Emissions by Scope
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Distribution of emissions across all three scopes
      </p>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value.toFixed(2)} t CO₂e`]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between p-2 bg-red-50 rounded">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm font-medium text-gray-700">Scope 1</span>
          </div>
          <span className="text-sm font-bold text-red-600">
            {(scope1 || 0).toFixed(2)} t CO₂e
          </span>
        </div>

        <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm font-medium text-gray-700">Scope 2</span>
          </div>
          <span className="text-sm font-bold text-blue-600">
            {(scope2 || 0).toFixed(2)} t CO₂e
          </span>
        </div>

        <div className="flex items-center justify-between p-2 bg-green-50 rounded">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm font-medium text-gray-700">Scope 3</span>
          </div>
          <span className="text-sm font-bold text-green-600">
            {(scope3 || 0).toFixed(2)} t CO₂e
          </span>
        </div>

        <div className="flex items-center justify-between p-2 bg-gray-100 rounded mt-3 border-t-2 border-gray-300">
          <span className="text-sm font-bold text-gray-700">Total Emissions</span>
          <span className="text-lg font-bold text-gray-800">
            {total.toFixed(2)} t CO₂e
          </span>
        </div>
      </div>
    </div>
  );
};

export default ScopePieChart;