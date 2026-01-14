// client/src/hooks/useWater.js
import { useState, useCallback } from 'react';
import api from '../services/api';

export const useWater = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getWaterFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/water/files');
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const processWaterFile = useCallback(async (fileId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(`/water/process/${fileId}`);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMetrics = useCallback(async (fileId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/water/metrics/${fileId}`);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportData = useCallback(async (fileId, format = 'csv') => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/water/export/${fileId}`, {
        params: { format }
      });
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getWaterFiles,
    processWaterFile,
    getMetrics,
    exportData
  };
};