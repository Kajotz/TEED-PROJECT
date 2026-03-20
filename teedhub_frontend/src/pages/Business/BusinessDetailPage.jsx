import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, Loader } from 'lucide-react';
import { API_BASE_URL } from '@/utils/constants';
import { apiGet } from '@/utils/api';

export default function BusinessDetailPage() {
  const { businessId } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBusinessDetail();
  }, [businessId]);

  const fetchBusinessDetail = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await apiGet(`${API_BASE_URL}/businesses/${businessId}/`);

      if (!response.ok) {
        throw new Error('Failed to fetch business details');
      }

      const data = await response.json();
      setBusiness(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching business:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#252526]">
        <Loader size={48} className="animate-spin text-[#1F75FE]" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#252526]">
        <div className="text-center">
          <Building2 size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || 'Business not found'}
          </p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-3 bg-[#1F75FE] text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#1F75FE] rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      {/* Content */}
      <section className="relative z-10 min-h-screen bg-white dark:bg-[#252526] py-8 sm:py-12 lg:py-16">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/profile')}
            className="mb-6 flex items-center gap-2 text-[#1F75FE] hover:text-blue-700 transition duration-200"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Profile</span>
          </motion.button>

          {/* Business Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1E1E1E] dark:text-[#D4D4D4] mb-2">
              {business.name}
            </h1>
            <p className="text-[#4A4A4A] dark:text-[#A0A0A0]">
              {business.business_type || 'Business'} • Created {new Date(business.created_at).toLocaleDateString()}
            </p>
          </motion.div>

          {/* Business Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3A3A3A] rounded-2xl p-6 sm:p-8 shadow-lg dark:shadow-2xl"
          >
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#1E1E1E] dark:text-[#D4D4D4] mb-4">
                  Business Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[#4A4A4A] dark:text-[#A0A0A0] mb-1">Business Name</p>
                    <p className="font-semibold text-[#1E1E1E] dark:text-[#D4D4D4]">{business.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#4A4A4A] dark:text-[#A0A0A0] mb-1">Business Type</p>
                    <p className="font-semibold text-[#1E1E1E] dark:text-[#D4D4D4] capitalize">
                      {business.business_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[#4A4A4A] dark:text-[#A0A0A0] mb-1">Slug</p>
                    <p className="font-semibold text-[#1E1E1E] dark:text-[#D4D4D4]">{business.slug}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#4A4A4A] dark:text-[#A0A0A0] mb-1">Status</p>
                    <p className="font-semibold text-[#1E1E1E] dark:text-[#D4D4D4]">
                      {business.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}