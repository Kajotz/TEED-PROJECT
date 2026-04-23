import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Smartphone, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "@/components/layouts/AuthLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/Input";
import Form, { FormActions, FormMeta } from "@/components/ui/Forms";

import { API_BASE_URL } from "@/utils/constants";
import { setAuthTokens } from "@/utils/auth";
import { useAuthState } from "@/context/AuthStateContext";
import { useAppToast } from "@/components/ui/toast/AppToastProvider";
import { resolvePostAuthRoute } from "@/routes/routeResolver";
import { useTheme } from "@/components/ui/theme/ThemeProvider";

import "@/styles/auth/Login.css";
import "@/styles/global/GlobalUi.css";

const BACKEND_URL = API_BASE_URL.endsWith("/api")
  ? API_BASE_URL.slice(0, -4)
  : API_BASE_URL;

const IS_DEV =
  !import.meta.env.MODE || import.meta.env.MODE === "development";

const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "1031953814986-q100q02ju0nc6h0p550l3sdcqt0si5m6.apps.googleusercontent.com";

const PHONE_SIGNUP_SESSION_KEY = "phone_signup_session";
const PHONE_SIGNUP_DEBUG_OTP_KEY = "phone_signup_debug_otp";
const GOOGLE_BUTTON_CONTAINER_ID = "signup-google-button-container";
const GOOGLE_SDK_SCRIPT_ID = "google-identity-services";

let googleSdkPromise = null;
let googleInitialized = false;

const clearPhoneSignupSession = () => {
  sessionStorage.removeItem(PHONE_SIGNUP_SESSION_KEY);
  sessionStorage.removeItem(PHONE_SIGNUP_DEBUG_OTP_KEY);
};

const getErrorMessage = (data, fallback = "Request failed.") => {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (data.detail) return data.detail;
  if (data.error) return data.error;

  if (data.email) {
    return Array.isArray(data.email) ? data.email[0] : data.email;
  }

  if (data.password1) {
    return Array.isArray(data.password1) ? data.password1[0] : data.password1;
  }

  if (data.password2) {
    return Array.isArray(data.password2) ? data.password2[0] : data.password2;
  }

  if (data.phone) {
    return Array.isArray(data.phone) ? data.phone[0] : data.phone;
  }

  if (data.otp) {
    return Array.isArray(data.otp) ? data.otp[0] : data.otp;
  }

  if (data.verification_code) {
    return Array.isArray(data.verification_code)
      ? data.verification_code[0]
      : data.verification_code;
  }

  return fallback;
};

const postJson = async (url, payload) => {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const error = new Error(getErrorMessage(data, "Request failed."));
    error.payload = data;
    throw error;
  }

  return data;
};

const loadGoogleSDK = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }

  if (googleSdkPromise) {
    return googleSdkPromise;
  }

  googleSdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SDK_SCRIPT_ID);

    if (existingScript) {
      const startedAt = Date.now();

      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkGoogle);
          resolve(window.google);
          return;
        }

        if (Date.now() - startedAt > 10000) {
          clearInterval(checkGoogle);
          reject(new Error("Google SDK failed to initialize."));
        }
      }, 100);

      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SDK_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google);
      } else {
        reject(new Error("Google SDK loaded but API is unavailable."));
      }
    };

    script.onerror = () => {
      reject(new Error("Failed to load Google SDK."));
    };

    document.head.appendChild(script);
  });

  return googleSdkPromise;
};

const getGoogleButtonWidth = (container) => {
  const rawWidth = Math.floor(container?.offsetWidth || 0);

  if (!rawWidth || Number.isNaN(rawWidth)) {
    return 320;
  }

  return Math.max(220, Math.min(rawWidth, 420));
};

const renderGoogleButton = ({ darkMode = false }) => {
  const container = document.getElementById(GOOGLE_BUTTON_CONTAINER_ID);

  if (!container || !window.google?.accounts?.id) {
    return;
  }

  container.innerHTML = "";

  window.google.accounts.id.renderButton(container, {
    theme: darkMode ? "filled_black" : "outline",
    size: "medium",
    text: "continue_with",
    shape: "pill",
    width: getGoogleButtonWidth(container),
  });
};

