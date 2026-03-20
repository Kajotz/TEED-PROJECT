import { useState, useEffect } from 'react';
import { useParams, useNavigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Menu,
  X,
  BarChart3,
  ShoppingCart,
  TrendingUp,
  Users,
  Settings,
  Share2,
  LogOut,
  ChevronDown,
  Home,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { apiGet } from '@/utils/api';
import { API_BASE_URL } from '@/utils/constants';

export default function BusinessWorkspace() {
  const navigate = useNavigate();
  const { businessId } = useParams();
  const { success, error, warning } = useToast();

  // State Management
  const [business, setBusiness] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Fetch Business & Membership on Mount
  useEffect(() => {
    const fetchBusinessContext = async () => {
      setLoading(true);
      try {
        const response = await apiGet(`${API_BASE_URL}/businesses/${businessId}/`);

        if (!response.ok) {
          if (response.status === 403) {
            error('You do not have access to this business');
            navigate('/profile');
          } else if (response.status === 404) {
            error('Business not found');
            navigate('/profile');
          } else {
            throw new Error(`Failed to load business (${response.status})`);
          }
          return;
        }

        const data = await response.json();
        setBusiness(data.business);
        setMembership(data.membership);

        if (data.debug) {
          console.debug('Business Context:', data.debug);
        }
      } catch (err) {
        console.error('Error loading business:', err);
        error('Failed to load business workspace');
        navigate('/profile');
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      fetchBusinessContext();
    }
  }, [businessId, navigate, error]);

  // Navigation Items
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Home,
      path: 'overview',
      available: true,
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: ShoppingCart,
      path: 'sales',
      available: false, // Not yet implemented
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      path: 'analytics',
      available: false, // Not yet implemented
    },
    {
      id: 'members',
      label: 'Members & Permissions',
      icon: Users,
      path: 'members',
      available: false, // Not yet implemented
      restricted: ['owner', 'admin'], // Only owner/admin can access
    },
    {
      id: 'customize',
      label: 'Customize',
      icon: Settings,
      path: 'customize',
      available: true, // Branding & customization
      restricted: ['owner', 'admin'],
    },
    {
      id: 'social',
      label: 'Social Portal',
      icon: Share2,
      path: 'social',
      available: false, // Not yet implemented
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: BarChart3,
      path: 'settings',
      available: false, // Not yet implemented
      restricted: ['owner', 'admin'],
    },
  ];

  // Check if item is accessible
  const isItemAccessible = (item) => {
    if (!item.available) return false;
    if (item.restricted && membership && !item.restricted.includes(membership.role)) {
      return false;
    }
    return true;
  };

  // Handle Navigation
  const handleNavigation = (item) => {
    if (!isItemAccessible(item)) {
      warning(`${item.label} is not yet available or you don't have access`);
      return;
    }
    setActiveSection(item.id);
    navigate(`/business/${businessId}/${item.path}`);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#252526] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#1F75FE]/20 border-t-[#1F75FE] rounded-full"
        />
      </div>
    );
  }

  // Not Authorized
  if (!business || !membership) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#252526] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Unable to load business workspace
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="mt-4 px-6 py-2 bg-[#1F75FE] text-white rounded-lg hover:bg-blue-700"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-[#252526]">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col border-r border-gray-200 dark:border-[#3A3A3A] overflow-hidden bg-white dark:bg-[#1E1E1E]"
      >
        <div className="flex-1 overflow-y-auto">
          {/* Business Header */}
          <div className="p-6 border-b border-gray-200 dark:border-[#3A3A3A]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <p className="text-xs font-semibold text-[#1F75FE] uppercase tracking-widest">
                Active Business
              </p>
              <h2 className="text-xl font-bold text-[#1E1E1E] dark:text-white truncate">
                {business.name}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {business.business_type}
              </p>
            </motion.div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const accessible = isItemAccessible(item);

              return (
                <motion.button
                  key={item.id}
                  whileHover={accessible ? { x: 4 } : {}}
                  whileTap={accessible ? { scale: 0.98 } : {}}
                  onClick={() => handleNavigation(item)}
                  disabled={!accessible}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all
                    ${isActive
                      ? 'bg-gradient-to-r from-[#1F75FE]/20 to-[#f2a705]/20 border-l-4 border-[#1F75FE]'
                      : 'hover:bg-gray-50 dark:hover:bg-[#252526]'
                    }
                    ${!accessible ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <Icon
                    size={20}
                    className={`${isActive ? 'text-[#1F75FE]' : 'text-gray-600 dark:text-gray-400'}`}
                  />
                  <span
                    className={`font-medium text-sm flex-1 ${
                      isActive
                        ? 'text-[#1F75FE] font-semibold'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {item.label}
                  </span>
                  {!accessible && <HelpCircle size={16} className="text-gray-400" />}
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-[#3A3A3A] space-y-2">
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252526] rounded-lg transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Switch Business</span>
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#3A3A3A] bg-white dark:bg-[#1E1E1E]">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-[#252526] rounded-lg"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <h1 className="text-2xl font-bold text-[#1E1E1E] dark:text-white">
              {navItems.find((i) => i.id === activeSection)?.label || 'Business Workspace'}
            </h1>
          </div>

          {/* User Menu */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#252526] rounded-lg flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-[#1F75FE] to-[#f2a705] rounded-full flex items-center justify-center text-white text-sm font-bold">
                {membership?.role?.charAt(0).toUpperCase()}
              </div>
              <ChevronDown size={18} className="text-gray-600 dark:text-gray-400" />
            </motion.button>

            {/* Dropdown */}
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1E1E1E] rounded-lg shadow-lg dark:shadow-2xl border border-gray-200 dark:border-[#3A3A3A] z-50"
              >
                <div className="p-4 border-b border-gray-200 dark:border-[#3A3A3A]">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Role
                  </p>
                  <p className="text-sm font-semibold text-[#1E1E1E] dark:text-white capitalize">
                    {membership?.role}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252526]"
                >
                  Switch Business
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    navigate('/login');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-[#252526]"
                >
                  Logout
                </button>
              </motion.div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-[#252526]">
          <Outlet context={{ business, membership }} />
        </main>
      </div>
    </div>
  );
}
