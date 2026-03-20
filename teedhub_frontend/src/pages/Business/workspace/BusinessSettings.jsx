import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { apiGet, apiPost } from '@/utils/api';
import { API_BASE_URL } from '@/utils/constants';

export default function BusinessSettings() {
  const navigate = useNavigate();
  const { business, membership } = useOutletContext();
  const { success, error: errorToast, warning } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    logo: null,
    primary_color: '#1F75FE',
    secondary_color: '#f2a705',
    about: '',
    contact_email: '',
    contact_phone: '',
    website: '',
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load existing profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await apiGet(`${API_BASE_URL}/businesses/${business.id}/profile/`);
        
        if (response.ok) {
          const profile = await response.json();
          setFormData({
            logo: null,
            primary_color: profile.primary_color || '#1F75FE',
            secondary_color: profile.secondary_color || '#f2a705',
            about: profile.about || '',
            contact_email: profile.contact_email || '',
            contact_phone: profile.contact_phone || '',
            website: profile.website || '',
          });

          if (profile.logo) {
            setLogoPreview(profile.logo);
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (business?.id) {
      loadProfile();
    }
  }, [business?.id]);

  // Check permissions
  if (membership?.role && !['owner', 'admin'].includes(membership.role)) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-4xl mx-auto bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" size={24} />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-200">Permission Denied</h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                Only owner and admin members can customize business settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file upload
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        errorToast('Invalid file format. Please use PNG, JPG, GIF, or WebP.');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        errorToast('File size must be less than 5MB.');
        return;
      }

      setFormData(prev => ({
        ...prev,
        logo: file,
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate hex colors
      const isValidHex = (color) => /^#[0-9A-F]{6}$/i.test(color);

      if (!isValidHex(formData.primary_color)) {
        errorToast('Invalid primary color format. Use hex color (e.g., #1F75FE).');
        setSubmitting(false);
        return;
      }

      if (!isValidHex(formData.secondary_color)) {
        errorToast('Invalid secondary color format. Use hex color (e.g., #f2a705).');
        setSubmitting(false);
        return;
      }

      // Create FormData for file upload
      const submitData = new FormData();
      
      if (formData.logo) {
        submitData.append('logo', formData.logo);
      }
      
      submitData.append('primary_color', formData.primary_color);
      submitData.append('secondary_color', formData.secondary_color);
      submitData.append('about', formData.about);
      submitData.append('contact_email', formData.contact_email);
      submitData.append('contact_phone', formData.contact_phone);
      submitData.append('website', formData.website);

      const response = await fetch(
        `${API_BASE_URL}/businesses/${business.id}/profile/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: submitData,
        }
      );

      if (response.ok) {
        success('Business settings updated successfully!');
        setTimeout(() => {
          navigate(`/business/${business.id}/overview`);
        }, 1500);
      } else {
        const errorData = await response.json();
        errorToast(errorData.error || 'Failed to update settings.');
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      errorToast('An error occurred while saving. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#1F75FE]/20 border-t-[#1F75FE] rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-[#3A3A3A] p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Logo</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Upload your business logo (PNG, JPG, GIF, WebP - Max 5MB)
              </p>

              <div className="flex items-center gap-6">
                {logoPreview ? (
                  <div className="flex-shrink-0">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-24 w-24 object-cover rounded-lg border border-gray-200 dark:border-[#3A3A3A]"
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 h-24 w-24 bg-gray-100 dark:bg-[#252526] rounded-lg border border-gray-200 dark:border-[#3A3A3A] flex items-center justify-center">
                    <Settings size={32} className="text-gray-300" />
                  </div>
                )}

                <div>
                  <label className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#1F75FE] to-[#f2a705] text-white font-semibold rounded-lg cursor-pointer hover:shadow-lg transition-all">
                    <Upload size={18} className="mr-2" />
                    Upload Logo
                  </label>
                  <input
                    type="file"
                    onChange={handleLogoChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
            </motion.div>

            {/* Brand Colors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-[#3A3A3A] p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Brand Colors</h2>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Primary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      name="primary_color"
                      value={formData.primary_color}
                      onChange={handleInputChange}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primary_color}
                      onChange={handleInputChange}
                      name="primary_color"
                      className="px-4 py-2 border border-gray-300 dark:border-[#3A3A3A] rounded-lg dark:bg-[#252526] dark:text-white font-mono text-sm flex-1"
                      placeholder="#1F75FE"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Used for buttons, text, and primary accents
                  </p>
                </div>

                {/* Secondary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      name="secondary_color"
                      value={formData.secondary_color}
                      onChange={handleInputChange}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.secondary_color}
                      onChange={handleInputChange}
                      name="secondary_color"
                      className="px-4 py-2 border border-gray-300 dark:border-[#3A3A3A] rounded-lg dark:bg-[#252526] dark:text-white font-mono text-sm flex-1"
                      placeholder="#f2a705"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Used for highlights and secondary actions
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Business Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-[#3A3A3A] p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Business Information</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    About
                  </label>
                  <textarea
                    name="about"
                    value={formData.about}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-[#3A3A3A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F75FE] dark:bg-[#252526] dark:text-white"
                    placeholder="Tell customers about your business..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      name="contact_email"
                      value={formData.contact_email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-[#3A3A3A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F75FE] dark:bg-[#252526] dark:text-white"
                      placeholder="business@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="contact_phone"
                      value={formData.contact_phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-[#3A3A3A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F75FE] dark:bg-[#252526] dark:text-white"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-[#3A3A3A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1F75FE] dark:bg-[#252526] dark:text-white"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </motion.div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6">
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-gradient-to-r from-[#1F75FE] to-[#f2a705] text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </motion.button>

              <motion.button
                type="button"
                onClick={() => navigate(`/business/${business.id}/overview`)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-gray-100 dark:bg-[#252526] text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-[#353535] transition-colors"
              >
                Cancel
              </motion.button>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="sticky top-8 h-fit bg-white dark:bg-[#1E1E1E] rounded-lg border border-gray-200 dark:border-[#3A3A3A] p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Live Preview</h2>

          <div className="space-y-6">
            {/* Header Preview */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-3">
                Workspace Header
              </p>
              <div className="bg-gray-50 dark:bg-[#252526] rounded-lg p-4 border border-gray-200 dark:border-[#3A3A3A] flex items-center justify-between">
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="h-10 w-10 object-cover rounded"
                  />
                )}
                <button
                  type="button"
                  style={{ backgroundColor: formData.primary_color }}
                  className="px-3 py-1 text-white text-sm rounded font-semibold transition-all"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Color Swatches */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-3">
                Brand Colors
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-[#3A3A3A]"
                    style={{ backgroundColor: formData.primary_color }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Primary
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.primary_color}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-gray-200 dark:border-[#3A3A3A]"
                    style={{ backgroundColor: formData.secondary_color }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Secondary
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.secondary_color}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Button Preview */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-3">
                Button Examples
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  style={{ backgroundColor: formData.primary_color }}
                  className="w-full text-white py-2 rounded-lg font-semibold text-sm transition-all"
                >
                  Primary Button
                </button>
                <button
                  type="button"
                  style={{ backgroundColor: formData.secondary_color }}
                  className="w-full text-white py-2 rounded-lg font-semibold text-sm transition-all"
                >
                  Secondary Button
                </button>
              </div>
            </div>

            {/* Gradient Preview */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-3">
                Gradient Example
              </p>
              <div
                className="h-24 rounded-lg border border-gray-200 dark:border-[#3A3A3A]"
                style={{
                  background: `linear-gradient(135deg, ${formData.primary_color} 0%, ${formData.secondary_color} 100%)`,
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