const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path
      fill="currentColor"
      d="M12 2C6.477 2 2 6.477 2 12c0 5.084 3.791 9.36 8.75 9.923v-7.013H8.38v-2.91h2.37V9.75c0-2.348 1.433-3.636 3.523-3.636 1.002 0 1.956.074 2.223.107v2.54h-1.506c-1.118 0-1.336.531-1.336 1.312V12h2.813l-.454 2.91h-2.358v7.013C18.209 21.36 22 17.084 22 12c0-5.523-4.477-10-10-10z"
    />
  </svg>
);

const tabAnimation = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};

const isSecureFacebookOrigin = () => {
  const { protocol, hostname } = window.location;

  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1";

  return protocol === "https:" || isLocalhost;
};

const loadFacebookSDK = () =>
  new Promise((resolve, reject) => {
    if (!FACEBOOK_APP_ID) {
      reject(new Error("Missing VITE_FACEBOOK_APP_ID in .env"));
      return;
    }

    if (!isSecureFacebookOrigin()) {
      reject(
        new Error(
          "Facebook popup signup is blocked on insecure LAN HTTP pages. Use localhost or HTTPS for testing."
        )
      );
      return;
    }

    if (window.FB) {
      resolve(window.FB);
      return;
    }

    const existingScript = document.getElementById("facebook-jssdk");

    if (existingScript) {
      const startedAt = Date.now();

      const checkFB = setInterval(() => {
        if (window.FB) {
          clearInterval(checkFB);
          resolve(window.FB);
          return;
        }

        if (Date.now() - startedAt > 10000) {
          clearInterval(checkFB);
          reject(new Error("Facebook SDK failed to initialize."));
        }
      }, 100);

      return;
    }

    window.fbAsyncInit = function () {
      try {
        window.FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: false,
          version: "v19.0",
        });

        resolve(window.FB);
      } catch {
        reject(new Error("Failed to initialize Facebook SDK."));
      }
    };

    const js = document.createElement("script");
    js.id = "facebook-jssdk";
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    js.async = true;
    js.defer = true;
    js.onerror = () =>
      reject(new Error("Failed to load Facebook SDK script."));

    document.body.appendChild(js);
  });

const getPasswordStrength = (password) => {
  if (!password) {
    return {
      strength: 0,
      label: "",
      color: "bg-gray-300",
    };
  }

  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const labels = ["Weak", "Fair", "Good", "Strong", "Very Strong"];
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
    "bg-green-600",
  ];

  return {
    strength,
    label: labels[strength] || "Weak",
    color: colors[strength] || "bg-red-500",
  };
};

const normalizeEmail = (value) => (value || "").trim().toLowerCase();
const normalizePhone = (value) => (value || "").replace(/\D/g, "");
const normalizeOtp = (value) => (value || "").replace(/\D/g, "").slice(0, 6);

const useSignupNavigation = () => {
  const navigate = useNavigate();
  const { refreshAuthState, setAuthStateFromBackend } = useAuthState();

  const finalizeSignup = useCallback(
    async ({ access, refresh, post_auth }) => {
      if (!access || !refresh) {
        throw new Error("Signup response did not include required tokens.");
      }

      setAuthTokens({ access, refresh });

      let finalAuthState = null;

      if (post_auth) {
        finalAuthState = setAuthStateFromBackend(post_auth);
      } else {
        finalAuthState = await refreshAuthState();
      }

      navigate(resolvePostAuthRoute(finalAuthState), { replace: true });
    },
    [navigate, refreshAuthState, setAuthStateFromBackend]
  );

  return { finalizeSignup };
};

