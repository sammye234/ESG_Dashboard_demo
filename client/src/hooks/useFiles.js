// client/src/hooks/useFiles.js - COMPLETE UPDATE
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useFiles = () => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all files
  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📁 Fetching files...');
      const response = await api.get('/files');
      console.log('✅ Files response:', response.data);
      
      const fetchedFiles = response.data.files || [];
      
      // Separate files and folders
      const filesList = fetchedFiles.filter(f => f.type !== 'folder');
      const foldersList = fetchedFiles.filter(f => f.type === 'folder');
      
      console.log('📄 Files:', filesList.length);
      console.log('📁 Folders:', foldersList.length);
      
      setFiles(filesList);
      setFolders(foldersList);
      setAllFiles(fetchedFiles);
    } catch (err) {
      console.error('❌ Error fetching files:', err);
      const errorMsg = err.response?.data?.message || 'Failed to fetch files';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Create file (CSV in database)
  const createFile = async (fileData) => {
    try {
      console.log('📄 Creating file:', fileData);
      
      const response = await api.post('/files', fileData);
      
      console.log('✅ File created:', response.data);
      
      // Refresh file list
      await fetchFiles();
      
      return { 
        success: true, 
        data: response.data.data 
      };
    } catch (err) {
      console.error('❌ Create file error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create file';
      return { 
        success: false, 
        error: errorMsg 
      };
    }
  };

  // ✅ Create folder
  const createFolder = async (folderData) => {
    try {
      console.log('📁 Creating folder:', folderData);
      
      const response = await api.post('/files/folder', folderData);
      
      console.log('✅ Folder created:', response.data);
      
      // Refresh file list
      await fetchFiles();
      
      return { 
        success: true, 
        data: response.data.data 
      };
    } catch (err) {
      console.error('❌ Create folder error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create folder';
      return { 
        success: false, 
        error: errorMsg 
      };
    }
  };

  // Upload file (physical file)
  const uploadFile = async (file, metadata = {}) => {
    try {
      console.log('📤 Uploading file:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('✅ File uploaded successfully:', response.data);
      
      // Refresh file list
      await fetchFiles();
      
      return { 
        success: true, 
        data: response.data.file 
      };
    } catch (err) {
      console.error('❌ Upload error:', err);
      const errorMsg = err.response?.data?.message || 'Upload failed';
      return { 
        success: false, 
        error: errorMsg 
      };
    }
  };

  // Delete file
  const deleteFile = async (fileId) => {
    try {
      console.log('🗑️ Deleting file:', fileId);
      
      await api.delete(`/files/${fileId}`);
      
      console.log('✅ File deleted successfully');
      
      // Refresh file list
      await fetchFiles();
      
      return { success: true };
    } catch (err) {
      console.error('❌ Delete error:', err);
      const errorMsg = err.response?.data?.message || 'Delete failed';
      return { 
        success: false, 
        error: errorMsg 
      };
    }
  };

  // Download file
  const downloadFile = async (fileId, fileName) => {
    try {
      console.log('⬇️ Downloading file:', fileName);
      
      const response = await api.get(`/files/download/${fileId}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('✅ File downloaded successfully');
      
      return { success: true };
    } catch (err) {
      console.error('❌ Download error:', err);
      const errorMsg = err.response?.data?.message || 'Download failed';
      return { 
        success: false, 
        error: errorMsg 
      };
    }
  };

  // Rename file
  const renameFile = async (fileId, newName) => {
    try {
      console.log('✏️ Renaming file:', fileId, 'to', newName);
      
      const response = await api.put(`/files/${fileId}`, {
        name: newName
      });
      
      console.log('✅ File renamed successfully');
      
      // Refresh file list
      await fetchFiles();
      
      return { 
        success: true, 
        data: response.data 
      };
    } catch (err) {
      console.error('❌ Rename error:', err);
      const errorMsg = err.response?.data?.message || 'Rename failed';
      return { 
        success: false, 
        error: errorMsg 
      };
    }
  };

  // Get file by ID
  const getFileById = async (fileId) => {
    try {
      const response = await api.get(`/files/${fileId}`);
      return { 
        success: true, 
        data: response.data.data 
      };
    } catch (err) {
      console.error('❌ Get file error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to get file';
      return { 
        success: false, 
        error: errorMsg 
      };
    }
  };

  // Find item by ID (for compatibility)
  const findItem = (itemId) => {
    return allFiles.find(f => f._id === itemId || f.id === itemId);
  };

  // Fetch files on mount
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    files,
    folders,
    allFiles,
    loading,
    error,
    fetchFiles,
    createFile,      
    createFolder,    
    uploadFile,
    deleteFile,
    downloadFile,
    renameFile,
    getFileById,
    findItem         
  };
};

export default useFiles;