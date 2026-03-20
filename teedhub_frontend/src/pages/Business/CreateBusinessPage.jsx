import { motion } from 'framer-motion';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateBusiness from '@/components/Business/CreateBusiness';

export default function CreateBusinessPage() {
  const navigate = useNavigate();

  return (
    <>
      {/* Background decorative elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#1F75FE] rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute -bottom-20 left-20 w-72 h-72 bg-[#f2a705] rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      {/* Main Content */}
      <section className="relative z-10 min-h-screen bg-white dark:bg-[#252526] py-8 sm:py-12 lg:py-16">
        <div className="px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/profile')}
            className="mb-8 flex items-center gap-2 text-[#1F75FE] dark:text-[#1F75FE] hover:text-blue-700 dark:hover:text-blue-400 transition duration-200 font-medium"
          >
            <ArrowLeft size={20} />
            <span>Back to Profile</span>
          </motion.button>

          {/* Header with Icon */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-start gap-4"
          >
            <div className="p-3 bg-gradient-to-br from-[#1F75FE]/20 to-[#f2a705]/20 rounded-xl">
              <Building2 size={32} className="text-[#1F75FE]" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#1E1E1E] dark:text-[#E8E8E8] mb-2">
                Create New Business
              </h1>
              <p className="text-[#666666] dark:text-[#A0A0A0] leading-relaxed">
                Set up your business profile and start managing your operations. You can customize all details later.
              </p>
            </div>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3A3A3A] rounded-2xl p-6 sm:p-8 shadow-lg dark:shadow-2xl"
          >
            <CreateBusiness />
          </motion.div>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {[
              { emoji: "⚡", title: "Quick Setup", desc: "Get started in minutes" },
              { emoji: "🔒", title: "Secure", desc: "Enterprise-grade security" },
              { emoji: "📈", title: "Scale Ready", desc: "Grow your business" },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="text-center p-4 bg-gradient-to-br from-[#1F75FE]/5 to-[#f2a705]/5 dark:from-[#1F75FE]/10 dark:to-[#f2a705]/10 rounded-xl border border-[#1F75FE]/20 dark:border-[#f2a705]/20"
              >
                <div className="text-3xl mb-2">{item.emoji}</div>
                <p className="font-semibold text-[#1E1E1E] dark:text-white text-sm">{item.title}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}