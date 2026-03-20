// src/pages/Signup.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, Smartphone, Eye, EyeOff, CheckCircle, AlertCircle, User } from "lucide-react";
import { API_BASE_URL } from "@/utils/constants";

const BACKEND_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
const IS_DEV = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

// Finalize authentication after registration/social login.
// Supports two backend behaviors:
// 1) Returns `access`/`refresh` tokens in JSON body
// 2) Sets HttpOnly session/refresh cookie and requires credentialed requests
const finalizeAuth = async (resp, data) => {
  try {
    if (data && (data.access || data.refresh)) {
      if (data.access) localStorage.setItem("access_token", data.access);
      if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
      return true;
    }

    // No tokens in body — attempt to verify session via cookie (credentials included)
    const verifyResp = await fetch(`${BACKEND_URL}/dj-rest-auth/user/`, {
      method: 'GET',
      credentials: 'include',
    });

    if (verifyResp.ok) return true;
    return false;
  } catch (err) {
    console.error('finalizeAuth error:', err);
    return false;
  }
};

// --- Google Icon ---
const GoogleIcon = (props) => (
  <svg viewBox="0 0 48 48" {...props}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.91 3.57 30.29 2 24 2 15.17 2 7.51 5.34 2.89 11.45l7.98 6.19C13.23 11.23 18.25 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.96 24c0-1.55-.13-3.08-.36-4.57h-22.9V28h13.34c-.87 4.96-4.66 8.52-9.2 8.52-5.91 0-10.74-4.7-10.74-10.5c0-5.8 4.83-10.5 10.74-10.5 2.87 0 5.48 1.15 7.46 3.01l4.58-4.58c-3.72-3.64-8.81-5.89-14.54-5.89C15.17 11.45 7.51 14.79 2.89 20.9l7.98 6.19C13.23 26.77 18.25 24 24 24c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.91 22.07 30.29 20 24 20c-8.83 0-16.5 3.34-21.12 9.45l7.98 6.19C13.23 34.77 18.25 33 24 33c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.91 30.57 30.29 28 24 28c-8.83 0-16.5 3.34-21.12 9.45l7.98 6.19C13.23 43.77 18.25 42 24 42c8.83 0 16.5-3.34 21.12-9.45l-7.98-6.19C32.77 39.23 27.75 41 24 41c-5.91 0-10.74-4.7-10.74-10.5z" />
  </svg>
);

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

    // Support both token-in-body and cookie-based sessions.
    const finalized = await finalizeAuth(resp, data);
    if (finalized) window.location.href = "/profile?signup_success=true";
    else throw new Error("Google signup failed to finalize authentication");
  } catch (err) {
    console.error("Google auth error:", err);
    alert("Google signup failed: " + err.message);
  }
};

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

const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path fill="#1877F2" d="M12 2C6.477 2 2 6.477 2 12c0 5.084 3.791 9.36 8.75 9.923v-7.013H8.38v-2.91h2.37V9.75c0-2.348 1.433-3.636 3.523-3.636 1.002 0 1.956.074 2.223.107v2.54h-1.506c-1.118 0-1.336.531-1.336 1.312V12h2.813l-.454 2.91h-2.358v7.013C18.209 21.36 22 17.084 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
);

// --- Password Strength Checker ---
const getPasswordStrength = (password) => {
  if (!password) return { strength: 0, label: "", color: "bg-gray-300" };
  
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  const labels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-green-600"];
  
  return {
    strength: strength,
    label: labels[strength] || "Weak",
    color: colors[strength] || "bg-red-500"
  };
};

