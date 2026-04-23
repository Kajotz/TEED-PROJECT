import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuthState } from "../../context/AuthStateContext";
import { resolvePostAuthRoute } from "../../routes/routeResolver";
import { apiPatch, AuthError } from "../../utils/api";
import { clearAuthTokens, getAccessToken } from "../../utils/auth";

import AuthLayout from "@/components/layouts/AuthLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/Input";
import Form, { FormActions } from "@/components/ui/Forms";

import "@/styles/global/GlobalUi.css";
import "@/styles/auth/CompleteAccountPage.css";

const FIELD_LABELS = {
  username: "Username",
  phone_number: "Mobile Number",
  country: "Country",
};

const COUNTRY_OPTIONS = [
  { value: "TZ", label: "Tanzania" },
  { value: "KE", label: "Kenya" },
  { value: "UG", label: "Uganda" },
  { value: "BI", label: "Burundi" },
  { value: "RW", label: "Rwanda" },
  { value: "CD", label: "DRC" },
  { value: "ZM", label: "Zambia" },
];

const COUNTRY_PHONE_PREFIX = {
  TZ: "+255",
  KE: "+254",
  UG: "+256",
  BI: "+257",
  RW: "+250",
  CD: "+243",
  ZM: "+260",
};

const FIELD_ORDER = ["username", "country", "phone_number"];

const pageAnimation = {
  initial: { opacity: 0, y: 16, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.35 },
};

const normalizeFieldErrors = (payload) => {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const next = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (key === "detail" || key === "post_auth" || key === "message") {
      return;
    }

    if (Array.isArray(value)) {
      next[key] = value[0];
      return;
    }

    if (typeof value === "string") {
      next[key] = value;
    }
  });

  return next;
};

