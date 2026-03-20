// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, Smartphone, Eye, EyeOff, CheckCircle } from "lucide-react";
import { API_BASE_URL } from "@/utils/constants";

// Get the base URL without /api suffix for general endpoints
const BACKEND_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

// Support both token-in-body and cookie-based sessions for login flows
const finalizeAuthForLogin = async (resp, data) => {
  try {
    if (data && (data.access || data.refresh)) {
      if (data.access) localStorage.setItem('access_token', data.access);
      if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
      return true;
    }

    const verifyResp = await fetch(`${BACKEND_URL}/dj-rest-auth/user/`, {
      method: 'GET',
      credentials: 'include',
    });
    return verifyResp.ok;
  } catch (err) {
    console.error('finalizeAuthForLogin error:', err);
    return false;
  }
};

// --- Icon components for social providers (using inline SVG for simplicity and consistency) ---
// --- Google Icon ---
const GoogleIcon = (props) => (
  <svg viewBox="0 0 48 48" {...props}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.91 3.57 30.29 2 24 2 15.17 2 7.51 5.34 2.89 11.45l7.98 6.19C13.23 11.23 18.25 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.96 24c0-1.55-.13-3.08-.36-4.57h-22.9V28h13.34c-.87 4.96-4.66 8.52-9.2 8.52-5.91 0-10.74-4.7-10.74-10.5c0-5.8 4.83-10.5 10.74-10.5 2.87 0 5.48 1.15 7.46 3.01l4.58-4.58c-3.72-3.64-8.81-5.89-14.54-5.89C15.17 11.45 7.51 14.79 2.89 20.9l7.98 6.19C13.23 26.77 18.25 24 24 24c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.91 22.07 30.29 20 24 20c-8.83 0-16.5 3.34-21.12 9.45l7.98 6.19C13.23 34.77 18.25 33 24 33c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.91 30.57 30.29 28 24 28c-8.83 0-16.5 3.34-21.12 9.45l7.98 6.19C13.23 43.77 18.25 42 24 42c8.83 0 16.5-3.34 21.12-9.45l-7.98-6.19C32.77 39.23 27.75 41 24 41c-5.91 0-10.74-4.7-10.74-10.5z" />
  </svg>
);

// Initialize Google OAuth (run once on component mount)
const initializeGoogleAuth = () => {
  const GOOGLE_CLIENT_ID = "1031953814986-q100q02ju0nc6h0p550l3sdcqt0si5m6.apps.googleusercontent.com";
  
  if (!window.google) {
    console.warn('Google API not loaded yet');
    return;
  }

  try {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleAuthSuccess,
    });
    
    // Render the Google Sign-In button into the container
    google.accounts.id.renderButton(
      document.getElementById('google-button-container'),
      { theme: 'outline', size: 'large', width: '100%' }
    );
  } catch (err) {
    console.error('Failed to initialize Google Auth:', err);
  }
};