// --- Signup Form Hook ---
const useSignupForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Profile fields - required before signup
  const [usernameDisplay, setUsernameDisplay] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("");
  
  // Email verification flow state
  const [verificationStep, setVerificationStep] = useState(null); // null, 'pending', 'complete'
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!usernameDisplay.trim()) {
      setError("Username is required");
      return;
    }
    
    if (!phoneNumber.trim()) {
      setError("Phone number is required");
      return;
    }
    
    if (!country) {
      setError("Country is required");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    if (!agreeTerms) {
      setError("You must agree to the Terms of Service");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Request verification code
      const resp = await fetch(`${BACKEND_URL}/dj-rest-auth/registration/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password1: password,
          password2: confirmPassword,
          username_display: usernameDisplay,
          phone_number: phoneNumber,
          country,
        }),
      });

      const data = await resp.json();
      
      console.log("Signup Step 1 response:", { status: resp.status, data });
      
      if (!resp.ok) {
        // Handle various error formats
        let errorMsg = "Signup failed. Please try again.";
        
        if (data.detail) {
          errorMsg = data.detail;
        } else if (data.error) {
          errorMsg = data.error;
        } else if (data.email) {
          errorMsg = Array.isArray(data.email) ? data.email[0] : data.email;
        } else if (data.password1) {
          errorMsg = Array.isArray(data.password1) ? data.password1[0] : data.password1;
        } else if (data.password2) {
          errorMsg = Array.isArray(data.password2) ? data.password2[0] : data.password2;
        } else if (data.username_display) {
          errorMsg = Array.isArray(data.username_display) ? data.username_display[0] : data.username_display;
        } else if (data.phone_number) {
          errorMsg = Array.isArray(data.phone_number) ? data.phone_number[0] : data.phone_number;
        } else if (data.country) {
          errorMsg = Array.isArray(data.country) ? data.country[0] : data.country;
        } else if (typeof data === 'string') {
          errorMsg = data;
        }
        
        throw new Error(errorMsg);
      }
      
      // Check if we got next_step: verify_email (new 2-step flow)
      if (data.next_step === "verify_email") {
        setVerificationStep("pending");
        setError(null);
        setLoading(false);
        return;
      }
      
      // Old behavior: got tokens directly (shouldn't happen with new enforcement)
      const finalized = await finalizeAuth(resp, data);
      if (!finalized) throw new Error("Login tokens not received and session not established");

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/profile?signup_success=true";
      }, 1200);
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setVerificationError(null);
    
    if (verificationCode.length !== 6) {
      setVerificationError("Verification code must be 6 digits");
      return;
    }

    setLoading(true);

    try {
      // Step 2: Complete registration with verification code
      const resp = await fetch(`${BACKEND_URL}/dj-rest-auth/registration/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password1: password,
          password2: confirmPassword,
          username_display: usernameDisplay,
          phone_number: phoneNumber,
          country,
          verification_code: verificationCode,
        }),
      });

      const data = await resp.json();
      
      console.log("Signup Step 2 response:", { status: resp.status, data });
      
      if (!resp.ok) {
        let errorMsg = "Verification failed. Please try again.";
        
        if (data.error) {
          errorMsg = data.error;
        } else if (data.detail) {
          errorMsg = data.detail;
        }
        
        throw new Error(errorMsg);
      }
      
      // Finalize auth: support tokens-in-body or cookie-based sessions
      const finalized = await finalizeAuth(resp, data);
      if (!finalized) throw new Error("Login tokens not received and session not established");

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/profile?signup_success=true";
      }, 1200);
    } catch (err) {
      console.error("Verification error:", err);
      setVerificationError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Finalize authentication after registration/social login.
  // Supports two backend behaviors:
  // 1) Returns `access`/`refresh` tokens in JSON body
  // 2) Sets HttpOnly session/refresh cookie and requires credentialed requests
  const finalizeAuth = async (resp, data) => {
    try {
      if (data && (data.access || data.refresh)) {
        if (data.access) localStorage.setItem("access_token", data.access);
        if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
        return true;
      }

      // No tokens in body — attempt to verify session via cookie (credentials included)
      const verifyResp = await fetch(`${API_BASE_URL}/dj-rest-auth/user/`, {
        method: 'GET',
        credentials: 'include',
      });

      if (verifyResp.ok) return true;
      return false;
    } catch (err) {
      console.error('finalizeAuth error:', err);
      return false;
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    agreeTerms,
    setAgreeTerms,
    loading,
    error,
    success,
    handleSignup,
    verificationStep,
    setVerificationStep,
    verificationCode,
    setVerificationCode,
    verificationError,
    setVerificationError,
    handleVerifyCode,
    usernameDisplay,
    setUsernameDisplay,
    phoneNumber,
    setPhoneNumber,
    country,
    setCountry,
  };
};

// --- Social Signup ---
const handleSocialSignup = (provider) => {
  // Allauth uses /login/ endpoint for both signup and login flows
  // The endpoint will auto-create account if user doesn't exist
  window.location.href = `${BACKEND_URL}/accounts/${provider}/login/`;
};

// --- Phone Signup Component ---
const PhoneSignup = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSendOTP = async () => {
    setLoading(true);
    setError(null);
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const resp = await fetch(`${BACKEND_URL}/api/auth/phone/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.detail || "Failed to send OTP");
      }

      sessionStorage.setItem("phone_session", data.session_id);
      sessionStorage.setItem("phone_password", password);
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
      const sessionId = sessionStorage.getItem("phone_session");
      const savedPassword = sessionStorage.getItem("phone_password");

      const resp = await fetch(`${BACKEND_URL}/api/auth/phone/signup/verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          otp,
          password: savedPassword,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.detail || "OTP verification failed");
      }

      // Support both token-in-body and cookie-based sessions for phone signup
      if (data && (data.access || data.refresh)) {
        if (data.access) localStorage.setItem("access_token", data.access);
        if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
        window.location.href = "/profile?signup_success=true";
        return;
      }

      // Try verifying session via cookie
      const verifyResp = await fetch(`${BACKEND_URL}/dj-rest-auth/user/`, {
        method: 'GET',
        credentials: 'include',
      });

      if (verifyResp.ok) {
        window.location.href = "/profile?signup_success=true";
        return;
      }

      throw new Error('OTP verification succeeded but no session/tokens were established');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-2">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <p className="text-sm text-center text-gray-500 dark:text-gray-400">
        Create account using your phone number
      </p>

      {!otpSent ? (
        <>
          <div className="relative">
            <Smartphone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              placeholder="Phone Number (e.g., +1 555-123-4567)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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

          {password && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-[#3A3A3A] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {passwordStrength.label}
                </span>
              </div>
            </div>
          )}

          <div className="relative">
            <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
              required
            />
          </div>

          <button
            onClick={handleSendOTP}
            disabled={phone.length < 10 || password.length < 8 || loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition duration-300 shadow-md disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex gap-2">
            <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-600 dark:text-green-400">OTP sent to {phone}</p>
          </div>

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
            {loading ? "Verifying..." : "Create Account"}
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

export default function Signup() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    agreeTerms,
    setAgreeTerms,
    loading,
    error,
    success,
    handleSignup,
    verificationStep,
    setVerificationStep,
    verificationCode,
    setVerificationCode,
    verificationError,
    setVerificationError,
    handleVerifyCode,
    usernameDisplay,
    setUsernameDisplay,
    phoneNumber,
    setPhoneNumber,
    country,
    setCountry,
  } = useSignupForm();

  const [activeTab, setActiveTab] = useState("email");
  const passwordStrength = getPasswordStrength(password);

  // Debug helper - show verification code in development
  const [debugCode, setDebugCode] = useState(null);
  const [debugLoading, setDebugLoading] = useState(false);
  
  const fetchDebugCode = async () => {
    if (!email) {
      alert("Please enter an email first");
      return;
    }
    
    setDebugLoading(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/auth/email-verification/debug/?email=${encodeURIComponent(email)}`);
      const data = await resp.json();
      
      if (resp.ok) {
        setDebugCode(data.code);
      } else {
        alert(data.error || "No code found for this email");
        setDebugCode(null);
      }
    } catch (err) {
      console.error("Debug fetch error:", err);
      alert("Failed to fetch code: " + err.message);
    } finally {
      setDebugLoading(false);
    }
  };

  // Initialize Google Auth on component mount
  useEffect(() => {
    initializeGoogleAuth();
  }, []);

  const SocialButton = ({ icon: Icon, title, provider, bgColor, hoverColor }) => (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => handleSocialSignup(provider)}
      className={`w-full flex items-center justify-center gap-3 p-3 rounded-xl font-semibold border ${bgColor} ${hoverColor} transition duration-200 shadow-sm`}
    >
      <Icon className="w-5 h-5" />
      <span>Sign up with {title}</span>
    </motion.button>
  );

  return (
    <>
      {/* Background decorative elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#1F75FE] rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        <div className="absolute -bottom-20 left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      </div>

      {/* Main Signup Section */}
      <section className="w-full bg-white dark:bg-[#252526] transition-colors duration-300 relative z-10 min-h-screen flex items-center justify-center py-10">
        <div className="px-3 sm:px-5 md:px-8 lg:px-12 w-full max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
            {/* Left Side - Benefits */}
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
                  Join TEED Hub
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-lg text-[#4A4A4A] dark:text-[#A0A0A0]"
                >
                  Start building and managing your business today
                </motion.p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: "🚀", title: "Quick Setup", desc: "Get started in minutes with our intuitive platform" },
                  { icon: "🔐", title: "Secure & Safe", desc: "Bank-level security protects your business data" },
                  { icon: "📈", title: "Grow Your Business", desc: "Tools designed to help you scale and succeed" },
                ].map((benefit, idx) => (
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

            {/* Right Side - Signup Form */}
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
                    Create Your Account
                  </h1>
                  <p className="text-sm text-[#4A4A4A] dark:text-[#A0A0A0]">
                    Choose your preferred signup method
                  </p>
                </motion.div>

                {/* Success Message */}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex gap-2"
                  >
                    <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Account created! Redirecting to dashboard...
                    </p>
                  </motion.div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-2"
                  >
                    <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </motion.div>
                )}

                {/* Social Signup */}
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
                    Or sign up with
                  </span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-[#3A3A3A]"></div>
                </div>

                {/* Tab Selector */}
                <div className="flex bg-gray-100 dark:bg-[#252526] p-1 rounded-xl mb-6">
                  <button
                    onClick={() => setActiveTab("email")}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition duration-300 ${
                      activeTab === "email"
                        ? "bg-white text-[#1F75FE] shadow"
                        : "text-gray-500 dark:text-gray-400 hover:text-[#1F75FE]"
                    }`}
                  >
                    Email
                  </button>
                  <button
                    onClick={() => setActiveTab("phone")}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition duration-300 ${
                      activeTab === "phone"
                        ? "bg-white text-[#1F75FE] shadow"
                        : "text-gray-500 dark:text-gray-400 hover:text-[#1F75FE]"
                    }`}
                  >
                    Phone
                  </button>
                </div>

                {/* Active Tab Content */}
                <div className="min-h-[200px]">
                  {activeTab === "email" && (
                    <>
                      {verificationStep === "pending" ? (
                        // Verification Code Input
                        <motion.form
                          key="verify-form"
                          onSubmit={handleVerifyCode}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                          className="space-y-4"
                        >
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              A verification code has been sent to <strong>{email}</strong>
                            </p>
                          </div>

                          {verificationError && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-2"
                            >
                              <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-red-600 dark:text-red-400">{verificationError}</p>
                            </motion.div>
                          )}

                          <div className="relative">
                            <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Enter 6-digit code"
                              value={verificationCode}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setVerificationCode(val);
                              }}
                              maxLength="6"
                              className="w-full pl-12 pr-4 py-3 text-center text-2xl tracking-widest border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={loading || verificationCode.length !== 6}
                            className="w-full bg-[#1F75FE] hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition duration-300 shadow-lg disabled:opacity-50"
                          >
                            {loading ? "Verifying..." : "Verify Email"}
                          </button>

                          {IS_DEV && (
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                              <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                                <strong>DEV MODE:</strong> Click below to get the verification code
                              </p>
                              {debugCode ? (
                                <div className="bg-white dark:bg-[#252526] p-3 rounded border border-yellow-200 dark:border-yellow-800 text-center">
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Your Code:</p>
                                  <p className="text-2xl font-bold tracking-widest text-[#1F75FE] select-all">{debugCode}</p>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={fetchDebugCode}
                                  disabled={!email || debugLoading}
                                  className="w-full text-xs bg-yellow-100 dark:bg-yellow-900/40 hover:bg-yellow-200 dark:hover:bg-yellow-900/60 text-yellow-800 dark:text-yellow-300 py-2 rounded transition"
                                >
                                  {debugLoading ? "Fetching..." : "Get Code"}
                                </button>
                              )}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setVerificationStep(null);
                              setVerificationCode("");
                              setVerificationError(null);
                              setDebugCode(null);
                            }}
                            className="w-full text-center text-sm text-[#1F75FE] hover:underline"
                          >
                            Back to signup
                          </button>
                        </motion.form>
                      ) : (
                        // Signup Form
                        <motion.form
                          key="email-form"
                          onSubmit={handleSignup}
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

                      {/* Username Display */}
                      <div className="relative">
                        <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Username (for your profile)"
                          value={usernameDisplay}
                          onChange={(e) => setUsernameDisplay(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                          required
                        />
                      </div>

                      {/* Mobile Number */}
                      <div className="relative">
                        <Smartphone size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="tel"
                          placeholder="Mobile Number (e.g., +255..."
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                          required
                        />
                      </div>

                      {/* Country Selection */}
                      <div className="relative">
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full pl-4 pr-4 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition appearance-none"
                          required
                        >
                          <option value="">Select your country</option>
                          <option value="TZ">Tanzania</option>
                          <option value="KE">Kenya</option>
                          <option value="UG">Uganda</option>
                          <option value="BI">Burundi</option>
                          <option value="RW">Rwanda</option>
                          <option value="CD">DRC</option>
                          <option value="ZM">Zambia</option>
                        </select>
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

                      {password && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-[#3A3A3A] rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${passwordStrength.color}`}
                                style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                              {passwordStrength.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Use 8+ characters with uppercase, lowercase, numbers, and symbols
                          </p>
                        </div>
                      )}

                      <div className="relative">
                        <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-[#3A3A3A] rounded-xl dark:bg-[#252526] dark:text-white focus:ring-2 focus:ring-[#1F75FE] focus:border-transparent transition"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1F75FE]"
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>

                      {/* Terms & Conditions */}
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-[#252526] rounded-lg">
                        <input
                          type="checkbox"
                          id="terms"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="mt-1 w-5 h-5 rounded border-gray-300 text-[#1F75FE] cursor-pointer"
                          required
                        />
                        <label htmlFor="terms" className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
                          I agree to the{" "}
                          <a href="#" className="text-[#1F75FE] hover:underline font-semibold">
                            Terms of Service
                          </a>{" "}
                          and{" "}
                          <a href="#" className="text-[#1F75FE] hover:underline font-semibold">
                            Privacy Policy
                          </a>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !agreeTerms}
                        className="w-full bg-[#1F75FE] hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition duration-300 shadow-lg disabled:opacity-50"
                      >
                        {loading ? "Creating Account..." : "Create Account"}
                      </button>
                        </motion.form>
                      )}
                    </>
                  )}
                  {activeTab === "phone" && <PhoneSignup />}
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
                  Already have an account?{" "}
                  <a href="/login" className="text-[#1F75FE] hover:underline font-semibold">
                    Sign in now
                  </a>
                </motion.p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
