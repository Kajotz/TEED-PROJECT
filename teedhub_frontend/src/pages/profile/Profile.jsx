// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LogOut, Mail, Settings, Building2, Home, Lock, User } from "lucide-react";
import PersonalInfo from "@/components/PersonalInfo";
import AdditionalInfo from "@/components/AdditionalInfo";
import { API_BASE_URL } from "@/utils/constants";
const BACKEND_ROOT = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

export default function Profile() {
  const [user, setUser] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    fetchBusinesses();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      // Fetch personal info from UserProfile endpoint - includes user_email from User model
      console.log('Fetching profile from:', `${API_BASE_URL}/personal-info/get_personal_info/`);
      const resp = await fetch(`${API_BASE_URL}/personal-info/get_personal_info/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resp.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return;
      }

      if (!resp.ok) {
        const errText = await resp.text();
        console.error('Profile API error:', resp.status, errText);
        throw new Error(`Profile API error: ${resp.status}`);
      }

      const data = await resp.json();
      console.log('Profile data loaded:', data);
      setUser(data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError(`Failed to load profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const resp = await fetch(`${API_BASE_URL}/profile/businesses/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resp.ok) {
        const data = await resp.json();
        setBusinesses(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error("Failed to fetch businesses:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      setPasswordLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const resp = await fetch(`${BACKEND_ROOT}/dj-rest-auth/password/change/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password1: newPassword,
          new_password2: confirmPassword,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.old_password?.[0] || data.detail || "Password change failed");
      }

      setSuccess("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordChange(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50 dark:from-[#1E1E1E] dark:to-[#252526]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#1F75FE] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50 dark:from-[#1E1E1E] dark:to-[#252526]">
        <p className="text-gray-600 dark:text-gray-400">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white dark:from-[#1E1E1E] dark:via-[#252526] dark:to-[#1E1E1E]">
      {/* Background decorative elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#1F75FE] rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute -bottom-20 left-20 w-72 h-72 bg-[#f2a705] rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 bg-white dark:bg-[#1E1E1E] border-b border-gray-200 dark:border-[#3A3A3A] shadow-sm sticky top-0"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1F75FE] to-blue-600 flex items-center justify-center shadow-lg">
              <Home size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#1F75FE]">My Account</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Manage your profile and settings</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition duration-200"
          >
            <LogOut size={20} />
            Sign Out
          </motion.button>
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Messages */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex gap-3"
          >
            <span className="text-green-600 text-2xl">✓</span>
            <p className="text-green-800 dark:text-green-200 font-medium">{success}</p>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3"
          >
            <span className="text-red-600 text-2xl">⚠</span>
            <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="mb-8 flex gap-2 border-b border-gray-200 dark:border-[#3A3A3A] overflow-x-auto">
          {[
            { id: "personal", label: "Personal Info", icon: <User size={18} /> },
            { id: "additional", label: "Additional Info", icon: <Mail size={18} /> },
            { id: "security", label: "Security", icon: <Lock size={18} /> },
            { id: "businesses", label: "My Businesses", icon: <Building2 size={18} /> },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-semibold flex items-center gap-2 transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-b-2 border-[#1F75FE] text-[#1F75FE]"
                  : "border-b-2 border-transparent text-gray-600 dark:text-gray-400 hover:text-[#1F75FE]"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.icon}
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {/* Personal Info Tab */}
          {activeTab === "personal" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key="personal"
            >
              <PersonalInfo />
            </motion.div>
          )}

          {/* Additional Info Tab */}
          {activeTab === "additional" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key="additional"
            >
              <AdditionalInfo />
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key="security"
            >
              <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3A3A3A] rounded-2xl p-8 shadow-lg">
                <h2 className="text-3xl font-bold text-[#1F75FE] mb-2">Security & Password</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Manage your password and account security
                </p>

                <div className="space-y-6">
                  {!showPasswordChange ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowPasswordChange(true)}
                      className="w-full flex items-center justify-center gap-3 p-4 bg-[#1F75FE] hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200 shadow-md"
                    >
                      <Lock size={20} />
                      Change Password
                    </motion.button>
                  ) : (
                    <motion.form
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handlePasswordChange}
                      className="space-y-4 p-6 bg-gray-50 dark:bg-[#252526] rounded-lg border border-gray-200 dark:border-[#3A3A3A]"
                    >
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg dark:bg-[#1E1E1E] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg dark:bg-[#1E1E1E] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg dark:bg-[#1E1E1E] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                          required
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={passwordLoading}
                          className="flex-1 bg-[#1F75FE] hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50"
                        >
                          {passwordLoading ? "Updating..." : "Update Password"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordChange(false);
                            setOldPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                            setError(null);
                          }}
                          className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 rounded-lg transition duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.form>
                  )}
                </div>

                {/* Account Status */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-[#3A3A3A]">
                  <h3 className="text-lg font-bold text-[#1E1E1E] dark:text-[#D4D4D4] mb-4">
                    Account Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Email</span>
                      <span className="text-green-600 dark:text-green-400 font-medium">{user.email}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">Status</span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        {user.is_active ? "✓ Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Businesses Tab */}
          {activeTab === "businesses" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key="businesses"
            >
              <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3A3A3A] rounded-2xl p-8 shadow-lg">
                <h2 className="text-3xl font-bold text-[#1F75FE] mb-2">My Businesses</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Create and manage your business profiles
                </p>

                {businesses.length === 0 ? (
                  <div className="text-center py-16">
                    <Building2 size={64} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">
                      No businesses yet
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mb-6">
                      Create your first business profile to get started with social media management
                    </p>
                    <a
                      href="/business/create"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#1F75FE] hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200"
                    >
                      <Building2 size={20} />
                      Create Business
                    </a>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {businesses.map((business) => (
                        <motion.div
                          key={business.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ y: -5 }}
                          className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#252526] dark:to-[#1E1E1E] border border-gray-200 dark:border-[#3A3A3A] rounded-xl hover:border-[#1F75FE] transition shadow-md hover:shadow-lg"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-[#1F75FE]">{business.name}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {business.business_type}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                business.is_active
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300"
                              }`}
                            >
                              {business.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>

                          {business.profile?.about && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                              {business.profile.about}
                            </p>
                          )}

                          <div className="flex gap-2">
                            <a
                              href={`/business/${business.id}`}
                              className="flex-1 px-4 py-2 text-center bg-[#1F75FE] hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200 text-sm"
                            >
                              View
                            </a>
                            <a
                              href={`/business/${business.id}/edit`}
                              className="flex-1 px-4 py-2 text-center bg-[#f2a705] hover:bg-orange-600 text-white font-semibold rounded-lg transition duration-200 text-sm"
                            >
                              Edit
                            </a>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="text-center pt-8 border-t border-gray-200 dark:border-[#3A3A3A]">
                      <a
                        href="/business/create"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#f2a705] hover:bg-orange-600 text-white font-semibold rounded-lg transition duration-200"
                      >
                        <Building2 size={20} />
                        Create Another Business
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