function PasswordToggleButton({ show, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="login-password-toggle"
      aria-label={show ? "Hide password" : "Show password"}
    >
      {show ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
}

function PasswordStrength({ password }) {
  if (!password) return null;

  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
          <div
            className={`h-full transition-all ${passwordStrength.color}`}
            style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">
          {passwordStrength.label}
        </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-slate-400">
        Use 8+ characters with uppercase, lowercase, numbers, and symbols.
      </p>
    </div>
  );
}

function VerificationNotice({ email }) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-center dark:border-blue-500/30 dark:bg-blue-500/10">
      <p className="text-sm text-blue-700 dark:text-blue-300">
        A verification code has been sent to <strong>{email}</strong>
      </p>
    </div>
  );
}

function DevCodePreview({ label, code }) {
  return (
    <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-700/40 dark:bg-yellow-500/10">
      <p className="mb-2 text-xs font-semibold text-yellow-800 dark:text-yellow-300">
        DEV MODE
      </p>
      <div className="rounded-xl border border-yellow-200 bg-white p-3 text-center dark:border-yellow-700/40 dark:bg-slate-900/70">
        <p className="mb-1 text-xs text-gray-500 dark:text-slate-400">
          {label}
        </p>
        <p className="select-all text-2xl font-bold tracking-[0.35em] text-[#1F75FE]">
          {code}
        </p>
      </div>
    </div>
  );
}

function DevOTPPreview({ debugOtp }) {
  if (!IS_DEV || !debugOtp) return null;

  return <DevCodePreview label="Your OTP:" code={debugOtp} />;
}

