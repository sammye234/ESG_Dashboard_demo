// client/src/hooks/useWaste.js
import { useState, useCallback } from 'react';
import api from '../services/api';

export const useWaste = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getWasteFiles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/waste/files');
      return res.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const processWasteFile = useCallback(async (fileId) => {
    try {
      setLoading(true);
      const res = await api.post(`/waste/process/${fileId}`);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getMetrics = useCallback(async (fileId) => {
    try {
      setLoading(true);
      const res = await api.get(`/waste/metrics/${fileId}`);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, getWasteFiles, processWasteFile, getMetrics };
};