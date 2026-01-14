// src/pages/FileManagement.js 
import React, { useState, useEffect } from 'react';
import { 
  Upload, FileText, Trash2, Eye, Download, X, 
  Search, Table, Droplets, Leaf, Zap, ChevronRight
} from 'lucide-react';
import { useFiles } from '../hooks/useFiles';
import { Header } from '../components/common';

const FileManagement = ({ onBack, onNavigate }) => {
  const {
    files,
    loading,
    uploadFile,
    deleteFile,
    downloadFile,
    getFileById,
    fetchFiles
  } = useFiles();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [viewingFile, setViewingFile] = useState(null);
  const [activeSheet, setActiveSheet] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);
  

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(fileExt)) {
      alert('❌ Please upload CSV or Excel files only');
      return;
    }

    setUploading(true);
    const result = await uploadFile(file);
    setUploading(false);

    if (result.success) {
      alert(`✅ File "${file.name}" uploaded successfully!`);
      event.target.value = '';
    } else {
      alert(`❌ Upload failed: ${result.error}`);
    }
  };

  const handleViewFile = async (fileId) => {
    try {
      const result = await getFileById(fileId);
      if (result.success) {
        setViewingFile(result.data);
        setActiveSheet(0);
      } else {
        alert(`❌ Failed to load file: ${result.error}`);
      }
    } catch (err) {
      alert('❌ Error viewing file');
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    const result = await deleteFile(fileId);
    if (result.success) {
      alert('✅ File deleted successfully');
    } else {
      alert(`❌ Delete failed: ${result.error}`);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    const result = await downloadFile(fileId, fileName);
    if (!result.success) {
      alert(`❌ Download failed: ${result.error}`);
    }
  };

  const detectFileType = (file) => {
    const name = file.originalName?.toLowerCase() || '';
    const headers = file.metadata?.headers || [];
    
    if (name.includes('water') || headers.some(h => h.toLowerCase().includes('water'))) {
      return { type: 'water', icon: Droplets, color: 'blue' };
    }
    if (name.includes('waste') || headers.some(h => h.toLowerCase().includes('waste'))) {
      return { type: 'waste', icon: Trash2, color: 'orange' };
    }
    if (name.includes('emission') || name.includes('ghg') || headers.some(h => h.toLowerCase().includes('scope'))) {
      return { type: 'emissions', icon: Leaf, color: 'green' };
    }
    if (name.includes('energy') || headers.some(h => h.toLowerCase().includes('energy'))) {
      return { type: 'energy', icon: Zap, color: 'yellow' };
    }
    return { type: 'general', icon: FileText, color: 'gray' };
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.originalName?.toLowerCase().includes(searchTerm.toLowerCase());
    const fileType = detectFileType(file).type;
    const matchesFilter = filterType === 'all' || fileType === filterType;
    return matchesSearch && matchesFilter;
  });

  const getCurrentSheetData = () => {
    if (!viewingFile) return { data: [], headers: [], name: 'Data' };
    
    if (viewingFile.sheets && viewingFile.sheets.length > 0) {
      const currentSheet = viewingFile.sheets[activeSheet];
      return {
        data: currentSheet?.data || [],
        headers: currentSheet?.headers || [],
        name: currentSheet?.name || `Sheet ${activeSheet + 1}`
      };
    }
    
    return {
      data: viewingFile.data || [],
      headers: viewingFile.metadata?.headers || [],
      name: 'Data'
    };
  };
  const handleBackToDashboard = () => {
    console.log('🔙 Going back to dashboard');
    if (onNavigate) {
      onNavigate('dashboard');
    } else if (onBack) {
      onBack();
    } else {
      console.error('❌ No navigation function available');
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
      <Header
        title="File Management"
        subtitle="Upload, view, and manage your ESG data files"
        showMenu={false}
        actions={[
          {
            label: 'Back to Dashboard',
            icon: X,
            className: 'px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2',
            onClick: handleBackToDashboard
          }
        ]}
      />

      <main className="p-6 max-w-7xl mx-auto">
        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Upload className="w-6 h-6 text-blue-500" />
                Upload New File
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Supported formats: CSV, XLSX, XLS
              </p>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <div className={`px-6 py-3 rounded-lg font-medium transition flex items-center gap-2 ${
                uploading 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}>
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Choose File
                  </>
                )}
              </div>
            </label>
          </div>

          {/* File Type Guide */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-700 font-medium mb-2">📋 File Naming Guidelines:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span><strong>Water:</strong> Include "water" in filename</span>
              </div>
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-orange-500" />
                <span><strong>Waste:</strong> Include "waste" in filename</span>
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4 text-green-500" />
                <span><strong>Emissions:</strong> Include "emission" or "ghg"</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span><strong>Energy:</strong> Include "energy" in filename</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">All Types</option>
              <option value="water">Water</option>
              <option value="waste">Waste</option>
              <option value="emissions">Emissions</option>
              <option value="energy">Energy</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>

        {/* Files List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading files...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">
              {searchTerm || filterType !== 'all' ? 'No files match your filters' : 'No files uploaded yet'}
            </p>
            <p className="text-gray-500 text-sm">
              Upload your first ESG data file to get started
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sheets
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rows
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFiles.map((file) => {
                    const fileType = detectFileType(file);
                    const Icon = fileType.icon;
                    
                    return (
                      <tr key={file._id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-${fileType.color}-100 text-${fileType.color}-700`}>
                            <Icon className="w-4 h-4" />
                            {fileType.type}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {file.originalName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {file.sheets?.length || file.metadata?.totalSheets || 1} sheet(s)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {file.data?.length || 0} rows
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewFile(file._id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="View"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDownload(file._id, file.originalName)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Download"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(file._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* File Viewer Modal */}
      {viewingFile && (() => {
        const currentSheet = getCurrentSheetData();
        const hasMultipleSheets = viewingFile.sheets && viewingFile.sheets.length > 1;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-blue-500" />
                    {viewingFile.originalName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentSheet.data?.length || 0} rows • {hasMultipleSheets ? `${viewingFile.sheets.length} sheets` : '1 sheet'}
                  </p>
                </div>
                <button
                  onClick={() => setViewingFile(null)}
                  className="p-2 hover:bg-white rounded-lg transition"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {hasMultipleSheets && (
                <div className="px-6 pt-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {viewingFile.sheets.map((sheet, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSheet(idx)}
                        className={`px-4 py-2 rounded-t-lg font-medium text-sm whitespace-nowrap transition flex items-center gap-2 ${
                          activeSheet === idx
                            ? 'bg-white text-blue-600 border-t-2 border-l border-r border-blue-500 shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Table className="w-4 h-4" />
                        {sheet.name}
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          {sheet.data?.length || 0} rows
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-auto p-6 bg-gray-50">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium flex items-center gap-2">
                      <Table className="w-4 h-4" />
                      {currentSheet.name}
                    </div>
                    <span className="text-sm text-gray-600">
                      {currentSheet.data?.length || 0} rows × {currentSheet.headers?.length || 0} columns
                    </span>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-auto shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-gradient-to-r from-blue-50 to-green-50 border-b-2 border-blue-200">
                      <tr>
                        {currentSheet.headers?.map((header, idx) => (
                          <th key={idx} className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentSheet.data?.slice(0, 20).map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-blue-50 transition">
                          {Object.values(row).map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-4 py-2 text-gray-600 whitespace-nowrap">
                              {cell !== null && cell !== undefined ? cell.toString() : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {currentSheet.data?.length > 20 && (
                  <p className="text-sm text-gray-500 mt-3 text-center bg-yellow-50 py-2 rounded-lg">
                    📊 Showing first 20 of {currentSheet.data.length} rows
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setViewingFile(null)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default FileManagement;