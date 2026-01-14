// client/src/pages/CSVEditor.js - COMPLETE UPDATE
import React, { useState, useEffect } from 'react';
import { 
  Home, Save, X, Download, Plus, Trash2, 
  Edit2, Check, FileText, Table 
} from 'lucide-react';
import { useFiles } from '../hooks/useFiles';
import { Header } from '../components/common';
import { parseFile } from '../utils/fileParser';
import api from '../services/api';

const CSVEditor = ({ fileId, onBack }) => {
  const { getFileById, renameFile } = useFiles();
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [sheets, setSheets] = useState([]);
  const [fileName, setFileName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    loadFile();
  }, [fileId]);

  const loadFile = async () => {
    try {
      setLoading(true);
      
      // Get file info from database
      const fileResponse = await getFileById(fileId);
      
      if (!fileResponse.success) {
        alert('File not found');
        onBack();
        return;
      }

      const fileInfo = fileResponse.data;
      setFile(fileInfo);
      setFileName(fileInfo.name || fileInfo.originalName);

      // Download and parse the actual file
      const downloadResponse = await api.get(`/files/download/${fileId}`, {
        responseType: 'blob'
      });

      const blob = downloadResponse.data;
      const fileObj = new File([blob], fileInfo.originalName, { 
        type: fileInfo.mimeType 
      });

      // Parse file to get data
      const parsedData = await parseFile(fileObj);
      
      console.log('✅ File loaded:', parsedData);

      // Handle multi-sheet files
      if (parsedData.sheetNames && parsedData.sheetNames.length > 1) {
        setSheets(parsedData.sheetNames);
        setSelectedSheet(0);
        loadSheetData(parsedData.sheets[parsedData.sheetNames[0]]);
      } else {
        setSheets([fileInfo.originalName]);
        loadSheetData(parsedData.defaultSheet || parsedData.sheets[parsedData.sheetNames[0]]);
      }

    } catch (error) {
      console.error('❌ Error loading file:', error);
      alert('Failed to load file');
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const loadSheetData = (sheetData) => {
    if (!sheetData || sheetData.length === 0) {
      setHeaders([]);
      setData([]);
      return;
    }

    const cols = Object.keys(sheetData[0]);
    setHeaders(cols);
    setData(sheetData);
  };

  const handleSheetChange = (index) => {
    setSelectedSheet(index);
    // In a full implementation, you'd reload the sheet data here
    // For now, we just change the selected sheet
  };

  const handleCellEdit = (rowIndex, colIndex) => {
    setEditingCell({ row: rowIndex, col: colIndex });
    setTempValue(data[rowIndex][headers[colIndex]] || '');
  };

  const handleCellSave = () => {
    if (editingCell) {
      const newData = [...data];
      newData[editingCell.row][headers[editingCell.col]] = tempValue;
      setData(newData);
      setEditingCell(null);
      setTempValue('');
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setTempValue('');
  };

  const handleAddRow = () => {
    const newRow = {};
    headers.forEach(header => {
      newRow[header] = '';
    });
    setData([...data, newRow]);
  };

  const handleDeleteRow = (rowIndex) => {
    if (window.confirm('Delete this row?')) {
      const newData = data.filter((_, index) => index !== rowIndex);
      setData(newData);
    }
  };

  const handleAddColumn = () => {
    const newColName = prompt('Enter column name:');
    if (!newColName) return;

    setHeaders([...headers, newColName]);
    const newData = data.map(row => ({
      ...row,
      [newColName]: ''
    }));
    setData(newData);
  };

  const handleDeleteColumn = (colIndex) => {
    if (window.confirm(`Delete column "${headers[colIndex]}"?`)) {
      const colToDelete = headers[colIndex];
      const newHeaders = headers.filter((_, index) => index !== colIndex);
      const newData = data.map(row => {
        const { [colToDelete]: _, ...rest } = row;
        return rest;
      });
      setHeaders(newHeaders);
      setData(newData);
    }
  };

  const handleSave = async () => {
    try {
      // Convert data back to CSV/Excel format
      const response = await api.put(`/files/${fileId}`, {
        data: data,
        headers: headers
      });

      if (response.data.success) {
        alert('✅ File saved successfully!');
      } else {
        alert('❌ Failed to save file');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Error saving file');
    }
  };

  const handleDownload = () => {
    // Convert data to CSV
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => row[h] || '').join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRename = async () => {
    if (!fileName.trim()) {
      alert('File name cannot be empty');
      return;
    }

    const result = await renameFile(fileId, fileName);
    if (result.success) {
      setIsEditingName(false);
      alert('✅ File renamed successfully!');
    } else {
      alert('❌ Failed to rename file');
    }
  };

  const headerActions = [
    {
      label: 'Save',
      icon: Save,
      className: 'px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2',
      onClick: handleSave
    },
    {
      label: 'Download',
      icon: Download,
      className: 'px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2',
      onClick: handleDownload
    },
    {
      label: 'Back',
      icon: Home,
      className: 'px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2',
      onClick: onBack
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="CSV/Excel Editor"
        subtitle={
          isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleRename()}
              />
              <button onClick={handleRename} className="text-green-600 hover:text-green-700">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setIsEditingName(false)} className="text-red-600 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{fileName}</span>
              <button onClick={() => setIsEditingName(true)} className="text-gray-500 hover:text-gray-700">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )
        }
        showMenu={false}
        actions={headerActions}
      />

      <main className="p-4">
        {/* Sheet Tabs (for Excel files with multiple sheets) */}
        {sheets.length > 1 && (
          <div className="bg-white rounded-lg shadow mb-4 p-2 flex gap-2 overflow-x-auto">
            {sheets.map((sheet, index) => (
              <button
                key={index}
                onClick={() => handleSheetChange(index)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectedSheet === index
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Table className="w-4 h-4 inline mr-2" />
                {sheet}
              </button>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow mb-4 p-4 flex gap-2 flex-wrap">
          <button
            onClick={handleAddRow}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Row
          </button>
          <button
            onClick={handleAddColumn}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Column
          </button>
          <div className="ml-auto text-sm text-gray-600 flex items-center gap-4">
            <span>Rows: {data.length}</span>
            <span>Columns: {headers.length}</span>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 w-12">#</th>
                  {headers.map((header, colIndex) => (
                    <th key={colIndex} className="px-4 py-3 text-left font-semibold text-gray-700 min-w-[150px] relative group">
                      <div className="flex items-center justify-between">
                        <span>{header}</span>
                        <button
                          onClick={() => handleDeleteColumn(colIndex)}
                          className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700 ml-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-500 font-medium">{rowIndex + 1}</td>
                    {headers.map((header, colIndex) => (
                      <td key={colIndex} className="px-4 py-2">
                        {editingCell && editingCell.row === rowIndex && editingCell.col === colIndex ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleCellSave()}
                              className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <button onClick={handleCellSave} className="text-green-600 hover:text-green-700">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={handleCellCancel} className="text-red-600 hover:text-red-700">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleCellEdit(rowIndex, colIndex)}
                            className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded min-h-[2rem]"
                          >
                            {row[header] || <span className="text-gray-400">Empty</span>}
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleDeleteRow(rowIndex)}
                        className="text-red-500 hover:text-red-700 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {data.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow mt-4">
            <Table className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No data available</p>
            <button
              onClick={handleAddRow}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Add First Row
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <p className="font-semibold mb-2">💡 Tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Click any cell to edit its value</li>
            <li>Press Enter to save changes</li>
            <li>Add/delete rows and columns as needed</li>
            <li>Don't forget to click "Save" to persist your changes</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default CSVEditor;