// Handle successful Google authentication
const handleGoogleAuthSuccess = async (response) => {
  try {
    const googleToken = response.credential;
    
    if (!googleToken) {
      throw new Error('No credential received from Google');
    }

    // Token Exchange: Send Google ID Token to backend
    const resp = await fetch(`${API_BASE_URL}/auth/google/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: googleToken }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.error || "Google auth failed");
    }

    // Unified Session: Finalize with JWT tokens from backend
    const finalized = await finalizeAuthForLogin(resp, data);
    if (finalized) window.location.href = "/profile";
    else throw new Error('Google login failed to finalize authentication');
  } catch (err) {
    console.error("Google auth error:", err);
    alert("Google login failed: " + err.message);
  }
};

const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path fill="#1877F2" d="M12 2C6.477 2 2 6.477 2 12c0 5.084 3.791 9.36 8.75 9.923v-7.013H8.38v-2.91h2.37V9.75c0-2.348 1.433-3.636 3.523-3.636 1.002 0 1.956.074 2.223.107v2.54h-1.506c-1.118 0-1.336.531-1.336 1.312V12h2.813l-.454 2.91h-2.358v7.013C18.209 21.36 22 17.084 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
);
// ---------------------------------------------------------------------------------------

const useAuthForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Placeholder for optional Cloudflare Turnstile token retrieval if needed
    // The security is assumed to be handled at the network level via Cloudflare Bot Fight Mode or similar.

    try {
      const resp = await fetch(`${BACKEND_URL}/api/auth/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        console.error("Login error response:", data);
        throw new Error(data.detail || "Login failed. Check your credentials.");
      }

      console.log("Login successful, received tokens:", {
        access: data.access ? 'Present' : 'Missing',
        refresh: data.refresh ? 'Present' : 'Missing'
      });

      const finalized = await finalizeAuthForLogin(resp, data);
      if (!finalized) throw new Error('Login failed to establish session');
      
      // Verify token was stored
      const storedToken = localStorage.getItem('access_token');
      console.log('Token stored in localStorage:', storedToken ? 'Yes' : 'No');
      
      window.location.href = "/profile";
    } catch (err) {
      console.error(err);
      setError(err.message || "Login failed. Please try again.");
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    loading,
    error,
    handleEmailPasswordLogin,
  };
};

// Function to handle social login redirect (Google & Facebook via allauth)
const handleSocialLogin = (provider) => {
  // Google: /accounts/google/login/ (allauth)
  // Facebook: /accounts/facebook/login/ (allauth)
  window.location.href = `${BACKEND_URL}/accounts/${provider}/login/`;
};

// Function to handle phone OTP login
const handlePhoneLogin = async (phone) => {
  try {
    const resp = await fetch(`${BACKEND_URL}/api/auth/phone/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.detail || "Failed to send OTP");
    }

    // Store session ID for OTP verification
    sessionStorage.setItem("phone_session", data.session_id);
    return true;
  } catch (err) {
    console.error("Phone OTP error:", err);
    throw err;
  }
};

// Function to verify phone OTP
const handlePhoneOTPVerify = async (otp) => {
  try {
    const sessionId = sessionStorage.getItem("phone_session");
    const resp = await fetch(`${BACKEND_URL}/api/auth/phone/verify/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, otp }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.detail || "OTP verification failed");
    }

    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    window.location.href = "/profile";
  } catch (err) {
    console.error("OTP verify error:", err);
    throw err;
  }
};