function EmailSignup({
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  agreeTerms,
  setAgreeTerms,
  loading,
  verificationStep,
  verificationCode,
  setVerificationCode,
  debugCode,
  handleSignup,
  handleVerifyCode,
  resetVerificationStep,
  onSwitchToPhone,
  onFacebookSignup,
  facebookLoading,
}) {
  return (
    <motion.div
      key={verificationStep === "pending" ? "verify-form" : "email-form"}
      {...tabAnimation}
    >
      {verificationStep === "pending" ? (
        <Form onSubmit={handleVerifyCode} spacing="md">
          <VerificationNotice email={email} />

          <Input
            id="signup-verification-code"
            type="text"
            label="Verification code"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(normalizeOtp(e.target.value))}
            maxLength="6"
            size="lg"
            wrapperClassName="login-input-field"
            className="login-input text-center tracking-[0.35em]"
          />

          {IS_DEV && debugCode ? (
            <DevCodePreview label="Your Code:" code={debugCode} />
          ) : null}

          <FormActions>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              emphasis="strong"
              fullWidth
              loading={loading}
              className="login-submit-button"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify Email"}
            </Button>

            <button
              type="button"
              onClick={resetVerificationStep}
              className="login-secondary-text-button"
            >
              Back to signup
            </button>
          </FormActions>
        </Form>
      ) : (
        <>
          <Form onSubmit={handleSignup} spacing="md">
            <Input
              id="signup-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              size="lg"
              wrapperClassName="login-input-field"
              className="login-input"
            />

            <Input
              id="signup-password"
              type={showPassword.password ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightIcon={
                <PasswordToggleButton
                  show={showPassword.password}
                  onClick={() =>
                    setShowPassword((prev) => ({
                      ...prev,
                      password: !prev.password,
                    }))
                  }
                />
              }
              size="lg"
              wrapperClassName="login-input-field"
              className="login-input"
            />

            <PasswordStrength password={password} />

            <Input
              id="signup-confirm-password"
              type={showPassword.confirm ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              rightIcon={
                <PasswordToggleButton
                  show={showPassword.confirm}
                  onClick={() =>
                    setShowPassword((prev) => ({
                      ...prev,
                      confirm: !prev.confirm,
                    }))
                  }
                />
              }
              size="lg"
              wrapperClassName="login-input-field"
              className="login-input"
            />

            <FormMeta>
              <div className="login-meta-left">
                <label
                  className="login-checkbox-label"
                  htmlFor="signup-agree-terms"
                >
                  <input
                    id="signup-agree-terms"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="login-checkbox"
                  />
                  <span className="login-checkbox-text min-w-0">
                    I agree to the{" "}
                    <span className="login-link no-underline">Terms</span> and{" "}
                    <span className="login-link no-underline">
                      Privacy Policy
                    </span>
                  </span>
                </label>
              </div>
            </FormMeta>

            <FormActions>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                emphasis="strong"
                fullWidth
                loading={loading}
                className="login-submit-button"
                disabled={loading || !agreeTerms}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </FormActions>
          </Form>

          <div className="login-social-stack">
            <div
              id={GOOGLE_BUTTON_CONTAINER_ID}
              className="login-google-container"
            />

            <div className="login-social-row">
              <button
                type="button"
                className="login-social-chip login-social-chip--facebook"
                onClick={onFacebookSignup}
                disabled={facebookLoading}
              >
                <FacebookIcon className="login-facebook-icon" />
                <span>{facebookLoading ? "Connecting..." : "Facebook"}</span>
              </button>

              <button
                type="button"
                className="login-social-chip"
                onClick={onSwitchToPhone}
              >
                <Smartphone size={16} />
                <span>Phone number</span>
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

function PhoneSignup({ onBackToEmail }) {
  const { finalizeSignup } = useSignupNavigation();
  const toast = useAppToast();

  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [debugOtp, setDebugOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDebugOtp(sessionStorage.getItem(PHONE_SIGNUP_DEBUG_OTP_KEY) || "");

    return () => {
      clearPhoneSignupSession();
    };
  }, []);

  const handleSendOTP = async () => {
    const cleanedPhone = normalizePhone(phone);

    if (!cleanedPhone) {
      toast.error("Phone number is required.");
      return;
    }

    setLoading(true);

    try {
      clearPhoneSignupSession();

      const data = await postJson(`${BACKEND_URL}/api/auth/phone/signup/`, {
        phone: cleanedPhone,
      });

      if (!data.session_id) {
        throw new Error("Phone signup session was not returned.");
      }

      sessionStorage.setItem(PHONE_SIGNUP_SESSION_KEY, data.session_id);

      if (data.debug_otp) {
        sessionStorage.setItem(PHONE_SIGNUP_DEBUG_OTP_KEY, data.debug_otp);
        setDebugOtp(data.debug_otp);
      } else {
        setDebugOtp("");
      }

      setOtpSent(true);
      toast.success("OTP sent successfully.");
    } catch (err) {
      toast.error(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const cleanOtp = normalizeOtp(otp);

    if (cleanOtp.length !== 6) {
      toast.error("Enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const sessionId = sessionStorage.getItem(PHONE_SIGNUP_SESSION_KEY);

      if (!sessionId) {
        throw new Error("Phone signup session expired. Request a new OTP.");
      }

      const data = await postJson(
        `${BACKEND_URL}/api/auth/phone/signup/verify/`,
        {
          session_id: sessionId,
          otp: cleanOtp,
        }
      );

      clearPhoneSignupSession();
      toast.success("Account created successfully. Redirecting...");
      await finalizeSignup(data);
    } catch (err) {
      toast.error(err.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPhoneFlow = () => {
    clearPhoneSignupSession();
    setOtpSent(false);
    setOtp("");
    setDebugOtp("");
  };

  return (
    <motion.div key="phone-form" {...tabAnimation}>
      {!otpSent ? (
        <Form as="div" spacing="md">
          <Input
            id="signup-phone"
            type="tel"
            label="Phone number"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            size="lg"
            wrapperClassName="login-input-field"
            className="login-input"
          />

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-center dark:border-blue-500/30 dark:bg-blue-500/10">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Phone signup is OTP only. No password is created at this step.
            </p>
          </div>

          <FormActions>
            <Button
              type="button"
              variant="accent"
              size="lg"
              emphasis="strong"
              fullWidth
              loading={loading}
              className="login-submit-button"
              onClick={handleSendOTP}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </Button>

            <button
              type="button"
              onClick={onBackToEmail}
              className="login-secondary-text-button"
            >
              Back to email signup
            </button>
          </FormActions>
        </Form>
      ) : (
        <Form as="div" spacing="md">
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-center dark:border-blue-500/30 dark:bg-blue-500/10">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Enter the OTP sent to <strong>{phone}</strong>
            </p>
          </div>

          <Input
            id="signup-phone-otp"
            type="text"
            label="OTP"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(normalizeOtp(e.target.value))}
            maxLength="6"
            size="lg"
            wrapperClassName="login-input-field"
            className="login-input text-center tracking-[0.35em]"
          />

          <DevOTPPreview debugOtp={debugOtp} />

          <FormActions>
            <Button
              type="button"
              variant="primary"
              size="lg"
              emphasis="strong"
              fullWidth
              loading={loading}
              className="login-submit-button"
              onClick={handleVerifyOTP}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>

            <button
              type="button"
              onClick={handleResetPhoneFlow}
              className="login-secondary-text-button"
            >
              Back to phone entry
            </button>
          </FormActions>
        </Form>
      )}
    </motion.div>
  );
}

export default function Signup() {
  const toast = useAppToast();
  const { finalizeSignup } = useSignupNavigation();
  const { darkMode } = useTheme();

  const googleHandlerRef = useRef(null);

  const [activeMethod, setActiveMethod] = useState("email");
  const [facebookLoading, setFacebookLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm: false,
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [debugCode, setDebugCode] = useState(null);

  const resetVerificationStep = () => {
    setVerificationStep(null);
    setVerificationCode("");
    setDebugCode(null);
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !password || !confirmPassword) {
      toast.error("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (!agreeTerms) {
      toast.error("You must agree to the Terms of Service.");
      return;
    }

    setLoading(true);

    try {
      const verificationData = await postJson(`${BACKEND_URL}/api/auth/register/`, {
        email: cleanEmail,
        password1: password,
        password2: confirmPassword,
      });

      setEmail(cleanEmail);
      setVerificationStep("pending");
      setDebugCode(verificationData.dev_code || null);

      toast.info("Verification code sent to your email.");
    } catch (err) {
      console.error("Signup error:", err);
      toast.error(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    const cleanCode = normalizeOtp(verificationCode);
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail) {
      toast.error("Email is required.");
      return;
    }

    if (cleanCode.length !== 6) {
      toast.error("Verification code must be 6 digits.");
      return;
    }

    setLoading(true);

    try {
      const data = await postJson(`${BACKEND_URL}/api/auth/register/`, {
        email: cleanEmail,
        password1: password,
        password2: confirmPassword,
        verification_code: cleanCode,
      });

      toast.success("Email verified successfully. Redirecting...");
      await finalizeSignup(data);
    } catch (err) {
      console.error("Verification error:", err);
      toast.error(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = useCallback(
    async (response) => {
      try {
        const googleToken = response?.credential;

        if (!googleToken) {
          throw new Error("No credential received from Google.");
        }

        const data = await postJson(`${BACKEND_URL}/api/auth/google/`, {
          token: googleToken,
        });

        toast.success("Google sign-up successful. Redirecting...");
        await finalizeSignup(data);
      } catch (err) {
        console.error("Google auth error:", err);
        toast.error(err.message || "Google sign-up failed.");
      }
    },
    [finalizeSignup, toast]
  );

  const handleFacebookSignup = useCallback(async () => {
    setFacebookLoading(true);

    try {
      const FB = await loadFacebookSDK();

      await new Promise((resolve, reject) => {
        FB.login(
          async (response) => {
            try {
              if (!response?.authResponse?.accessToken) {
                reject(new Error("Facebook login was cancelled or failed."));
                return;
              }

              const data = await postJson(`${BACKEND_URL}/api/auth/facebook/`, {
                access_token: response.authResponse.accessToken,
              });

              toast.success("Facebook sign-up successful. Redirecting...");
              await finalizeSignup(data);
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          { scope: "public_profile,email" }
        );
      });
    } catch (err) {
      console.error("Facebook auth error:", err);
      toast.error(err.message || "Facebook sign-up failed.");
    } finally {
      setFacebookLoading(false);
    }
  }, [finalizeSignup, toast]);

  useEffect(() => {
    googleHandlerRef.current = handleGoogleSuccess;
  }, [handleGoogleSuccess]);

  useEffect(() => {
    let cancelled = false;

    const setupGoogle = async () => {
      if (!GOOGLE_CLIENT_ID) {
        toast.warning("Missing VITE_GOOGLE_CLIENT_ID in environment.");
        return;
      }

      try {
        await loadGoogleSDK();

        if (cancelled || !window.google?.accounts?.id) {
          return;
        }

        if (!googleInitialized) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response) => {
              const handler = googleHandlerRef.current;
              if (typeof handler === "function") {
                handler(response);
              }
            },
          });

          googleInitialized = true;
        }

        renderGoogleButton({ darkMode });
      } catch (err) {
        console.error("Failed to initialize Google Auth:", err);
        toast.warning(err.message || "Failed to initialize Google sign-up.");
      }
    };

    setupGoogle();

    return () => {
      cancelled = true;
    };
  }, [darkMode, toast]);

  useEffect(() => {
    const rerenderGoogleButton = () => {
      if (window.google?.accounts?.id) {
        renderGoogleButton({ darkMode });
      }
    };

    window.addEventListener("resize", rerenderGoogleButton);

    return () => {
      window.removeEventListener("resize", rerenderGoogleButton);
    };
  }, [darkMode]);

  useEffect(() => {
    return () => {
      clearPhoneSignupSession();

      const container = document.getElementById(GOOGLE_BUTTON_CONTAINER_ID);
      if (container) {
        container.innerHTML = "";
      }
    };
  }, []);

  return (
    <AuthLayout>
      <div className="login-page">
        <div className="login-shell">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="login-hero"
          >
            <div className="login-hero__content">
              <span className="login-hero__eyebrow">Start now</span>

              <div className="mt-2 space-y-4">
                <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-slate-300">
                  <CheckCircle
                    size={18}
                    className="mt-0.5 flex-shrink-0 text-green-500"
                  />
                  <p>Use email, Google, Facebook, or phone without breaking flow.</p>
                </div>

                <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-slate-300">
                  <CheckCircle
                    size={18}
                    className="mt-0.5 flex-shrink-0 text-green-500"
                  />
                  <p>Verification and routing stay grounded in backend state.</p>
                </div>

                <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-slate-300">
                  <CheckCircle
                    size={18}
                    className="mt-0.5 flex-shrink-0 text-green-500"
                  />
                  <p>Missing profile fields can be completed after account access.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="login-panel"
          >
            <Card
              variant="soft"
              padding="lg"
              contentSpacing="lg"
              className="login-card"
            >
              <div className="login-card__header">
                <h2 className="login-card__title">
                  Create account on <span className="login-brand-main">TEED</span>
                  <span className="login-brand-accent">HUB</span>
                </h2>
              </div>

              <div className="login-form-stage">
                <AnimatePresence mode="wait">
                  {activeMethod === "email" ? (
                    <EmailSignup
                      email={email}
                      setEmail={setEmail}
                      password={password}
                      setPassword={setPassword}
                      confirmPassword={confirmPassword}
                      setConfirmPassword={setConfirmPassword}
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                      agreeTerms={agreeTerms}
                      setAgreeTerms={setAgreeTerms}
                      loading={loading}
                      verificationStep={verificationStep}
                      verificationCode={verificationCode}
                      setVerificationCode={setVerificationCode}
                      debugCode={debugCode}
                      handleSignup={handleSignup}
                      handleVerifyCode={handleVerifyCode}
                      resetVerificationStep={resetVerificationStep}
                      onSwitchToPhone={() => setActiveMethod("phone")}
                      onFacebookSignup={handleFacebookSignup}
                      facebookLoading={facebookLoading}
                    />
                  ) : (
                    <PhoneSignup onBackToEmail={() => setActiveMethod("email")} />
                  )}
                </AnimatePresence>
              </div>

              <p className="login-footer-text">
                Already have an account?{" "}
                <Link to="/login" className="login-link login-link--strong">
                  Sign in
                </Link>
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </AuthLayout>
  );
}