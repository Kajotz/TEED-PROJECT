import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Smartphone } from "lucide-react";
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

const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "1031953814986-q100q02ju0nc6h0p550l3sdcqt0si5m6.apps.googleusercontent.com";

const IS_DEV =
  !import.meta.env.MODE || import.meta.env.MODE === "development";

const PHONE_SESSION_KEY = "phone_session";
const DEBUG_OTP_KEY = "debug_otp";
const GOOGLE_BUTTON_CONTAINER_ID = "google-button-container";
const GOOGLE_SDK_SCRIPT_ID = "google-identity-services";
const REMEMBER_ME_KEY = "teedhub_remember_me_email";

let googleSdkPromise = null;
let googleInitialized = false;

const clearPhoneAuthSession = () => {
  sessionStorage.removeItem(PHONE_SESSION_KEY);
  sessionStorage.removeItem(DEBUG_OTP_KEY);
};

const getErrorMessage = (data, fallback = "Request failed.") => {
  if (!data) return fallback;
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (data.detail) return data.detail;
  if (data.error) return data.error;
  if (data.email) return Array.isArray(data.email) ? data.email[0] : data.email;
  if (data.password) {
    return Array.isArray(data.password) ? data.password[0] : data.password;
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
          "Facebook popup login is blocked on insecure LAN HTTP pages. Use localhost or HTTPS for testing."
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

const useLoginNavigation = () => {
  const navigate = useNavigate();
  const { refreshAuthState, setAuthStateFromBackend } = useAuthState();

  const finalizeLogin = useCallback(
    async ({ access, refresh, post_auth }) => {
      if (!access || !refresh) {
        throw new Error("Login response did not include required tokens.");
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

  return { finalizeLogin };
};

const useAuthForm = () => {
  const navigate = useNavigate();
  const { finalizeLogin } = useLoginNavigation();
  const toast = useAppToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_ME_KEY);

    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await postJson(`${BACKEND_URL}/api/auth/token/`, {
        email,
        password,
      });

      if (rememberMe && email.trim()) {
        localStorage.setItem(REMEMBER_ME_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }

      toast.success("Login successful. Redirecting...");
      await finalizeLogin(data);
    } catch (err) {
      console.error(err);

      const nextStep = err?.payload?.next_step;
      const errorCode = err?.payload?.error;

      if (nextStep === "verify_email" || errorCode === "Email not verified") {
        toast.warning("Your email is not verified yet. Finish signup first.");
        navigate("/signup", {
          replace: true,
          state: {
            email,
            reason: "verify_email",
          },
        });
        return;
      }

      toast.error(err.message || "Login failed. Please try again.");
    } finally {
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
    rememberMe,
    setRememberMe,
    loading,
    handleEmailPasswordLogin,
  };
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

function DevOTPPreview({ debugOtp }) {
  if (!IS_DEV || !debugOtp) return null;

  return (
    <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
      <p className="mb-2 text-xs font-semibold text-yellow-800">DEV OTP</p>
      <div className="rounded-xl border border-yellow-200 bg-white p-3 text-center">
        <p className="mb-1 text-xs text-gray-500">Use this verification code</p>
        <p className="select-all text-2xl font-bold tracking-[0.35em] text-[#1F75FE]">
          {debugOtp}
        </p>
      </div>
    </div>
  );
}

function EmailLogin({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  rememberMe,
  setRememberMe,
  loading,
  handleEmailPasswordLogin,
}) {
  return (
    <motion.div key="email-form" {...tabAnimation}>
      <Form onSubmit={handleEmailPasswordLogin} spacing="md">
        <Input
          id="login-email"
          type="email"
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          size="lg"
          wrapperClassName="login-input-field"
          className="login-input"
        />

        <Input
          id="login-password"
          type={showPassword ? "text" : "password"}
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          rightIcon={
            <PasswordToggleButton
              show={showPassword}
              onClick={() => setShowPassword(!showPassword)}
            />
          }
          size="lg"
          wrapperClassName="login-input-field"
          className="login-input"
        />

        <FormMeta>
          <div className="login-meta-left">
            <label className="login-checkbox-label" htmlFor="login-remember-me">
              <input
                id="login-remember-me"
                type="checkbox"
                className="login-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="login-checkbox-text min-w-0">Remember me</span>
            </label>
          </div>

          <Link to="/recover" className="login-link">
            Forgot password?
          </Link>
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
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </FormActions>
      </Form>
    </motion.div>
  );
}

function PhoneLogin() {
  const { finalizeLogin } = useLoginNavigation();
  const toast = useAppToast();

  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [debugOtp, setDebugOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDebugOtp(sessionStorage.getItem(DEBUG_OTP_KEY) || "");
  }, []);

  const handleSendOTP = async () => {
    setLoading(true);

    try {
      clearPhoneAuthSession();

      const data = await postJson(`${BACKEND_URL}/api/auth/phone/login/`, {
        phone,
      });

      sessionStorage.setItem(PHONE_SESSION_KEY, data.session_id);

      if (data.debug_otp) {
        sessionStorage.setItem(DEBUG_OTP_KEY, data.debug_otp);
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
    setLoading(true);

    try {
      const sessionId = sessionStorage.getItem(PHONE_SESSION_KEY);

      const data = await postJson(`${BACKEND_URL}/api/auth/phone/verify/`, {
        session_id: sessionId,
        otp,
      });

      clearPhoneAuthSession();
      toast.success("Phone verified. Redirecting...");
      await finalizeLogin(data);
    } catch (err) {
      console.error("OTP verify error:", err);
      toast.error(err.message || "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPhoneFlow = () => {
    clearPhoneAuthSession();
    setOtpSent(false);
    setOtp("");
    setDebugOtp("");
  };

  return (
    <motion.div key="phone-form" {...tabAnimation}>
      {!otpSent ? (
        <Form as="div" spacing="md">
          <Input
            id="login-phone"
            type="tel"
            label="Phone number"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            size="lg"
            wrapperClassName="login-input-field"
            className="login-input"
          />

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
              disabled={phone.trim().length < 10 || loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </Button>
          </FormActions>
        </Form>
      ) : (
        <Form as="div" spacing="md">
          <Input
            id="login-otp"
            type="text"
            label="Verification code"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength="6"
            size="lg"
            wrapperClassName="login-input-field"
            className="login-input"
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
              disabled={otp.length !== 6 || loading}
            >
              {loading ? "Verifying..." : "Verify & Sign In"}
            </Button>

            <button
              type="button"
              onClick={handleResetPhoneFlow}
              className="login-secondary-text-button"
            >
              Use a different phone number
            </button>
          </FormActions>
        </Form>
      )}
    </motion.div>
  );
}

function SocialActionRow({
  activeMethod,
  onSelectPhone,
  onSelectEmail,
  onFacebookLogin,
  facebookLoading,
}) {
  return (
    <div className="login-social-stack">
      <div id={GOOGLE_BUTTON_CONTAINER_ID} className="login-google-container" />

      <div className="login-social-row">
        <button
          type="button"
          onClick={onFacebookLogin}
          disabled={facebookLoading}
          className="login-social-chip login-social-chip--facebook"
        >
          <FacebookIcon className="login-facebook-icon" />
          <span>{facebookLoading ? "Connecting..." : "Facebook"}</span>
        </button>

        <button
          type="button"
          onClick={activeMethod === "phone" ? onSelectEmail : onSelectPhone}
          className={`login-social-chip ${
            activeMethod === "phone" ? "is-active" : ""
          }`}
        >
          <Smartphone size={16} />
          <span>{activeMethod === "phone" ? "Back to Email" : "Phone number"}</span>
        </button>
      </div>
    </div>
  );
}

export default function Login() {
  const { finalizeLogin } = useLoginNavigation();
  const toast = useAppToast();
  const { darkMode } = useTheme();

  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMe,
    loading,
    handleEmailPasswordLogin,
  } = useAuthForm();

  const googleHandlerRef = useRef(null);
  const [activeMethod, setActiveMethod] = useState("email");
  const [facebookLoading, setFacebookLoading] = useState(false);

  const handleFacebookLogin = useCallback(async () => {
    setFacebookLoading(true);

    try {
      const FB = await loadFacebookSDK();

      FB.login(
        function (response) {
          (async () => {
            try {
              if (!response?.authResponse?.accessToken) {
                throw new Error("Facebook login was cancelled or failed.");
              }

              const accessToken = response.authResponse.accessToken;

              const data = await postJson(`${BACKEND_URL}/api/auth/facebook/`, {
                access_token: accessToken,
              });

              toast.success("Facebook login successful. Redirecting...");
              await finalizeLogin(data);
            } catch (err) {
              console.error("Facebook auth error:", err);
              toast.error(err.message || "Facebook login failed.");
            } finally {
              setFacebookLoading(false);
            }
          })();
        },
        { scope: "public_profile" }
      );
    } catch (err) {
      console.error("Facebook SDK error:", err);
      toast.error(err.message || "Failed to load Facebook login.");
      setFacebookLoading(false);
    }
  }, [finalizeLogin, toast]);

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

        toast.success("Google login successful. Redirecting...");
        await finalizeLogin(data);
      } catch (err) {
        console.error("Google auth error:", err);
        toast.error(err.message || "Google login failed.");
      }
    },
    [finalizeLogin, toast]
  );

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
        toast.warning(err.message || "Failed to initialize Google sign-in.");
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
      clearPhoneAuthSession();

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
              <span className="login-hero__eyebrow">Welcome back</span>
              <h1 className="login-hero__title">
                Sign in and continue building.
              </h1>
              <p className="login-hero__text">
                Keep your flow clean. Get into your workspace without noise.
              </p>
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
                  Sign in to <span className="login-brand-main">TEED</span>
                  <span className="login-brand-accent">HUB</span>
                </h2>
                <p className="login-card__subtitle">
                  Use your account and get back to work.
                </p>
              </div>

              <div className="login-form-stage">
                <AnimatePresence mode="wait">
                  {activeMethod === "email" ? (
                    <EmailLogin
                      email={email}
                      setEmail={setEmail}
                      password={password}
                      setPassword={setPassword}
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                      rememberMe={rememberMe}
                      setRememberMe={setRememberMe}
                      loading={loading}
                      handleEmailPasswordLogin={handleEmailPasswordLogin}
                    />
                  ) : (
                    <PhoneLogin />
                  )}
                </AnimatePresence>
              </div>

              <SocialActionRow
                activeMethod={activeMethod}
                onSelectPhone={() => setActiveMethod("phone")}
                onSelectEmail={() => setActiveMethod("email")}
                onFacebookLogin={handleFacebookLogin}
                facebookLoading={facebookLoading}
              />

              <p className="login-footer-text">
                Don&apos;t have an account?{" "}
                <Link to="/signup" className="login-link login-link--strong">
                  Create one
                </Link>
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </AuthLayout>
  );
}