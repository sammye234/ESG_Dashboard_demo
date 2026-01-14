import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Factory, Zap, Truck, Users, Leaf, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const EmissionsDashboard = () => {
  // Sample data - replace with real data from CSV
  const [emissionsData, setEmissionsData] = useState({
    scope1: {
      total: 2456.78,
      trend: 5.2,
      breakdown: [
        { name: 'Diesel', value: 1200.50, percentage: 48.9 },
        { name: 'Natural Gas', value: 856.20, percentage: 34.8 },
        { name: 'Gas Generator', value: 400.08, percentage: 16.3 }
      ]
    },
    scope2: {
      total: 3890.45,
      trend: -2.8,
      breakdown: [
        { name: 'Electricity', value: 3200.30, percentage: 82.3 },
        { name: 'Steam', value: 490.15, percentage: 12.6 },
        { name: 'Cooling', value: 200.00, percentage: 5.1 }
      ]
    },
    scope3: {
      total: 15234.90,
      trend: 8.5,
      upstream: 13100.50,
      downstream: 2134.40,
      breakdown: [
        { name: 'Purchased Goods', value: 10500.00, percentage: 68.9 },
        { name: 'Transportation', value: 2000.50, percentage: 13.1 },
        { name: 'Employee Commute', value: 600.00, percentage: 3.9 },
        { name: 'Waste', value: 1500.00, percentage: 9.8 },
        { name: 'Others', value: 634.40, percentage: 4.2 }
      ]
    }
  });

  // Monthly trend data
  const monthlyData = [
    { month: 'Jan 2025', scope1: 2200, scope2: 3800, scope3: 14500, total: 20500 },
    { month: 'Feb 2025', scope1: 2350, scope2: 3750, scope3: 14800, total: 20900 },
    { month: 'Mar 2025', scope1: 2400, scope2: 3900, scope3: 15100, total: 21400 },
    { month: 'Apr 2025', scope1: 2300, scope2: 3850, scope3: 15000, total: 21150 },
    { month: 'May 2025', scope1: 2450, scope2: 3890, scope3: 15200, total: 21540 },
    { month: 'Jun 2025', scope1: 2456, scope2: 3890, scope3: 15235, total: 21581 }
  ];

  // Colors
  const COLORS = {
    scope1: '#EF4444', // Red
    scope2: '#F59E0B', // Orange
    scope3: '#10B981', // Green
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444'
  };

  const pieColors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4'];

  // KPI Card Component
  const KPICard = ({ title, value, unit, trend, color, icon: Icon, subtitle }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-end gap-2">
          <h2 className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</h2>
          <span className="text-sm text-gray-500 mb-1">{unit}</span>
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {trend > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-500 font-medium">+{trend}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500 font-medium">{trend}%</span>
              </>
            )}
            <span className="text-xs text-gray-500 ml-1">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );

  // Breakdown Table Component
  const BreakdownTable = ({ data, title, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <div className="w-1 h-6 rounded" style={{ backgroundColor: color }}></div>
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-semibold text-gray-700">Category</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">Emissions (t CO₂e)</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">Percentage</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">Contribution</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2 font-medium text-gray-800">{item.name}</td>
                <td className="py-3 px-2 text-right text-gray-900">{item.value.toLocaleString()}</td>
                <td className="py-3 px-2 text-right text-gray-600">{item.percentage.toFixed(1)}%</td>
                <td className="py-3 px-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ width: `${item.percentage}%`, backgroundColor: color }}
                      ></div>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const totalEmissions = emissionsData.scope1.total + emissionsData.scope2.total + emissionsData.scope3.total;
  const scope1Percent = (emissionsData.scope1.total / totalEmissions * 100).toFixed(1);
  const scope2Percent = (emissionsData.scope2.total / totalEmissions * 100).toFixed(1);
  const scope3Percent = (emissionsData.scope3.total / totalEmissions * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              Emissions Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Comprehensive GHG Protocol Scope 1, 2 & 3 Analysis</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="text-lg font-semibold text-gray-900">December 6, 2025</p>
          </div>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Emissions"
          value={totalEmissions.toFixed(2)}
          unit="t CO₂e"
          color="#3B82F6"
          icon={Activity}
          subtitle="All Scopes Combined"
        />
        <KPICard
          title="Scope 1 (Direct)"
          value={emissionsData.scope1.total.toFixed(2)}
          unit="t CO₂e"
          trend={emissionsData.scope1.trend}
          color={COLORS.scope1}
          icon={Factory}
          subtitle={`${scope1Percent}% of total`}
        />
        <KPICard
          title="Scope 2 (Energy)"
          value={emissionsData.scope2.total.toFixed(2)}
          unit="t CO₂e"
          trend={emissionsData.scope2.trend}
          color={COLORS.scope2}
          icon={Zap}
          subtitle={`${scope2Percent}% of total`}
        />
        <KPICard
          title="Scope 3 (Indirect)"
          value={emissionsData.scope3.total.toFixed(2)}
          unit="t CO₂e"
          trend={emissionsData.scope3.trend}
          color={COLORS.scope3}
          icon={Truck}
          subtitle={`${scope3Percent}% of total`}
        />
      </div>

      {/* Scope 3 Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-5 h-5 text-green-700" />
            <h3 className="text-lg font-bold text-green-900">Scope 3 - Upstream</h3>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-bold text-green-900">{emissionsData.scope3.upstream.toLocaleString()}</p>
            <p className="text-sm text-green-700 mt-1">t CO₂e • Purchased Goods, Transport, Commute</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg shadow-md p-6 border border-teal-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-teal-700" />
            <h3 className="text-lg font-bold text-teal-900">Scope 3 - Downstream</h3>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-bold text-teal-900">{emissionsData.scope3.downstream.toLocaleString()}</p>
            <p className="text-sm text-teal-700 mt-1">t CO₂e • Distribution, End-of-Life Treatment</p>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Emissions Trend (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorScope1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.scope1} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.scope1} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorScope2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.scope2} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.scope2} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorScope3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.scope3} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.scope3} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Area type="monotone" dataKey="scope1" name="Scope 1" stroke={COLORS.scope1} fillOpacity={1} fill="url(#colorScope1)" strokeWidth={2} />
              <Area type="monotone" dataKey="scope2" name="Scope 2" stroke={COLORS.scope2} fillOpacity={1} fill="url(#colorScope2)" strokeWidth={2} />
              <Area type="monotone" dataKey="scope3" name="Scope 3" stroke={COLORS.scope3} fillOpacity={1} fill="url(#colorScope3)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Scope Distribution Pie */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Emissions by Scope</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Scope 1', value: emissionsData.scope1.total },
                  { name: 'Scope 2', value: emissionsData.scope2.total },
                  { name: 'Scope 3', value: emissionsData.scope3.total }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill={COLORS.scope1} />
                <Cell fill={COLORS.scope2} />
                <Cell fill={COLORS.scope3} />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <BreakdownTable 
          data={emissionsData.scope1.breakdown} 
          title="Scope 1 Breakdown" 
          color={COLORS.scope1}
        />
        <BreakdownTable 
          data={emissionsData.scope2.breakdown} 
          title="Scope 2 Breakdown" 
          color={COLORS.scope2}
        />
        <BreakdownTable 
          data={emissionsData.scope3.breakdown} 
          title="Scope 3 Breakdown" 
          color={COLORS.scope3}
        />
      </div>

      {/* Scope 3 Detailed Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Scope 3 Category Breakdown</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={emissionsData.scope3.breakdown} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={150} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }}
            />
            <Bar dataKey="value" fill={COLORS.scope3} radius={[0, 8, 8, 0]}>
              {emissionsData.scope3.breakdown.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-blue-900 mb-2">GHG Protocol Standards</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Scope 1:</strong> Direct emissions from owned/controlled sources (fuel combustion, process emissions)</p>
              <p><strong>Scope 2:</strong> Indirect emissions from purchased electricity, steam, heating & cooling</p>
              <p><strong>Scope 3:</strong> All other indirect emissions in the value chain (upstream & downstream)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmissionsDashboard;