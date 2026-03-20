import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  TrendingUp,
  Users,
  Clock,
  ArrowUpRight,
  Calendar,
  Settings,
  Plus,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function BusinessOverview() {
  const navigate = useNavigate();
  const { business, membership } = useOutletContext();
  const { warning } = useToast();

  // Mock KPIs (in production, these would come from API)
  const kpis = [
    {
      id: 'sales',
      label: 'Total Sales',
      value: '0',
      change: '+0%',
      icon: ShoppingCart,
      color: 'from-blue-500 to-[#1F75FE]',
    },
    {
      id: 'revenue',
      label: 'Revenue',
      value: '$0',
      change: '+0%',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 'members',
      label: 'Team Members',
      value: '1',
      change: 'Owner',
      icon: Users,
      color: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'activity',
      label: 'Recent Activity',
      value: 'Just Started',
      change: 'Today',
      icon: Clock,
      color: 'from-orange-500 to-[#f2a705]',
    },
  ];

  // Quick Actions
  const quickActions = [
    {
      id: 'sale',
      label: 'Create Sale',
      icon: Plus,
      action: () => warning('Sales feature coming soon'),
    },
    {
      id: 'analytics',
      label: 'View Analytics',
      icon: TrendingUp,
      action: () => warning('Analytics coming soon'),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      action: () => warning('Settings coming soon'),
    },
  ];

  const handleQuickAction = (action) => {
    action();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto"
    >
      {/* Header Section */}
      <motion.div variants={childVariants} className="space-y-2">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#1E1E1E] dark:text-[#E8E8E8]">
          Welcome back 👋
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Here's what's happening with {business?.name} today
        </p>
      </motion.div>

      {/* KPIs Grid */}
      <motion.div variants={childVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 + 0.3 }}
              whileHover={{ y: -4 }}
              className="p-6 rounded-xl bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3A3A3A] shadow-sm hover:shadow-lg dark:hover:shadow-2xl transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`p-3 rounded-lg bg-gradient-to-br ${kpi.color} bg-opacity-10`}
                >
                  <Icon size={24} className={`text-${kpi.color.split('-')[1]}-600`} />
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                  <ArrowUpRight size={14} />
                  {kpi.change}
                </div>
              </div>

              <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                {kpi.label}
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-[#1E1E1E] dark:text-white">
                {kpi.value}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={childVariants} className="space-y-4">
        <h3 className="text-xl font-bold text-[#1E1E1E] dark:text-white">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 + 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickAction(action.action)}
                className="p-6 rounded-xl bg-white dark:bg-[#1E1E1E] border-2 border-gray-200 dark:border-[#3A3A3A] hover:border-[#1F75FE] dark:hover:border-[#1F75FE] transition-all shadow-sm hover:shadow-lg dark:hover:shadow-2xl text-left"
              >
                <Icon size={28} className="text-[#1F75FE] mb-3" />
                <p className="text-sm font-semibold text-[#1E1E1E] dark:text-white">
                  {action.label}
                </p>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Business Info Card */}
      <motion.div
        variants={childVariants}
        className="p-6 sm:p-8 rounded-xl bg-gradient-to-br from-[#1F75FE]/10 to-[#f2a705]/10 dark:from-[#1F75FE]/20 dark:to-[#f2a705]/20 border border-[#1F75FE]/30 dark:border-[#1F75FE]/50"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#1E1E1E] dark:text-white mb-2">
              Business Information
            </h3>
            <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <p>
                <span className="font-semibold">Name:</span> {business?.name}
              </p>
              <p>
                <span className="font-semibold">Type:</span> {business?.business_type}
              </p>
              <p>
                <span className="font-semibold">Slug:</span> {business?.slug}
              </p>
              <p>
                <span className="font-semibold">Your Role:</span>{' '}
                <span className="capitalize font-semibold text-[#1F75FE]">
                  {membership?.role}
                </span>
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-[#1F75FE] to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            Edit Business
          </motion.button>
        </div>
      </motion.div>

      {/* Coming Soon Section */}
      <motion.div
        variants={childVariants}
        className="p-6 sm:p-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
      >
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
          ✨ Coming Soon
        </h3>
        <p className="text-blue-800 dark:text-blue-200">
          Sales management, Analytics, Team members, and Social Portal features are being built.
          Check back soon!
        </p>
      </motion.div>
    </motion.div>
  );
}
