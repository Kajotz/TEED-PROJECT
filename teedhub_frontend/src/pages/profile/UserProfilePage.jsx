import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Globe,
  Camera,
  Save,
  X,
  Eye,
  EyeOff,
  Lock,
  Building2,
  LogOut,
  AlertCircle,
  CheckCircle,
  Upload,
  Plus,
} from 'lucide-react';

import { API_BASE_URL } from '@/utils/constants';
import { logout } from '@/utils/auth';
import { apiGet, apiPost, apiPatch } from '@/utils/api';
import Toast from '@/components/Toast';
import { useToast } from '@/hooks/useToast';

const BACKEND_ROOT = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

const COUNTRY_MAP = {
  TZ: "Tanzania",
  KE: "Kenya",
  UG: "Uganda",
  BI: "Burundi",
  RW: "Rwanda",
  CD: "DRC",
  ZM: "Zambia"
};

const COUNTRIES = [
  { code: 'TZ', name: 'Tanzania' },
  { code: 'KE', name: 'Kenya' },
  { code: 'UG', name: 'Uganda' },
  { code: 'BI', name: 'Burundi' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'CD', name: 'DRC' },
  { code: 'ZM', name: 'Zambia' },
];

export default function UserProfilePage() {
  const navigate = useNavigate();
  const { toasts, success, error: showError, removeToast } = useToast();
  
  // States
  const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'security', 'businesses'
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    username_display: '',
    phone_number: '',
    country: '',
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Password states
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Email change states
  const [emailData, setEmailData] = useState({
    new_email: '',
    password: '',
  });
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Recovery states (email, phone)
  const [recoveryData, setRecoveryData] = useState({
    recovery_email: '',
    recovery_mobile: '',
  });
  const [showRecoveryEmailForm, setShowRecoveryEmailForm] = useState(false);
  const [showRecoveryMobileForm, setShowRecoveryMobileForm] = useState(false);

  // Businesses
  const [businesses, setBusinesses] = useState([]);

  // Effects
  useEffect(() => {
    fetchUserProfile();
    fetchBusinesses();
  }, []);

  // API Functions
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.warn('No auth token found');
        window.location.href = '/login';
        return;
      }

      const resp = await apiGet(`${API_BASE_URL}/personal-info/get_personal_info/`);

      if (resp.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return;
      }

      if (!resp.ok) {
        throw new Error(`Profile API error: ${resp.status}`);
      }

      const personalInfo = await resp.json();

      const profileData = {
        id: personalInfo.id,
        username: personalInfo.username,
        user_email: personalInfo.user_email,
        username_display: personalInfo.username_display,
        phone_number: personalInfo.phone_number || '',
        country: personalInfo.country || '',
        profile_image: personalInfo.profile_image || null,
        recovery_email: personalInfo.recovery_email || '',
        recovery_mobile: personalInfo.recovery_mobile || '',
      };

      setProfile(profileData);
      setFormData({
        username_display: profileData.username_display,
        phone_number: profileData.phone_number,
        country: profileData.country,
      });

      if (profileData.profile_image) {
        const fullImageUrl = profileData.profile_image.startsWith('http')
          ? profileData.profile_image
          : `${BACKEND_ROOT}${profileData.profile_image}`;
        setPreviewImage(fullImageUrl);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(`Failed to load profile: ${err.message}`);
      setLoading(false);
    }
  };

  // Replace the fetchBusinesses function in UserProfilePage.jsx

  const fetchBusinesses = async () => {
   try {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Use the correct endpoint - note: no '/profile' prefix
    const resp = await apiGet(`${API_BASE_URL}/businesses/`);

    if (resp.ok) {
      const data = await resp.json();
      console.log('Businesses fetched:', data); // Debug log
      setBusinesses(Array.isArray(data) ? data : []);
    } else {
      console.error('Failed to fetch businesses:', resp.status);
    }
  } catch (err) {
    console.error('Failed to fetch businesses:', err);
  }
  };

  const handleImageChange = (e) => {
    
    
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (file.size > maxSize) {
      setError('Image must be less than 5MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, GIF, or WebP images are allowed');
      return;
    }

    setProfileImage(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target.result);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleSaveProfile = async () => {
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const submitData = new FormData();
      submitData.append('username_display', formData.username_display);
      submitData.append('phone_number', formData.phone_number || '');
      submitData.append('country', formData.country || '');

      if (profileImage) {
        submitData.append('profile_image', profileImage);
      }

      const resp = await fetch(`${API_BASE_URL}/personal-info/update_personal_info/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: submitData,
      });

      console.log('Update response status:', resp.status); // DEBUG

      if (!resp.ok) {
        const errData = await resp.json();
        console.error('Update error:', errData); // DEBUG
        throw new Error(errData.detail || 'Failed to update profile');
      }

      const updatedData = await resp.json();
      
      console.log('Update response:', updatedData); // DEBUG

      // Extract the data from the response (response has { message, data: {...} })
      const profileData = updatedData.data || updatedData;
      
      console.log('Profile data after extraction:', profileData); // DEBUG
      console.log('Profile image from response:', profileData.profile_image); // DEBUG

      if (profileData.profile_image) {
        const fullImageUrl = profileData.profile_image.startsWith('http')
          ? profileData.profile_image
          : `${BACKEND_ROOT}${profileData.profile_image}`;
        console.log('Full image URL:', fullImageUrl); // DEBUG
        setPreviewImage(fullImageUrl);
        setProfile((prev) => ({ ...prev, profile_image: fullImageUrl }));
      }

      success('Profile updated successfully!');
      setIsEditing(false);
      setProfileImage(null);

      setTimeout(() => {
        fetchUserProfile();
      }, 500);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(null);

    if (passwordData.new_password !== passwordData.confirm_password) {
      showError('Passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      showError('Password must be at least 8 characters');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        showError('Not authenticated');
        return;
      }

      const resp = await fetch(`${BACKEND_ROOT}/dj-rest-auth/password/change/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: passwordData.old_password,
          new_password1: passwordData.new_password,
          new_password2: passwordData.confirm_password,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.old_password?.[0] || errData.detail || 'Password change failed');
      }

      success('Password changed successfully!');
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
      setShowPasswordForm(false);
    } catch (err) {
      showError(err.message || 'Failed to change password');
    }
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        showError('Not authenticated');
        return;
      }

      const resp = await fetch(`${API_BASE_URL}/personal-info/update_email/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          new_email: emailData.new_email,
          password: emailData.password,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.detail || 'Email update failed');
      }

      success('Email updated successfully!');
      setEmailData({ new_email: '', password: '' });
      setShowEmailForm(false);
      setTimeout(() => {
        fetchUserProfile();
      }, 500);
    } catch (err) {
      showError(err.message || 'Failed to update email');
    }
  };

  const handleUpdateRecoveryInfo = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        showError('Not authenticated');
        return;
      }

      const payload = {};
      if (recoveryData.recovery_email) {
        payload.recovery_email = recoveryData.recovery_email;
      }
      if (recoveryData.recovery_mobile) {
        payload.recovery_mobile = recoveryData.recovery_mobile;
      }

      if (Object.keys(payload).length === 0) {
        showError('Please enter at least one recovery option');
        return;
      }

      const resp = await fetch(`${API_BASE_URL}/personal-info/update_recovery_info/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || 'Recovery info update failed');
      }

      // Update profile state immediately (real-time update)
      setProfile(prev => ({
        ...prev,
        recovery_email: recoveryData.recovery_email || prev.recovery_email,
        recovery_mobile: recoveryData.recovery_mobile || prev.recovery_mobile,
      }));

      // Show success toast
      success('Recovery information updated successfully!');
      
      // Clear form fields immediately
      setRecoveryData({ recovery_email: '', recovery_mobile: '' });
      setShowRecoveryEmailForm(false);
      setShowRecoveryMobileForm(false);
    } catch (err) {
      showError(err.message || 'Failed to update recovery information');
    }
  };

  const handleOpenRecoveryEmailForm = () => {
    if (!showRecoveryEmailForm) {
      // Pre-fill with existing recovery_email when opening form
      setRecoveryData(prev => ({
        ...prev,
        recovery_email: profile.recovery_email || ''
      }));
    }
    setShowRecoveryEmailForm(!showRecoveryEmailForm);
  };

  const handleOpenRecoveryMobileForm = () => {
    if (!showRecoveryMobileForm) {
      // Pre-fill with existing recovery_mobile when opening form
      setRecoveryData(prev => ({
        ...prev,
        recovery_mobile: profile.recovery_mobile || ''
      }));
    }
    setShowRecoveryMobileForm(!showRecoveryMobileForm);
  };

  const handleLogout = () => {
    logout();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50 dark:from-[#252526] dark:to-[#1E1E1E]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#1F75FE] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50 dark:from-[#252526] dark:to-[#1E1E1E]">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Failed to load profile</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Background decorative elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#1F75FE] rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute -bottom-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      {/* Main Content */}
      <section className="relative z-10 min-h-screen bg-white dark:bg-[#252526] py-8 sm:py-12 lg:py-16">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 sm:mb-12"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1E1E1E] dark:text-[#D4D4D4] mb-2">
              My Account
            </h1>
            <p className="text-[#4A4A4A] dark:text-[#A0A0A0]">Manage your profile, security, and businesses</p>
          </motion.div>

          {/* Main Layout: Left Nav + Right Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Left Sidebar - Navigation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3A3A3A] rounded-2xl p-4 sm:p-6 shadow-lg dark:shadow-2xl sticky top-20">
                {/* Navigation Tabs */}
                <div className="space-y-2 mb-8">
                  <button
                    onClick={() => setActiveTab('personal')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition duration-200 flex items-center gap-3 ${
                      activeTab === 'personal'
                        ? 'bg-[#1F75FE] text-white'
                        : 'text-[#1E1E1E] dark:text-[#D4D4D4] hover:bg-gray-100 dark:hover:bg-[#2A2A2A]'
                    }`}
                  >
                    <User size={20} />
                    Personal Info
                  </button>

                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition duration-200 flex items-center gap-3 ${
                      activeTab === 'security'
                        ? 'bg-[#1F75FE] text-white'
                        : 'text-[#1E1E1E] dark:text-[#D4D4D4] hover:bg-gray-100 dark:hover:bg-[#2A2A2A]'
                    }`}
                  >
                    <Lock size={20} />
                    Security
                  </button>

                  <button
                    onClick={() => setActiveTab('businesses')}
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition duration-200 flex items-center gap-3 ${
                      activeTab === 'businesses'
                        ? 'bg-[#1F75FE] text-white'
                        : 'text-[#1E1E1E] dark:text-[#D4D4D4] hover:bg-gray-100 dark:hover:bg-[#2A2A2A]'
                    }`}
                  >
                    <Building2 size={20} />
                    My Businesses
                  </button>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-[#3A3A3A] my-6"></div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 rounded-lg font-semibold transition duration-200 flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
              </div>
            </motion.div>

            {/* Right Content Area */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-3"
            >
              <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3A3A3A] rounded-2xl p-6 sm:p-8 shadow-lg dark:shadow-2xl">
                <AnimatePresence mode="wait">
                  {/* Personal Info Tab */}
                  {activeTab === 'personal' && (
                    <motion.div
                      key="personal"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-[#1E1E1E] dark:text-[#D4D4D4]">Profile</h2>
                          <p className="text-sm text-[#4A4A4A] dark:text-[#A0A0A0] mt-1">Update your personal information</p>
                        </div>
                        {!isEditing && (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-[#1F75FE] text-white font-semibold rounded-lg hover:bg-[#f2a705] transition duration-200"
                          >
                            Edit Profile
                          </button>
                        )}
                      </div>

                      {/* Profile Card Display */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#2A2A2A] dark:to-[#252526] rounded-xl p-6 border border-gray-200 dark:border-[#3A3A3A]">
                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#1F75FE] to-blue-600">
                              {previewImage ? (
                                <img
                                  src={previewImage}
                                  alt="Profile"
                                  className="w-full h-full object-cover"
                                  onLoad={() => console.log('Image loaded:', previewImage)}
                                  onError={(e) => console.error('Image failed to load:', previewImage, e)}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                                  {profile.username_display?.charAt(0).toUpperCase() || 'U'}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Profile Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-[#1E1E1E] dark:text-[#D4D4D4] truncate">
                              {profile.username_display || 'Your Name'}
                            </h3>
                            <p className="text-[#4A4A4A] dark:text-[#A0A0A0] text-sm mt-1 truncate">
                              {profile.user_email}
                            </p>
                            <p className="text-[#4A4A4A] dark:text-[#A0A0A0] text-sm mt-1">
                              {profile.phone_number || 'No phone number'}
                            </p>
                            <p className="text-[#4A4A4A] dark:text-[#A0A0A0] text-sm mt-1">
                              {COUNTRY_MAP[profile.country] || 'No country selected'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Edit Form */}
                      {isEditing && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6 border-t border-gray-200 dark:border-[#3A3A3A] pt-6 mt-6"
                        >
                          {/* Image Upload */}
                          <div>
                            <label className="block text-sm font-semibold text-[#1E1E1E] dark:text-[#D4D4D4] mb-3">
                              Profile Photo
                            </label>
                            <div className="relative border-2 border-dashed border-[#1F75FE] rounded-lg p-6 text-center hover:bg-blue-50 dark:hover:bg-blue-900/10 transition">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <div className="flex flex-col items-center gap-2">
                                <Upload size={24} className="text-[#1F75FE]" />
                                <p className="text-sm font-medium text-[#1E1E1E] dark:text-[#D4D4D4]">
                                  Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-[#4A4A4A] dark:text-[#A0A0A0]">
                                  PNG, JPG, GIF, WebP up to 5MB
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Display Name */}
                          <div>
                            <label className="block text-sm font-semibold text-[#1E1E1E] dark:text-[#D4D4D4] mb-2">
                              Display Name
                            </label>
                            <input
                              type="text"
                              value={formData.username_display}
                              onChange={(e) => setFormData({ ...formData, username_display: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg bg-white dark:bg-[#252526] text-[#1E1E1E] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                              placeholder="Enter your display name"
                            />
                          </div>

                          {/* Phone Number */}
                          <div>
                            <label className="block text-sm font-semibold text-[#1E1E1E] dark:text-[#D4D4D4] mb-2">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={formData.phone_number}
                              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg bg-white dark:bg-[#252526] text-[#1E1E1E] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                              placeholder="Enter your phone number"
                            />
                          </div>

                          {/* Country */}
                          <div>
                            <label className="block text-sm font-semibold text-[#1E1E1E] dark:text-[#D4D4D4] mb-2">
                              Country
                            </label>
                            <select
                              value={formData.country}
                              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg bg-white dark:bg-[#252526] text-[#1E1E1E] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                            >
                              <option value="">Select a country</option>
                              {COUNTRIES.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-4">
                            <button
                              onClick={handleSaveProfile}
                              className="flex-1 px-6 py-3 bg-[#1F75FE] text-white font-semibold rounded-lg hover:bg-[#f2a705] transition duration-200 flex items-center justify-center gap-2"
                            >
                              <Save size={20} />
                              Save Changes
                            </button>
                            <button
                              onClick={() => {
                                setIsEditing(false);
                                setProfileImage(null);
                                // Use profile.profile_image directly - it's already a full URL
                                setPreviewImage(profile.profile_image || null);
                              }}
                              className="flex-1 px-6 py-3 border border-gray-300 dark:border-[#3A3A3A] text-[#1E1E1E] dark:text-white font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition duration-200 flex items-center justify-center gap-2"
                            >
                              <X size={20} />
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Security Tab */}
                  {activeTab === 'security' && (
                    <motion.div
                      key="security"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <h2 className="text-2xl font-bold text-[#1E1E1E] dark:text-[#D4D4D4]">Security</h2>

                      {/* Primary Email Section (Read-only) */}
                      <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-[#2A2A2A] p-6 rounded-xl border border-gray-200 dark:border-[#3A3A3A]">
                          <div className="flex items-center gap-3">
                            <Mail size={24} className="text-[#1F75FE]" />
                            <div>
                              <p className="font-semibold text-[#1E1E1E] dark:text-[#D4D4D4]">Primary Email</p>
                              <p className="text-sm text-[#4A4A4A] dark:text-[#A0A0A0]">{profile.user_email}</p>
                              <p className="text-xs text-[#1F75FE] mt-2">Used for login and account notifications</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Account Recovery Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#1E1E1E] dark:text-[#D4D4D4]">Account Recovery Options</h3>
                        <p className="text-sm text-[#4A4A4A] dark:text-[#A0A0A0]">Set up alternative ways to access your account if you lose your primary email</p>
                        
                        {/* Recovery Email */}
                        <div className="bg-gray-50 dark:bg-[#2A2A2A] p-6 rounded-xl border border-gray-200 dark:border-[#3A3A3A]">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <Mail size={24} className="text-[#10B981]" />
                              <div>
                                <p className="font-semibold text-[#1E1E1E] dark:text-[#D4D4D4]">Recovery Email</p>
                                <p className="text-sm text-[#4A4A4A] dark:text-[#A0A0A0]">
                                  {profile.recovery_email || 'Not set'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={handleOpenRecoveryEmailForm}
                              className="px-4 py-2 bg-white dark:bg-[#252526] text-[#1E1E1E] dark:text-white border border-gray-300 dark:border-[#3A3A3A] font-semibold rounded-lg hover:bg-[#1F75FE] hover:text-white hover:border-[#1F75FE] transition duration-200 whitespace-nowrap"
                            >
                              {showRecoveryEmailForm ? 'Cancel' : 'Edit'}
                            </button>
                          </div>

                          {showRecoveryEmailForm && (
                            <motion.form
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              onSubmit={handleUpdateRecoveryInfo}
                              className="mt-6 space-y-4 border-t border-gray-200 dark:border-[#3A3A3A] pt-6"
                            >
                              <input
                                type="email"
                                placeholder="Alternative email address"
                                value={recoveryData.recovery_email}
                                onChange={(e) => setRecoveryData({ ...recoveryData, recovery_email: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg bg-white dark:bg-[#252526] text-[#1E1E1E] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                              />
                              <p className="text-xs text-[#4A4A4A] dark:text-[#A0A0A0]">
                                Use a different email than your primary account email
                              </p>
                              <button
                                type="submit"
                                className="w-full px-6 py-3 bg-white dark:bg-[#252526] text-[#1E1E1E] dark:text-white border border-gray-300 dark:border-[#3A3A3A] font-semibold rounded-lg hover:bg-[#1F75FE] hover:text-white hover:border-[#1F75FE] transition duration-200"
                              >
                                Update Recovery Email
                              </button>
                            </motion.form>
                          )}
                        </div>

                        {/* Recovery Mobile */}
                        <div className="bg-gray-50 dark:bg-[#2A2A2A] p-6 rounded-xl border border-gray-200 dark:border-[#3A3A3A]">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <Phone size={24} className="text-[#F59E0B]" />
                              <div>
                                <p className="font-semibold text-[#1E1E1E] dark:text-[#D4D4D4]">Recovery Phone</p>
                                <p className="text-sm text-[#4A4A4A] dark:text-[#A0A0A0]">
                                  {profile.recovery_mobile || 'Not set'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={handleOpenRecoveryMobileForm}
                              className="px-4 py-2 bg-white dark:bg-[#252526] text-[#1E1E1E] dark:text-white border border-gray-300 dark:border-[#3A3A3A] font-semibold rounded-lg hover:bg-[#1F75FE] hover:text-white hover:border-[#1F75FE] transition duration-200 whitespace-nowrap"
                            >
                              {showRecoveryMobileForm ? 'Cancel' : 'Edit'}
                            </button>
                          </div>

                          {showRecoveryMobileForm && (
                            <motion.form
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              onSubmit={handleUpdateRecoveryInfo}
                              className="mt-6 space-y-4 border-t border-gray-200 dark:border-[#3A3A3A] pt-6"
                            >
                              <input
                                type="tel"
                                placeholder="Phone number (e.g., +1-234-567-8900)"
                                value={recoveryData.recovery_mobile}
                                onChange={(e) => setRecoveryData({ ...recoveryData, recovery_mobile: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg bg-white dark:bg-[#252526] text-[#1E1E1E] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                              />
                              <p className="text-xs text-[#4A4A4A] dark:text-[#A0A0A0]">
                                Use 10-15 digits. Can include spaces or dashes
                              </p>
                              <button
                                type="submit"
                                className="w-full px-6 py-3 bg-white dark:bg-[#252526] text-[#1E1E1E] dark:text-white border border-gray-300 dark:border-[#3A3A3A] font-semibold rounded-lg hover:bg-[#1F75FE] hover:text-white hover:border-[#1F75FE] transition duration-200"
                              >
                                Update Recovery Phone
                              </button>
                            </motion.form>
                          )}
                        </div>

                        {/* Recovery Codes Info */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                          <div className="flex gap-4">
                            <AlertCircle size={24} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-200">12-Digit Recovery Codes</p>
                              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                                You have 10 one-time recovery codes to access your account if you lose email access. Each code can only be used once.
                              </p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                Recovery codes were sent to your email during signup and can be regenerated in account settings.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Password Section */}
                      <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-[#2A2A2A] p-6 rounded-xl border border-gray-200 dark:border-[#3A3A3A]">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <Lock size={24} className="text-[#1F75FE]" />
                              <div>
                                <p className="font-semibold text-[#1E1E1E] dark:text-[#D4D4D4]">Password</p>
                                <p className="text-sm text-[#4A4A4A] dark:text-[#A0A0A0]">Update your password regularly</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowPasswordForm(!showPasswordForm)}
                              className="px-4 py-2 bg-[#1F75FE] text-white font-semibold rounded-lg hover:bg-[#f2a705] transition duration-200 whitespace-nowrap"
                            >
                              {showPasswordForm ? 'Cancel' : 'Change'}
                            </button>
                          </div>

                          {showPasswordForm && (
                            <motion.form
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              onSubmit={handlePasswordChange}
                              className="mt-6 space-y-4 border-t border-gray-200 dark:border-[#3A3A3A] pt-6"
                            >
                              <div className="relative">
                                <input
                                  type={showPasswords.old ? 'text' : 'password'}
                                  placeholder="Current password"
                                  value={passwordData.old_password}
                                  onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                                  required
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg bg-white dark:bg-[#252526] text-[#1E1E1E] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4A4A4A] dark:text-[#A0A0A0]"
                                >
                                  {showPasswords.old ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                              </div>

                              <div className="relative">
                                <input
                                  type={showPasswords.new ? 'text' : 'password'}
                                  placeholder="New password (min. 8 characters)"
                                  value={passwordData.new_password}
                                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                  required
                                  minLength="8"
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg bg-white dark:bg-[#252526] text-[#1E1E1E] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4A4A4A] dark:text-[#A0A0A0]"
                                >
                                  {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                              </div>

                              <div className="relative">
                                <input
                                  type={showPasswords.confirm ? 'text' : 'password'}
                                  placeholder="Confirm new password"
                                  value={passwordData.confirm_password}
                                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                  required
                                  minLength="8"
                                  className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg bg-white dark:bg-[#252526] text-[#1E1E1E] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4A4A4A] dark:text-[#A0A0A0]"
                                >
                                  {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                              </div>

                              <button
                                type="submit"
                                className="w-full px-6 py-3 bg-[#1F75FE] text-white font-semibold rounded-lg hover:bg-[#f2a705] transition duration-200"
                              >
                                Update Password
                              </button>
                            </motion.form>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Businesses Tab */}
                  {activeTab === 'businesses' && (
                    <motion.div
                      key="businesses"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-[#1E1E1E] dark:text-[#D4D4D4]">My Businesses</h2>
                        <button
                          onClick={() => navigate('/business/create')}
                          className="flex items-center gap-2 px-4 py-2 bg-[#1F75FE] text-white font-semibold rounded-lg hover:bg-[#f2a705] transition duration-200"
                        >
                          <Plus size={20} />
                          Create Business
                        </button>
                      </div>
                        
                        {businesses.length === 0 ? (
                          <div className="text-center py-12 border border-dashed border-gray-300 dark:border-[#3A3A3A] rounded-lg">
                            <Building2 size={48} className="mx-auto text-[#4A4A4A] dark:text-[#A0A0A0] mb-3 opacity-50" />
                            <p className="text-[#4A4A4A] dark:text-[#A0A0A0]">No businesses yet</p>
                            <p className="text-sm text-[#4A4A4A] dark:text-[#A0A0A0] mt-1">Create your first business to get started</p>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              onClick={() => navigate('/business/create')}
                              className="mt-4 px-6 py-2 bg-[#1F75FE] text-white font-semibold rounded-lg hover:bg-[#f2a705] transition duration-200"
                            >
                              Create Your First Business
                            </motion.button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {businesses.map((business) => (
                              <motion.div
                                key={business.id}
                                whileHover={{ y: -4 }}
                                className="p-6 border border-gray-200 dark:border-[#3A3A3A] rounded-lg hover:shadow-lg dark:hover:shadow-2xl transition duration-200 cursor-pointer"
                                onClick={() => navigate(`/business/${business.id}`)}
                              >
                                <h3 className="font-semibold text-[#1E1E1E] dark:text-[#D4D4D4] mb-2">{business.name}</h3>
                                <p className="text-sm text-[#4A4A4A] dark:text-[#A0A0A0]">{business.description || 'No description'}</p>
                              </motion.div>
                            ))}
                          </div>
                        )}

                      {/* Create New Business Button */}
                      <div className="border-t border-gray-200 dark:border-[#3A3A3A] pt-8">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          onClick={() => navigate('/business/create')}
                          className="w-full px-6 py-3 bg-[#1F75FE] text-white font-semibold rounded-lg hover:bg-[#f2a705] transition duration-200 flex items-center justify-center gap-2"
                        >
                          <Plus size={20} />
                          Create New Business
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Toast notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </>
  );
}
