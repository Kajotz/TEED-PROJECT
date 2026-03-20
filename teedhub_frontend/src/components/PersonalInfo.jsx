// src/components/PersonalInfo.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  X,
  Upload,
  CheckCircle,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "./ui/button";
import { API_BASE_URL } from "../utils/constants";

const BACKEND_ROOT = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

const COUNTRY_MAP = {
  TZ: "Tanzania",
  KE: "Kenya",
  UG: "Uganda",
  BI: "Burundi",
  RW: "Rwanda",
  CD: "DRC",
  ZM: "Zambia",
};

const COUNTRIES = [
  { code: "TZ", name: "Tanzania" },
  { code: "KE", name: "Kenya" },
  { code: "UG", name: "Uganda" },
  { code: "BI", name: "Burundi" },
  { code: "RW", name: "Rwanda" },
  { code: "CD", name: "DRC" },
  { code: "ZM", name: "Zambia" },
];

export default function PersonalInfo() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    username_display: "",
    phone_number: "",
    country: "",
  });
  
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  
  const [emailData, setEmailData] = useState({
    email: "",
    password: "",
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchPersonalInfo();
  }, []);

  const fetchPersonalInfo = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const resp = await fetch(`${API_BASE_URL}/personal-info/get_personal_info/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resp.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return;
      }

      const data = await resp.json();
      setProfile(data);
      setFormData({
        username_display: data.username_display || "",
        phone_number: data.phone_number || "",
        country: data.country || "",
      });
      
      // Handle profile image URL - ensure it's a full URL
      if (data.profile_image) {
        const imageUrl = data.profile_image;
        const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${BACKEND_ROOT}${imageUrl}`;
        setPreviewImage(fullImageUrl);
      } else {
        setPreviewImage(null);
      }
    } catch (err) {
      console.error("Failed to fetch personal info:", err);
      setError("Failed to load personal information");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, GIF, and WebP images are allowed");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setProfileImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEmailChange = (e) => {
    const { name, value } = e.target;
    setEmailData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitPasswordChange = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError("New passwords do not match");
      return;
    }

    if (passwordData.new_password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const resp = await fetch(`${API_BASE_URL}/personal-info/change_password/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordData),
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || "Failed to change password");
      }

      setSuccess("Password changed successfully!");
      setPasswordData({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
      setShowPasswordChange(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmitEmailChange = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("access_token");
      const resp = await fetch(`${API_BASE_URL}/personal-info/update_email/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || "Failed to update email");
      }

      setSuccess("Email updated successfully!");
      setEmailData({
        email: "",
        password: "",
      });
      setShowEmailChange(false);
      fetchPersonalInfo();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("access_token");
      setError(null);
      setSuccess(null);

      // First, update profile data
      const resp = await fetch(`${API_BASE_URL}/personal-info/update_personal_info/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.errors?.[0] || "Failed to update profile");
      }

      // Then upload image if changed
      if (profileImage) {
        const formDataWithImage = new FormData();
        formDataWithImage.append("profile_image", profileImage);

        const imageResp = await fetch(`${API_BASE_URL}/personal-info/upload_profile_image/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formDataWithImage,
        });

        if (!imageResp.ok) {
          const data = await imageResp.json();
          throw new Error(data.error || "Failed to upload image");
        }
        
        const imageData = await imageResp.json();
        console.log("Image upload response:", imageData);
        
        // Update preview with the new image URL from response
        if (imageData.data?.profile_image) {
          const imageUrl = imageData.data.profile_image;
          // Ensure we have full URL
          const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${BACKEND_ROOT}${imageUrl}`;
          
          setPreviewImage(fullImageUrl);
          setProfile((prev) => ({
            ...prev,
            profile_image: fullImageUrl,
          }));
        }
        setProfileImage(null);
      }

      setSuccess("Personal information saved successfully!");
      setEditing(false);
      // Fetch to ensure we have the latest data from server
      setTimeout(() => {
        fetchPersonalInfo();
      }, 500);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#1F75FE] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex gap-3"
        >
          <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-800 dark:text-green-200 font-medium">{success}</p>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3"
        >
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3A3A3A] rounded-2xl p-8 shadow-lg"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#1F75FE] mb-2">Personal Information</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your username, phone number, and country
            </p>
          </div>
          {!editing && (
            <Button
              onClick={() => setEditing(true)}
              className="bg-[#1F75FE] hover:bg-blue-700 text-white"
            >
              Edit Profile
            </Button>
          )}
        </div>

        {editing ? (
          // Edit Mode
          <div className="space-y-6">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center gap-4 pb-6 border-b border-gray-200 dark:border-[#3A3A3A]">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#1F75FE] bg-gray-100 dark:bg-[#252526] flex items-center justify-center">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={64} className="text-gray-400" />
                )}
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <span className="flex items-center gap-2 px-4 py-2 bg-[#f2a705] hover:bg-orange-600 text-white font-medium rounded-lg transition">
                  <Upload size={18} />
                  Change Image
                </span>
              </label>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username Display */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <User size={16} className="inline mr-2" />
                  Username
                </label>
                <input
                  type="text"
                  name="username_display"
                  value={formData.username_display}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                  placeholder="Your username"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Phone size={16} className="inline mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin size={16} className="inline mr-2" />
                  Country
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                >
                  <option value="">Select a country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Preferences removed (no matching fields in backend model) */}

            {/* Buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-[#3A3A3A]">
              <Button
                onClick={handleSave}
                className="flex-1 bg-[#1F75FE] hover:bg-blue-700 text-white flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Save Changes
              </Button>
              <Button
                onClick={() => setEditing(false)}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <X size={18} />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          // View Mode
          <div className="space-y-8">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center gap-4 pb-6 border-b border-gray-200 dark:border-[#3A3A3A]">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#1F75FE] bg-gray-100 dark:bg-[#252526] flex items-center justify-center">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={64} className="text-gray-400" />
                )}
              </div>
            </div>

            {/* Personal Info Grid */}
            <div>
              <h3 className="text-lg font-semibold text-[#1F75FE] mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Username */}
                {profile?.username_display && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      USERNAME
                    </p>
                    <p className="text-lg text-gray-800 dark:text-gray-200 font-medium">
                      {profile.username_display}
                    </p>
                  </div>
                )}

                {/* Email */}
                {profile?.user_email && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      EMAIL
                    </p>
                    <p className="text-lg text-gray-800 dark:text-gray-200 font-medium">
                      {profile.user_email}
                    </p>
                  </div>
                )}

                {/* Phone */}
                {profile?.phone_number && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      PHONE
                    </p>
                    <p className="text-lg text-gray-800 dark:text-gray-200 font-medium">
                      {profile.phone_number}
                    </p>
                  </div>
                )}

                {/* Country */}
                {profile?.country && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                      COUNTRY
                    </p>
                    <p className="text-lg text-gray-800 dark:text-gray-200 font-medium">
                      {COUNTRY_MAP[profile.country] || profile.country}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Email Change Section */}
            <div className="pt-6 border-t border-gray-200 dark:border-[#3A3A3A]">
              <h3 className="text-lg font-semibold text-[#1F75FE] mb-4">Email Management</h3>
              {!showEmailChange ? (
                <Button
                  onClick={() => setShowEmailChange(true)}
                  className="bg-[#1F75FE] hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  <Mail size={18} />
                  Change Email
                </Button>
              ) : (
                <form onSubmit={handleSubmitEmailChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      New Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={emailData.email}
                      onChange={handleEmailChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                      placeholder="new@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Password (confirm)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={emailData.password}
                      onChange={handleEmailChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      className="flex-1 bg-[#1F75FE] hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                    >
                      <Save size={18} />
                      Update Email
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowEmailChange(false);
                        setEmailData({ email: "", password: "" });
                      }}
                      variant="outline"
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <X size={18} />
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Password Change Section */}
            <div className="pt-6 border-t border-gray-200 dark:border-[#3A3A3A]">
              <h3 className="text-lg font-semibold text-[#1F75FE] mb-4">Security</h3>
              {!showPasswordChange ? (
                <Button
                  onClick={() => setShowPasswordChange(true)}
                  className="bg-[#1F75FE] hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  <Lock size={18} />
                  Change Password
                </Button>
              ) : (
                <form onSubmit={handleSubmitPasswordChange} className="space-y-4">
                  {/* Old Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showOldPassword ? "text" : "password"}
                        name="old_password"
                        value={passwordData.old_password}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                        placeholder="Enter current password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="new_password"
                        value={passwordData.new_password}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                        placeholder="Enter new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirm_password"
                        value={passwordData.confirm_password}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                        placeholder="Confirm new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      className="flex-1 bg-[#1F75FE] hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                    >
                      <Lock size={18} />
                      Change Password
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowPasswordChange(false);
                        setPasswordData({
                          old_password: "",
                          new_password: "",
                          confirm_password: "",
                        });
                      }}
                      variant="outline"
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      <X size={18} />
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
