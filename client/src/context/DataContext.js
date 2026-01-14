
// client/src/context/DataContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from './AuthContext';

export const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  
  const [files, setFiles] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [csvData, setCsvData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    } else {
      setFiles([]);
      setWidgets([]);
      setKpis([]);
      setCsvData(null);
    }
  }, [isAuthenticated]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [filesRes, widgetsRes, kpisRes] = await Promise.all([
        api.get('/files'),
        api.get('/widgets'),
        api.get('/kpi')
      ]);
      
      setFiles(filesRes.data.files || filesRes.data || []);
      setWidgets(widgetsRes.data.widgets || widgetsRes.data || []);
      setKpis(kpisRes.data.kpis || kpisRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // File operations
  const createFile = async (fileData) => {
    try {
      const response = await api.post('/files', fileData);
      await fetchAllData();
      return { success: true, file: response.data.file };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to create file' };
    }
  };

  const updateFile = async (id, fileData) => {
    try {
      const response = await api.put(`/files/${id}`, fileData);
      await fetchAllData();
      return { success: true, file: response.data.file };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to update file' };
    }
  };

  const deleteFile = async (id) => {
    try {
      await api.delete(`/files/${id}`);
      await fetchAllData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to delete file' };
    }
  };

  const createFolder = async (folderData) => {
    try {
      const response = await api.post('/files/folder', folderData);
      await fetchAllData();
      return { success: true, folder: response.data.folder };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to create folder' };
    }
  };

  const uploadCSV = async (file, folderId = null) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (folderId) {
        formData.append('folderId', folderId);
      }

      const response = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await fetchAllData();
      return { success: true, file: response.data.file };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to upload file' };
    }
  };

  // Widget operations
  const createWidget = async (widgetData) => {
    try {
      const response = await api.post('/widgets', widgetData);
      await fetchAllData();
      return { success: true, widget: response.data.widget };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to create widget' };
    }
  };

  const updateWidget = async (id, widgetData) => {
    try {
      const response = await api.put(`/widgets/${id}`, widgetData);
      await fetchAllData();
      return { success: true, widget: response.data.widget };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to update widget' };
    }
  };

  const deleteWidget = async (id) => {
    try {
      await api.delete(`/widgets/${id}`);
      await fetchAllData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to delete widget' };
    }
  };

  const updateWidgetLayout = async (layout) => {
    try {
      const response = await api.put('/widgets/layout', { layout });
      await fetchAllData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to update layout' };
    }
  };

  // KPI operations
  const createKPI = async (kpiData) => {
    try {
      const response = await api.post('/kpi', kpiData);
      await fetchAllData();
      return { success: true, kpi: response.data.kpi };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to create KPI' };
    }
  };

  const deleteKPI = async (id) => {
    try {
      await api.delete(`/kpi/${id}`);
      await fetchAllData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to delete KPI' };
    }
  };

  const calculateKPI = async (formula, fileIds, customValues) => {
    try {
      const response = await api.post('/kpi/calculate', {
        formula,
        fileIds,
        customValues
      });
      return { success: true, result: response.data.result };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Calculation failed' };
    }
  };

  const value = {
    files,
    widgets,
    kpis,
    csvData,
    loading,
    error,
    createFile,
    updateFile,
    deleteFile,
    createFolder,
    uploadCSV,
    createWidget,
    updateWidget,
    deleteWidget,
    updateWidgetLayout,
    createKPI,
    deleteKPI,
    calculateKPI,
    refreshData: fetchAllData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
