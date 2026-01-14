// client/src/components/charts/CustomChartBuilder.js - COMPLETE FIX
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { useFiles } from '../../hooks/useFiles';

const CustomChartBuilder = () => {
  const { allFiles, loading, fetchFiles } = useFiles();
  const [chartType, setChartType] = useState('bar');
  const [selectedFileId, setSelectedFileId] = useState('');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [chartData, setChartData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [csvData, setCsvData] = useState(null);

  // Refresh files on mount
  useEffect(() => {
    fetchFiles();
  }, []);

  // Filter: Only show files with valid parsed data
  const dataFiles = allFiles.filter(f => {
    const hasData = f.data && Array.isArray(f.data) && f.data.length > 0;
    const isNotFolder = f.type !== 'folder';
    
    if (hasData && isNotFolder) {
      console.log('✅ Valid file:', f.name, 'Rows:', f.data.length);
      return true;
    }
    return false;
  });

  console.log('📊 Total files:', allFiles.length, 'Valid data files:', dataFiles.length);

  // Load selected file data
  useEffect(() => {
    if (selectedFileId) {
      const file = dataFiles.find(f => (f._id || f.id) === selectedFileId);
      if (file && file.data) {
        console.log('📂 Loading file:', file.name);
        setCsvData(file.data);
        const cols = Object.keys(file.data[0] || {});
        setColumns(cols);
        console.log('📋 Columns:', cols);
      }
    } else {
      setCsvData(null);
      setColumns([]);
    }
  }, [selectedFileId, dataFiles]);

  const handleGenerateChart = () => {
    if (!csvData || csvData.length === 0) {
      alert('No data available in selected file');
      return;
    }

    if (!xAxis || !yAxis) {
      alert('Please select both X and Y axis columns');
      return;
    }

    console.log('📊 Generating chart:', { xAxis, yAxis, rows: csvData.length });

    const processedData = csvData
      .filter(row => row[xAxis] && row[yAxis]) // Filter valid rows
      .map(row => ({
        name: String(row[xAxis] || '').substring(0, 20), // Limit name length
        value: parseFloat(row[yAxis]) || 0
      }))
      .slice(0, 50); // Limit to 50 points for performance

    console.log('✅ Processed:', processedData.length, 'data points');
    setChartData(processedData);
  };

  const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <p className="text-lg mb-2">No chart generated yet</p>
          <p className="text-sm">Select file, axes, and click "Generate Chart"</p>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 }
    };

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="value" 
                fill="#3B82F6" 
                radius={[8, 8, 0, 0]}
                name={yAxis}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 4 }}
                name={yAxis}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  if (loading && allFiles.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading files...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-2">
        📊 Custom Chart Builder
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Create custom visualizations from your uploaded data files
      </p>

      {/* File Selection */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          1️⃣ Select Data File
        </label>
        <select
          value={selectedFileId}
          onChange={(e) => {
            setSelectedFileId(e.target.value);
            setXAxis('');
            setYAxis('');
            setChartData([]);
          }}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
        >
          <option value="">-- Choose a data file --</option>
          {dataFiles.map(file => (
            <option key={file._id || file.id} value={file._id || file.id}>
              📄 {file.name || file.originalName} • {file.data?.length || 0} rows • {file.metadata?.columns || 0} columns
            </option>
          ))}
        </select>
        
        {allFiles.length > 0 && dataFiles.length === 0 && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              ⚠️ <strong>No valid data files found.</strong> Your uploaded files may not have been parsed correctly. Try uploading a CSV or Excel file with data.
            </p>
          </div>
        )}
        
        {allFiles.length === 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>No files uploaded yet.</strong> Go to "File Management" and upload a CSV or Excel file first.
            </p>
          </div>
        )}
      </div>

      {/* Configuration Panel */}
      {selectedFileId && columns.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                2️⃣ Chart Type
              </label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="bar">📊 Bar Chart</option>
                <option value="line">📈 Line Chart</option>
                <option value="pie">🥧 Pie Chart</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                3️⃣ X-Axis (Labels)
              </label>
              <select
                value={xAxis}
                onChange={(e) => setXAxis(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Select column --</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                4️⃣ Y-Axis (Values)
              </label>
              <select
                value={yAxis}
                onChange={(e) => setYAxis(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Select column --</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleGenerateChart}
                disabled={!xAxis || !yAxis}
                className={`w-full px-4 py-2 rounded-lg font-semibold transition ${
                  xAxis && yAxis
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                🎨 Generate
              </button>
            </div>
          </div>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <strong>📋 Available columns:</strong> {columns.join(', ')}
          </div>
        </>
      )}

      {/* Chart Display */}
      <div className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white">
        {renderChart()}
      </div>

      {chartData.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          ✅ Chart generated successfully with <strong>{chartData.length}</strong> data points • X: <strong>{xAxis}</strong> • Y: <strong>{yAxis}</strong>
        </div>
      )}
    </div>
  );
};

export default CustomChartBuilder;