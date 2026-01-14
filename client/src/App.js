// client/src/App.js
import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import SignIn from './pages/SignIn';
import CreateAccount from './pages/CreateAccount';
import Dashboard from './pages/Dashboard';
import FileManagement from './pages/FileManagement';
import CSVEditor from './pages/CSVEditor';
import KPICalculator from './pages/KPICalculator';
import WaterDashboard from './pages/WaterDashboard';
import EnergyDashboard from './pages/EnergyDashboard';
import EmissionsDashboard from './pages/EmissionsDashboard';
import WasteDashboard from './pages/WasteDashboard';
import IntegratedESGDashboard from './pages/IntegratedESGDashboard';
import ESGDashboardLayout from './pages/ESGDashboardLayout';

// Main App Content (inside providers)
const AppContent = () => {
  const { isAuthenticated, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('landing');

  // ✅ NEW: Auto-redirect to landing when not authenticated
  useEffect(() => {
    if (!isAuthenticated && currentPage !== 'landing' && currentPage !== 'signin' && currentPage !== 'signup') {
      console.log('🔄 Not authenticated, redirecting to landing');
      setCurrentPage('landing');
    }
  }, [isAuthenticated, currentPage]);

  // ✅ NEW: Handle logout with navigation
  const handleLogout = () => {
    logout(setCurrentPage); // Pass navigation function to logout
  };

  const renderPage = () => {
    // Unauthenticated pages
    if (!isAuthenticated) {
      switch (currentPage) {
        case 'signin':
          return <SignIn onNavigate={setCurrentPage} />;
        case 'signup':
          return <CreateAccount onNavigate={setCurrentPage} />;
        default:
          return <LandingPage onNavigate={setCurrentPage} />;
        
      }
    }

    // Authenticated pages
    switch (currentPage) {
      case 'files':
        return <FileManagement onNavigate={setCurrentPage} onLogout={handleLogout} />;
      case 'csv-editor':
        return <CSVEditor onNavigate={setCurrentPage} onLogout={handleLogout} />;
      case 'kpi-calculator':
        return <KPICalculator onNavigate={setCurrentPage} onLogout={handleLogout} />;
      case 'dashboard':
      default:
        return <Dashboard onNavigate={setCurrentPage} onLogout={handleLogout} />;
      case 'integrated-esg-dashboard':
        return <IntegratedESGDashboard onBack={() => setCurrentPage('dashboard')} />;
      case 'water-dashboard':
        return <WaterDashboard onBack={() => setCurrentPage('dashboard')} />;
      case 'energy-dashboard':
        return <EnergyDashboard onBack={() => setCurrentPage('dashboard')} />;
      case 'emissions-dashboard':
        return <EmissionsDashboard onBack={() => setCurrentPage('dashboard')} />;
      case 'waste-dashboard':
        return <WasteDashboard onBack={() => setCurrentPage('dashboard')} />;
      case 'esg-dashboard-layout':
        return <ESGDashboardLayout onBack={() => setCurrentPage('dashboard')} />;
      
    }
  };

  return <div className="App">{renderPage()}</div>;
};

// Main App with Providers
function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;