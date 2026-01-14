// client/src/components/common/SidebarMenu.js
import React from 'react';
import { 
  Home, Plus, Beaker, Calculator, TrendingUp, FolderOpen, BarChart3, Settings, HelpCircle, PlusSquare, Folder, Edit2, 
  Zap, MessageSquare, X, Leaf, Droplets, Trash2
} from 'lucide-react';



const SidebarMenu = ({ 
  isOpen, 
  onClose, 
  onNavigate, 
  onShowMaterialCalc, 
  onShowAddWidget 
}) => {
  const menuItems = [
    {
      icon: Home,
      label: 'Dashboard',
      onClick: () => {
        onNavigate('dashboard');
        onClose();
      }
    },
    {
      icon: PlusSquare,
      label: 'Add Widget',
      onClick: () => {
        if (onShowAddWidget) {
          onShowAddWidget();
        }
        onClose();
      }
    },

    {
      icon: Beaker,
      label: 'Material EF Calculator',
      onClick: () => {
        if (onShowMaterialCalc) {
          onShowMaterialCalc();
        }
        onClose();
      }
    },
    {
      icon: Calculator,
      label: 'KPI Calculator',
      onClick: () => {
        onNavigate('kpi-calculator');
        onClose();
      }
    },
    {
      icon: Droplets,
      label: 'Water Dashboard',
      onClick: () => {
        onNavigate('water-dashboard');
        onClose();
      }
    },
      
    { 
      id: 'profile', 
      label: 'Profile Settings', 
      icon: Edit2, 
      action: () => alert('Profile Settings - Coming Soon!') 
    },
    {
      icon: FolderOpen,
      label: 'File Management',
      onClick: () => {
        onNavigate('files');
        onClose();
      }
    },
    { 
      id: 'contact', 
      label: 'Contact Us', 
      icon: MessageSquare, 
      action: () => alert('Contact - Coming Soon!') 
    },
    {
      icon: Zap,
      label: 'Energy Dashboard',
      onClick: () => {
        onNavigate('energy-dashboard');
        onClose();
      }
     
    },
    {
      icon: TrendingUp,
      label: 'Emissions Dashboard',
      onClick: () => {
        onNavigate('emissions-dashboard');
        onClose();
      }
    },
   
    {
      icon: Trash2,
      label: 'Waste Dashboard',
      onClick: () => {
        onNavigate('waste-dashboard');
        onClose();
      }
    },
    {
      icon: BarChart3,
      label: 'Custom Charts',
      onClick: () => {
        onNavigate('custom-charts');
        onClose();
      }
    },
    {
      icon: Settings,
      label: 'Settings',
      onClick: () => {
        alert('Settings coming soon!');
        onClose();
      }
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      onClick: () => {
        alert('Help documentation coming soon!');
        onClose();
      }
    }

  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">ESG Dashboard</h2>
              <p className="text-xs text-gray-500">Environmental Metrics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 overflow-y-auto h-[calc(100vh-88px)]">
          <div className="space-y-1">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={item.onClick} // ✅ Fixed: Use onClick instead of action
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-all group"
                >
                  <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="px-4 py-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800 font-medium mb-1">
                💡 Quick Tip
              </p>
              <p className="text-xs text-blue-600">
                Upload CSV/Excel files to automatically calculate and visualize your ESG metrics.
              </p>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
};

export default SidebarMenu;