// Mock Phone Number Login component
const PhoneLogin = () => {
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSendOTP = async () => {
    setLoading(true);
    setError(null);
    try {
      await handlePhoneLogin(phone);
      setOtpSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError(null);
    try {
      await handlePhoneOTPVerify(otp);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      <p className="text-sm text-center text-gray-500 dark:text-gray-400">
        Receive a one-time code via SMS to verify your phone number
      </p>
      <div className="relative">
        <Smartphone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="tel"
          placeholder="Phone Number (e.g., +1 555-123-4567)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={otpSent}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition disabled:opacity-50"
          required
        />
      </div>
      {!otpSent ? (
        <button
          onClick={handleSendOTP}
          disabled={phone.length < 10 || loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition duration-300 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send OTP"}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Enter OTP (6 digits)"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength="6"
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
              required
            />
          </div>
          <button
            onClick={handleVerifyOTP}
            disabled={otp.length !== 6 || loading}
            className="w-full bg-[#1F75FE] hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition duration-300 shadow-md disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify & Sign In"}
          </button>
          <button
            onClick={() => {
              setOtpSent(false);
              setOtp("");
              setError(null);
            }}
            className="w-full text-center text-sm text-[#1F75FE] hover:underline"
          >
            Use a different phone number
          </button>
        </div>
      )}
    </motion.div>
  );
};
// Recovery Code Login Component
const RecoveryCodeLogin = () => {
  const [email, setEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState({ new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleRecoveryCodeLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (recoveryCode.length !== 12) {
      setError("Recovery code must be exactly 12 digits");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/auth/recovery-login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          recovery_code: recoveryCode,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || data.detail || "Recovery login failed");
      }

      if (data.access && data.refresh) {
        localStorage.setItem("access_token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        setSuccess("Account recovered successfully! Redirecting...");
        setTimeout(() => {
          window.location.href = "/profile";
        }, 1500);
      }
    } catch (err) {
      setError(err.message || "Recovery code login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      key="recovery-form"
      onSubmit={handleRecoveryCodeLogin}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
        >
          <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
        </motion.div>
      )}

      <div className="relative">
        <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
          required
        />
      </div>

      <div className="relative">
        <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="12-Digit Recovery Code"
          value={recoveryCode}
          onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, ""))}
          maxLength="12"
          className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
          required
        />
      </div>

      <div className="relative">
        <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={showPassword.new ? "text" : "password"}
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
        >
          {showPassword.new ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <div className="relative">
        <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={showPassword.confirm ? "text" : "password"}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
        >
          {showPassword.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      <button
        type="submit"
        disabled={loading || !email || !recoveryCode || !newPassword || !confirmPassword}
        className="w-full bg-[#1F75FE] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition duration-300 shadow-md"
      >
        {loading ? "Recovering Account..." : "Recover & Sign In"}
      </button>
    </motion.form>
  );
};
export default function Login() {
  const { email, setEmail, password, setPassword, showPassword, setShowPassword, loading, error, handleEmailPasswordLogin } = useAuthForm();
  const [activeTab, setActiveTab] = useState("email"); // 'email', 'phone', 'recovery'

  // Initialize Google Auth on component mount
  useEffect(() => {
    initializeGoogleAuth();
  }, []);

  const benefits = [
    { icon: "💳", title: "Secure Payments", desc: "Advanced security measures protect your transactions" },
    { icon: "📊", title: "Real-time Analytics", desc: "Track your business metrics instantly" },
    { icon: "🌍", title: "Global Reach", desc: "Expand your business across continents" },
  ];

  const SocialButton = ({ icon: Icon, title, provider, bgColor, hoverColor }) => (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => handleSocialLogin(provider)}
      className={`w-full flex items-center justify-center gap-3 p-3 rounded-xl font-semibold border ${bgColor} ${hoverColor} transition duration-200 shadow-sm`}
    >
      <Icon className="w-5 h-5" />
      <span>Sign in with {title}</span>
    </motion.button>
  );

  return (
    <>
      {/* Background decorative elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#1F75FE] rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute -bottom-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      {/* Main Login Section */}
      <section className="w-full bg-white dark:bg-[#252526] transition-colors duration-300 relative z-10 min-h-screen flex items-center justify-center py-10">
        <div className="px-3 sm:px-5 md:px-8 lg:px-12 w-full max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
            {/* Left Side - Benefits (hidden on mobile) */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="hidden md:flex flex-col space-y-8"
            >
              <div>
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="text-3xl lg:text-4xl font-bold text-[#1E1E1E] dark:text-[#D4D4D4] mb-3"
                >
                  Welcome to TEED Hub
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-lg text-[#4A4A4A] dark:text-[#A0A0A0]"
                >
                  Empower your business with our comprehensive suite of tools
                </motion.p>
              </div>

              <div className="space-y-4">
                {benefits.map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1, duration: 0.6 }}
                    className="flex gap-4 items-start"
                  >
                    <div className="text-3xl flex-shrink-0">{benefit.icon}</div>
                    <div>
                      <h3 className="font-semibold text-[#1E1E1E] dark:text-[#D4D4D4]">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-[#4A4A4A] dark:text-[#A0A0A0] mt-1">
                        {benefit.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right Side - Login Form */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-md mx-auto"
            >
              <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#3A3A3A] rounded-2xl p-6 sm:p-8 md:p-10 shadow-lg dark:shadow-2xl">
                
                {/* Heading */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-center mb-8"
                >
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#1E1E1E] dark:text-[#D4D4D4] mb-2">
                    Sign In to Your Account
                  </h1>
                  <p className="text-sm text-[#4A4A4A] dark:text-[#A0A0A0]">
                    Choose your preferred login method
                  </p>
                </motion.div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </motion.div>
                )}
                
                {/* --- Social Login Options --- */}
                <div className="space-y-3 mb-6">
                  {/* Google Sign-In Button Container - will be rendered by Google API */}
                  <div id="google-button-container" className="flex justify-center"></div>
                  
                  <SocialButton
                    icon={() => <FacebookIcon className="w-5 h-5" />}
                    title="Facebook"
                    provider="facebook"
                    bgColor="bg-[#1877F2] border-[#1877F2] text-white"
                    hoverColor="hover:bg-[#1569d9] hover:border-[#1569d9]"
                  />
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-[#3A3A3A]"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">
                    Or sign in with
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-[#3A3A3A]"></div>
                </div>

                {/* --- Tab Selector for Email vs. Phone vs. Recovery --- */}
                <div className="flex gap-1 bg-gray-100 dark:bg-[#252526] p-1 rounded-xl mb-6">
                  <button
                    onClick={() => setActiveTab('email')}
                    className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition duration-300 ${
                      activeTab === 'email' ? 'bg-white text-[#1F75FE] shadow' : 'text-gray-500 dark:text-gray-400 hover:text-[#1F75FE]'
                    }`}
                  >
                    Email
                  </button>
                  <button
                    onClick={() => setActiveTab('phone')}
                    className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition duration-300 ${
                      activeTab === 'phone' ? 'bg-white text-[#1F75FE] shadow' : 'text-gray-500 dark:text-gray-400 hover:text-[#1F75FE]'
                    }`}
                  >
                    Phone
                  </button>
                  <button
                    onClick={() => setActiveTab('recovery')}
                    className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition duration-300 ${
                      activeTab === 'recovery' ? 'bg-white text-[#1F75FE] shadow' : 'text-gray-500 dark:text-gray-400 hover:text-[#1F75FE]'
                    }`}
                  >
                    Recovery
                  </button>
                </div>

                {/* --- Active Tab Content --- */}
                <div className="min-h-[150px]">
                  {activeTab === 'email' && (
                    <motion.form
                      key="email-form"
                      onSubmit={handleEmailPasswordLogin}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-4"
                    >
                      <div className="relative">
                        <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="email"
                          placeholder="Email Address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                          required
                        />
                      </div>
                      <div className="relative">
                        <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1F75FE]"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#1F75FE] hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition duration-300 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loading ? 'Signing In...' : 'Sign In'}
                      </button>
                      <a
                        href="/recover"
                        className="w-full bg-white dark:bg-[#252526] text-[#1E1E1E] dark:text-white border border-gray-300 dark:border-[#3A3A3A] font-semibold py-3 rounded-xl transition duration-300 flex items-center justify-center gap-2 hover:bg-[#1F75FE] hover:text-white hover:border-[#1F75FE]"
                      >
                        Forgotten Password?
                      </a>
                    </motion.form>
                  )}
                  {activeTab === 'phone' && <PhoneLogin />}
                  {activeTab === 'recovery' && <RecoveryCodeLogin />}
                </div>

                {/* Security Features */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="space-y-3 mt-6 pt-6 border-t border-gray-100 dark:border-[#3A3A3A]"
                >
                  <p className="text-center text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    Protected by Cloudflare
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[#4A4A4A] dark:text-[#A0A0A0]">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <span>Bot protection handled at the network edge.</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#4A4A4A] dark:text-[#A0A0A0]">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                    <span>Your data is encrypted and secure.</span>
                  </div>
                </motion.div>

                {/* Footer Note */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6"
                >
                  By signing in, you agree to our{" "}
                  <a href="#" className="text-[#1F75FE] hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-[#1F75FE] hover:underline">
                    Privacy Policy
                  </a>
                </motion.p>
              </div>

              {/* Additional Info */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="text-xs text-[#4A4A4A] dark:text-[#A0A0A0] text-center mt-6"
              >
                Don't have an account?{" "}
                <a href="/signup" className="text-[#1F75FE] hover:underline font-semibold">
                  Sign up now
                </a>
              </motion.p>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
