// src/components/SocialAccountManager.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Link2,
  Unlink2,
  Users,
  RefreshCw,
} from "lucide-react";
import { Button } from "./ui/button";
import { API_BASE_URL } from "../utils/constants";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", color: "#E4405F", icon: "📷" },
  { id: "facebook", name: "Facebook", color: "#1877F2", icon: "👤" },
  { id: "tiktok", name: "TikTok", color: "#000000", icon: "🎵" },
  { id: "youtube", name: "YouTube", color: "#FF0000", icon: "📹" },
  { id: "twitter", name: "Twitter/X", color: "#000000", icon: "𝕏" },
  { id: "linkedin", name: "LinkedIn", color: "#0A66C2", icon: "💼" },
  { id: "pinterest", name: "Pinterest", color: "#E60023", icon: "📌" },
  { id: "snapchat", name: "Snapchat", color: "#FFFC00", icon: "👻" },
  { id: "whatsapp", name: "WhatsApp", color: "#25D366", icon: "💬" },
  { id: "telegram", name: "Telegram", color: "#0088cc", icon: "✈️" },
  { id: "discord", name: "Discord", color: "#5865F2", icon: "🎮" },
  { id: "twitch", name: "Twitch", color: "#9146FF", icon: "🎬" },
  { id: "reddit", name: "Reddit", color: "#FF4500", icon: "🤖" },
  { id: "tumblr", name: "Tumblr", color: "#36465D", icon: "🎨" },
  { id: "threads", name: "Threads", color: "#000000", icon: "💬" },
];

export default function SocialAccountManager({ businessId }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [formData, setFormData] = useState({
    platform: "",
    account_username: "",
    account_url: "",
    access_token: "",
  });

  useEffect(() => {
    fetchAccounts();
  }, [businessId]);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const resp = await fetch(
        `${API_BASE_URL}/social-accounts/by_business/?business_id=${businessId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!resp.ok) throw new Error("Failed to fetch accounts");

      const data = await resp.json();
      setAccounts(data);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setError("Failed to load social accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (!formData.platform || !formData.account_username) {
        setError("Platform and username are required");
        return;
      }

      const token = localStorage.getItem("access_token");
      const resp = await fetch(`${API_BASE_URL}/social-accounts/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business: businessId,
          ...formData,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.errors?.[0] || "Failed to add account");
      }

      const newAccount = await resp.json();
      setAccounts([...accounts, newAccount.data]);
      setSuccess("Social account linked successfully!");
      setFormData({
        platform: "",
        account_username: "",
        account_url: "",
        access_token: "",
      });
      setShowAddForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDisconnect = async (accountId) => {
    if (!window.confirm("Are you sure you want to disconnect this account?")) return;

    try {
      setError(null);
      const token = localStorage.getItem("access_token");

      const resp = await fetch(`${API_BASE_URL}/social-accounts/${accountId}/disconnect/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) throw new Error("Failed to disconnect");

      const data = await resp.json();
      setAccounts(
        accounts.map((acc) => (acc.id === accountId ? data.data : acc))
      );
      setSuccess("Account disconnected successfully");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSync = async (accountId) => {
    try {
      setSyncingId(accountId);
      const token = localStorage.getItem("access_token");

      const resp = await fetch(`${API_BASE_URL}/social-accounts/${accountId}/sync/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) throw new Error("Failed to sync");

      const data = await resp.json();
      setAccounts(
        accounts.map((acc) => (acc.id === accountId ? data.data : acc))
      );
      setSuccess("Account synced successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncingId(null);
    }
  };

  const getConnectedPlatforms = () => {
    return accounts.map((acc) => acc.platform);
  };

  const getAvailablePlatforms = () => {
    return PLATFORMS.filter((p) => !getConnectedPlatforms().includes(p.id));
  };

  const getPlatformInfo = (platformId) => {
    return PLATFORMS.find((p) => p.id === platformId);
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
            <h2 className="text-3xl font-bold text-[#1F75FE] mb-2 flex items-center gap-2">
              <Link2 size={32} />
              Social Media Accounts
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Connect and manage your social media profiles
            </p>
          </div>
          {!showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-[#f2a705] hover:bg-orange-600 text-white flex items-center gap-2"
            >
              <Plus size={20} />
              Add Account
            </Button>
          )}
        </div>

        {/* Add Account Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-6 bg-gray-50 dark:bg-[#252526] border border-gray-200 dark:border-[#3A3A3A] rounded-lg"
            >
              <h3 className="text-lg font-bold text-[#1E1E1E] dark:text-[#D4D4D4] mb-4">
                Link New Account
              </h3>

              <div className="space-y-4">
                {/* Platform Select */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Platform
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) =>
                      setFormData({ ...formData, platform: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg dark:bg-[#1E1E1E] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                  >
                    <option value="">Select a platform</option>
                    {getAvailablePlatforms().map((platform) => (
                      <option key={platform.id} value={platform.id}>
                        {platform.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Account Username/Handle
                  </label>
                  <input
                    type="text"
                    value={formData.account_username}
                    onChange={(e) =>
                      setFormData({ ...formData, account_username: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg dark:bg-[#1E1E1E] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                    placeholder="@yourusername"
                  />
                </div>

                {/* Account URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Account URL (optional)
                  </label>
                  <input
                    type="url"
                    value={formData.account_url}
                    onChange={(e) =>
                      setFormData({ ...formData, account_url: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-lg dark:bg-[#1E1E1E] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                    placeholder="https://instagram.com/yourusername"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleAddAccount}
                    className="flex-1 bg-[#1F75FE] hover:bg-blue-700 text-white"
                  >
                    Link Account
                  </Button>
                  <Button
                    onClick={() => setShowAddForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connected Accounts */}
        <div>
          <h3 className="text-lg font-bold text-[#1E1E1E] dark:text-[#D4D4D4] mb-4">
            Connected Accounts ({accounts.length})
          </h3>

          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No social accounts connected yet
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                Click "Add Account" to connect your first social media profile
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((account) => {
                const platform = getPlatformInfo(account.platform);
                return (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gray-50 dark:bg-[#252526] border border-gray-200 dark:border-[#3A3A3A] rounded-lg hover:border-[#1F75FE] transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                          style={{ backgroundColor: platform?.color + "20" }}
                        >
                          {platform?.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#1E1E1E] dark:text-[#D4D4D4]">
                            {platform?.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            @{account.account_username}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          account.is_connected
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                        }`}
                      >
                        {account.status}
                      </div>
                    </div>

                    {/* Followers */}
                    {account.followers_count > 0 && (
                      <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                        <Users size={14} className="inline mr-1" />
                        {account.followers_count} followers
                      </div>
                    )}

                    {/* Error Message */}
                    {account.connection_error && (
                      <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                        {account.connection_error}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSync(account.id)}
                        disabled={syncingId === account.id}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition disabled:opacity-50"
                      >
                        <RefreshCw size={14} />
                        {syncingId === account.id ? "Syncing..." : "Sync"}
                      </button>
                      <button
                        onClick={() => handleDisconnect(account.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                      >
                        <Unlink2 size={14} />
                        Disconnect
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