const CompleteAccountPage = () => {
  const navigate = useNavigate();
  const {
    authState,
    authStateResolved,
    refreshAuthState,
    resetAuthState,
  } = useAuthState();

  const [formData, setFormData] = useState({
    username: "",
    phone_number: "",
    country: "",
  });

  const [completionState, setCompletionState] = useState(null);
  const [loadingState, setLoadingState] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recheckingAccess, setRecheckingAccess] = useState(false);

  const activeState = completionState || authState || {};

  const missingFields = useMemo(() => {
    return Array.isArray(activeState?.missing_fields)
      ? activeState.missing_fields
      : [];
  }, [activeState]);

  const visibleFields = useMemo(() => {
    const allowed = new Set(["username", "country", "phone_number"]);

    return FIELD_ORDER.filter(
      (field) => allowed.has(field) && missingFields.includes(field)
    );
  }, [missingFields]);

  const phonePlaceholder = useMemo(() => {
    const prefix = COUNTRY_PHONE_PREFIX[formData.country] || "+";
    return `${prefix} ...`;
  }, [formData.country]);

  const handleUnauthorized = useCallback(() => {
    clearAuthTokens();
    resetAuthState();
    navigate("/login", { replace: true });
  }, [navigate, resetAuthState]);

  const fetchCompletionState = useCallback(async () => {
    const token = getAccessToken();

    if (!token) {
      handleUnauthorized();
      return null;
    }

    const response = await fetch("/api/account/completion/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      throw new AuthError("Unauthorized");
    }

    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      const message =
        data?.detail || "Failed to load account completion state.";
      throw new Error(message);
    }

    return data;
  }, [handleUnauthorized]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setLoadingState(true);
        setSubmitError("");

        const state = await fetchCompletionState();
        if (!mounted || !state) return;

        setCompletionState(state);

        if (state.next_step !== "completion_gate") {
          navigate(resolvePostAuthRoute(state), { replace: true });
          return;
        }

        setFormData((prev) => ({
          ...prev,
          country:
            prev.country ||
            (Array.isArray(state.missing_fields) &&
            state.missing_fields.includes("country")
              ? ""
              : prev.country),
        }));
      } catch (error) {
        console.error("Failed to load completion state:", error);

        if (error instanceof AuthError) {
          handleUnauthorized();
          return;
        }

        if (mounted) {
          setSubmitError(
            error.message || "Failed to load account completion state."
          );
        }
      } finally {
        if (mounted) {
          setLoadingState(false);
        }
      }
    };

    if (authStateResolved) {
      run();
    }

    return () => {
      mounted = false;
    };
  }, [authStateResolved, fetchCompletionState, handleUnauthorized, navigate]);

  useEffect(() => {
    if (!authStateResolved || loadingState) return;

    if (
      completionState?.next_step &&
      completionState.next_step !== "completion_gate"
    ) {
      navigate(resolvePostAuthRoute(completionState), { replace: true });
    }
  }, [authStateResolved, completionState, loadingState, navigate]);

  const validate = () => {
    const nextErrors = {};

    if (missingFields.includes("username") && !formData.username.trim()) {
      nextErrors.username = "Username is required.";
    }

    if (missingFields.includes("country") && !formData.country.trim()) {
      nextErrors.country = "Country is required.";
    }

    if (missingFields.includes("phone_number") && !formData.phone_number.trim()) {
      nextErrors.phone_number = "Mobile number is required.";
    }

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);
    setSubmitError("");

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const payload = {};

    if (missingFields.includes("username") && formData.username.trim()) {
      payload.username = formData.username.trim();
    }

    if (missingFields.includes("country") && formData.country.trim()) {
      payload.country = formData.country.trim();
    }

    if (missingFields.includes("phone_number") && formData.phone_number.trim()) {
      payload.phone_number = formData.phone_number.trim();
    }

    try {
      setSubmitting(true);

      const response = await apiPatch("/api/account/completion/", payload);

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.status === 401) {
        throw new AuthError("Unauthorized");
      }

      if (!response.ok) {
        setErrors(normalizeFieldErrors(data));
        setSubmitError(data.detail || "Failed to complete account.");
        return;
      }

      const nextPostAuth = data?.post_auth || null;

      if (!nextPostAuth) {
        const freshState = await refreshAuthState();
        navigate(resolvePostAuthRoute(freshState), { replace: true });
        return;
      }

      setCompletionState(nextPostAuth);
      await refreshAuthState();
      navigate(resolvePostAuthRoute(nextPostAuth), { replace: true });
    } catch (error) {
      console.error("Account completion failed:", error);

      if (error instanceof AuthError) {
        handleUnauthorized();
        return;
      }

      setSubmitError("Something went wrong while completing your account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecheckAccess = async () => {
    try {
      setRecheckingAccess(true);
      setSubmitError("");

      const freshState = await refreshAuthState();
      navigate(resolvePostAuthRoute(freshState), { replace: true });
    } catch (error) {
      console.error("Manual re-check access failed:", error);
      setSubmitError("Failed to re-check account access.");
    } finally {
      setRecheckingAccess(false);
    }
  };

  const renderField = (field) => {
    if (!visibleFields.includes(field)) {
      return null;
    }

    if (field === "country") {
      return (
        <div className="space-y-2">
          <label
            htmlFor="country"
            className="text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Country *
          </label>

           <select
  id="country"
  name="country"
  value={formData.country}
  onChange={handleChange}
  disabled={submitting}
  className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-base text-gray-900 shadow-sm outline-none transition focus:border-[#1F75FE] focus:ring-4 focus:ring-[#1F75FE]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#111827] dark:text-gray-100 dark:[color-scheme:dark] dark:focus:border-[#1F75FE] dark:focus:ring-[#1F75FE]/20"
>
  <option value="" className="bg-white text-gray-900 dark:bg-[#111827] dark:text-gray-100">
    Select your country
  </option>
  {COUNTRY_OPTIONS.map((country) => (
    <option
      key={country.value}
      value={country.value}
      className="bg-white text-gray-900 dark:bg-[#111827] dark:text-gray-100"
    >
      {country.label}
    </option>
  ))}
</select>

          {errors.country && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.country}
            </p>
          )}
        </div>
      );
    }

    if (field === "phone_number") {
      return (
        <div className="space-y-2">
          <Input
            id="phone_number"
            name="phone_number"
            type="text"
            label="Mobile Number *"
            value={formData.phone_number}
            onChange={handleChange}
            disabled={submitting}
            placeholder={phonePlaceholder}
            size="lg"
          />

          {errors.phone_number && (
            <p className="text-sm text-red-600 dark:text-red-400 -mt-1">
              {errors.phone_number}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Input
          id={field}
          name={field}
          type="text"
          label={`${FIELD_LABELS[field]} *`}
          value={formData[field] || ""}
          onChange={handleChange}
          disabled={submitting}
          placeholder={`Enter your ${FIELD_LABELS[field].toLowerCase()}`}
          size="lg"
        />

        {errors[field] && (
          <p className="text-sm text-red-600 dark:text-red-400 -mt-1">
            {errors[field]}
          </p>
        )}
      </div>
    );
  };

  if (!authStateResolved || loadingState) {
    return (
      <AuthLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading account state...
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-6xl">
        <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_460px]">
          <motion.div
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35 }}
            className="hidden lg:flex lg:items-start"
          >
            <div className="complete-left">
              <h1 className="complete-title">
                Complete your setup and unlock your workspace.
              </h1>

              <div className="complete-features">
                <div className="complete-feature">
                  <div className="complete-dot" />
                  <div>
                    <h3 className="complete-feature-title">
                      Backend-controlled flow
                    </h3>
                    <p className="complete-feature-text">
                      This page only submits missing fields returned by backend.
                    </p>
                  </div>
                </div>

                <div className="complete-feature">
                  <div className="complete-dot" />
                  <div>
                    <h3 className="complete-feature-title">
                      No fake frontend logic
                    </h3>
                    <p className="complete-feature-text">
                      Routing continues strictly from post_auth.next_step.
                    </p>
                  </div>
                </div>

                <div className="complete-feature">
                  <div className="complete-dot" />
                  <div>
                    <h3 className="complete-feature-title">
                      Dynamic completion
                    </h3>
                    <p className="complete-feature-text">
                      Username, country, and phone are shown only when missing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div {...pageAnimation} className="w-full">
            <Card
              variant="soft"
              padding="lg"
              contentSpacing="lg"
              className="rounded-[30px] border border-white/80 bg-white/78 shadow-[0_24px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111827]/80 dark:shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
            >
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-gray-900 dark:text-gray-100">
                Complete account on{" "}
                <span className="text-[#1F75FE]">TEED</span>
                <span className="text-[#f2a705]">HUB</span>
              </h2>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Submit only the fields your backend says are still missing.
              </p>

              {submitError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      size={18}
                      className="text-red-600 dark:text-red-400"
                    />
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {submitError}
                    </p>
                  </div>
                </div>
              )}

              {visibleFields.length > 0 ? (
                <Form onSubmit={handleSubmit} spacing="md">
                  {visibleFields.map((field) => (
                    <div key={field}>{renderField(field)}</div>
                  ))}

                  <FormActions>
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      emphasis="strong"
                      fullWidth
                      loading={submitting}
                      className="!min-h-[52px] !rounded-2xl"
                      disabled={submitting}
                    >
                      {submitting ? "Saving..." : "Complete Account"}
                    </Button>
                  </FormActions>
                </Form>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    No completion fields are currently required.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  emphasis="medium"
                  fullWidth
                  onClick={handleRecheckAccess}
                  loading={recheckingAccess}
                  disabled={recheckingAccess}
                  className="recheck-btn"
                >
                  {recheckingAccess ? "Re-checking..." : "Re-check Access"}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default CompleteAccountPage;