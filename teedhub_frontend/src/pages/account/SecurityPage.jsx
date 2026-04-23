import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  Settings,
  ShieldCheck,
  Smartphone,
  UserCircle2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Card, { CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/Input";
import Form, {
  FormActions,
  FormRow,
  FormSection,
} from "@/components/ui/Forms";
import TooltipPortal from "@/components/ui/tooltip/TooltipPortal";
import { useAppToast } from "@/components/ui/toast/AppToastProvider";
import { clearAuthTokens, getAccessToken } from "@/utils/auth";

import "@/styles/global/GlobalUi.css";
import "@/styles/global/PopUpMenu.css";

function OverviewStatusPill({ title, value, icon: Icon, tone = "blue" }) {
  return (
    <div className={`overview-status-pill overview-status-pill-${tone}`}>
      <div className="overview-status-pill-icon">
        <Icon size={14} strokeWidth={2.1} />
      </div>

      <div className="overview-status-pill-body">
        <span className="overview-status-pill-label">{title}</span>
        <span className="overview-status-pill-value">{value}</span>
      </div>
    </div>
  );
}

function NavigationCard({
  icon: Icon,
  title,
  description,
  meta,
  onClick,
  disabled = false,
  index = 0,
}) {
  return (
    <motion.button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`overview-nav-card ${disabled ? "is-disabled" : ""}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05 }}
      whileHover={
        disabled
          ? undefined
          : {
              y: -3,
              scale: 1.01,
              transition: { duration: 0.18 },
            }
      }
      whileTap={disabled ? undefined : { scale: 0.995 }}
    >
      <div className="overview-nav-card-main">
        <div className="overview-nav-card-top">
          <div className="overview-nav-card-icon">
            <Icon size={18} strokeWidth={2} />
          </div>

          <div className="overview-nav-card-arrow">
            {!disabled ? <ChevronRight size={16} strokeWidth={2} /> : null}
          </div>
        </div>

        <div className="overview-nav-card-body">
          <h3 className="overview-nav-card-title">{title}</h3>
          <p className="overview-nav-card-text">{description}</p>
        </div>
      </div>

      {meta ? <div className="overview-nav-card-meta">{meta}</div> : null}
    </motion.button>
  );
}

function SummaryRow({ label, value, verified = null }) {
  return (
    <div className="overview-checklist-row">
      <div className="overview-checklist-left">
        <div
          className={`overview-checklist-mark ${
            verified === true ? "done" : ""
          }`}
        >
          {verified === true ? (
            <CheckCircle2 size={14} strokeWidth={2.4} />
          ) : (
            <UserCircle2 size={14} strokeWidth={2.2} />
          )}
        </div>

        <span className="overview-checklist-label">{label}</span>
      </div>

      <div className="flex items-center gap-2 min-w-0">
        <span className="overview-checklist-label truncate max-w-[180px] sm:max-w-[220px] text-right">
          {value || "—"}
        </span>

        {verified !== null ? (
          <span
            className={`overview-checklist-badge ${
              verified ? "is-done" : "is-pending"
            }`}
          >
            {verified ? "Verified" : "Pending"}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function SecurityPage() {
  const navigate = useNavigate();
  const toast = useAppToast();

  const [loading, setLoading] = useState(true);
  const [personalInfo, setPersonalInfo] = useState(null);

  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");

  const [activeModal, setActiveModal] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [phoneForm, setPhoneForm] = useState({
    phone_number: "",
    session_id: "",
    otp: "",
  });

  const [changingPassword, setChangingPassword] = useState(false);
  const [initiatingPhoneChange, setInitiatingPhoneChange] = useState(false);
  const [verifyingPhoneChange, setVerifyingPhoneChange] = useState(false);

  const [phonePreview, setPhonePreview] = useState(null);
  const [debugOtp, setDebugOtp] = useState("");
  const [otpStepReady, setOtpStepReady] = useState(false);

  const handleUnauthorized = useCallback(() => {
    clearAuthTokens();
    navigate("/login", { replace: true });
  }, [navigate]);

  const authFetch = useCallback(
    async (url, options = {}) => {
      const token = getAccessToken();

      if (!token) {
        handleUnauthorized();
        throw new Error("Unauthorized");
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        },
      });

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error("Unauthorized");
      }

      return response;
    },
    [handleUnauthorized]
  );

  const loadSecurityData = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");
      setPageMessage("");

      const response = await authFetch("/api/personal-info/get_personal_info/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.detail || "Failed to load security data.";
        setPageError(message);
        toast.error(message);
        return;
      }

      setPersonalInfo(data?.data || null);
    } catch (error) {
      console.error("Failed to load security page:", error);
      setPageError("Failed to load security data.");
      toast.error("Failed to load security data.");
    } finally {
      setLoading(false);
    }
  }, [authFetch, toast]);

  useEffect(() => {
    loadSecurityData();
  }, [loadSecurityData]);

  useEffect(() => {
    if (!activeModal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeModal]);

  const emailVerified = Boolean(personalInfo?.email_verified);
  const phoneVerified = Boolean(personalInfo?.phone_verified);
  const hasPhone = Boolean(personalInfo?.phone_number);

  const securityLevel = useMemo(() => {
    let score = 0;
    if (emailVerified) score += 1;
    if (phoneVerified) score += 1;

    if (score === 2) return "Strong";
    if (score === 1) return "Medium";
    return "Weak";
  }, [emailVerified, phoneVerified]);

  const recoveryReadiness = useMemo(() => {
    if (emailVerified && phoneVerified) return "Ready";
    if (emailVerified || phoneVerified) return "Partial";
    return "Not ready";
  }, [emailVerified, phoneVerified]);

  const verificationSummary = useMemo(() => {
    if (emailVerified && phoneVerified) {
      return "Email and phone are verified.";
    }

    if (emailVerified && !phoneVerified) {
      return hasPhone
        ? "Email is verified. Phone still needs verification."
        : "Email is verified. Add a phone number to strengthen recovery.";
    }

    if (!emailVerified && phoneVerified) {
      return "Phone is verified. Email still needs verification.";
    }

    return "No verified channels yet. Your account recovery is weak.";
  }, [emailVerified, phoneVerified, hasPhone]);

  const usernameValue = useMemo(() => {
    return personalInfo?.username || "security";
  }, [personalInfo]);

  const emailValue = useMemo(() => {
    return personalInfo?.email || "No email";
  }, [personalInfo]);

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPageError("");
    setPageMessage("");
  };

  const handlePhoneChange = (event) => {
    const { name, value } = event.target;
    setPhoneForm((prev) => ({ ...prev, [name]: value }));
    setPageError("");
    setPageMessage("");
  };

  const closeModal = () => {
    setActiveModal("");
    setPageError("");
    setPageMessage("");
  };

  const openPasswordModal = () => {
    setPageError("");
    setPageMessage("");
    setActiveModal("password");
  };

  const openPhoneModal = () => {
    setPageError("");
    setPageMessage("");
    setActiveModal("phone");
  };

  const submitPasswordChange = async (event) => {
    event.preventDefault();

    try {
      setChangingPassword(true);
      setPageError("");
      setPageMessage("");

      const response = await authFetch("/api/personal-info/change_password/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordForm),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.error || data?.detail || "Failed to change password.";
        setPageError(message);
        toast.error(message);
        return;
      }

      setPasswordForm({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });

      const successMessage = data?.message || "Password changed successfully.";
      setPageMessage(successMessage);
      toast.success(successMessage);
      closeModal();
    } catch (error) {
      console.error("Password change failed:", error);
      setPageError("Failed to change password.");
      toast.error("Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  };

  const submitPhoneChangeInitiation = async (event) => {
    event.preventDefault();

    try {
      setInitiatingPhoneChange(true);
      setPageError("");
      setPageMessage("");

      const response = await authFetch("/api/personal-info/initiate_phone_change/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: phoneForm.phone_number.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.error || data?.detail || "Failed to initiate phone change.";
        setPageError(message);
        toast.error(message);
        return;
      }

      setPhoneForm((prev) => ({
        ...prev,
        session_id: data?.session_id || "",
      }));
      setPhonePreview(data?.preview || null);
      setDebugOtp(data?.debug_otp || "");
      setOtpStepReady(true);

      const successMessage = data?.message || "OTP sent successfully.";
      setPageMessage(successMessage);
      toast.success(successMessage);
    } catch (error) {
      console.error("Phone change initiation failed:", error);
      setPageError("Failed to initiate phone change.");
      toast.error("Failed to initiate phone change.");
    } finally {
      setInitiatingPhoneChange(false);
    }
  };

  const submitPhoneChangeVerification = async (event) => {
    event.preventDefault();

    try {
      setVerifyingPhoneChange(true);
      setPageError("");
      setPageMessage("");

      const response = await authFetch("/api/personal-info/verify_phone_change/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: phoneForm.session_id,
          otp: phoneForm.otp.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.error || data?.detail || "Failed to verify phone change.";
        setPageError(message);
        toast.error(message);
        return;
      }

      setPersonalInfo(data?.data || personalInfo);
      setPhoneForm({
        phone_number: "",
        session_id: "",
        otp: "",
      });
      setPhonePreview(null);
      setDebugOtp("");
      setOtpStepReady(false);

      const successMessage =
        data?.message || "Phone number updated successfully.";
      setPageMessage(successMessage);
      toast.success(successMessage);
      closeModal();
    } catch (error) {
      console.error("Phone verification failed:", error);
      setPageError("Failed to verify phone change.");
      toast.error("Failed to verify phone change.");
    } finally {
      setVerifyingPhoneChange(false);
    }
  };

  if (loading) {
    return (
      <div className="account-overview-page">
        <Card
          variant="default"
          padding="md"
          contentSpacing="md"
          className="card-rect overview-hero-card"
        >
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <LoaderCircle size={18} className="animate-spin" />
            <span>Loading security...</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="account-overview-page">
        <Card
          variant="default"
          padding="md"
          contentSpacing="md"
          className="card-rect overview-hero-card"
        >
          <div className="overview-hero-row">
            <div className="overview-hero-header">
              <div className="profile-header-minimal">
                <div className="profile-header-avatar-wrap">
                  <div className="profile-header-avatar-fallback">
                    <ShieldCheck size={34} />
                  </div>
                </div>

                <div className="profile-header-copy">
                  <p className="profile-header-username">@{usernameValue}</p>
                  <p className="profile-header-email">{emailValue}</p>
                </div>
              </div>
            </div>

            <div className="overview-hero-action">
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <TooltipPortal
                  content={
                    activeModal === "password"
                      ? "Password popup is open"
                      : "Open password popup"
                  }
                >
                  <div>
                    <Button
                      type="button"
                      variant={
                        activeModal === "password" ? "secondary" : "primary"
                      }
                      size="md"
                      emphasis="medium"
                      onClick={openPasswordModal}
                    >
                      <span className="inline-flex items-center gap-2">
                        <KeyRound size={16} />
                        Change Password
                      </span>
                    </Button>
                  </div>
                </TooltipPortal>

                <TooltipPortal
                  content={
                    activeModal === "phone"
                      ? "Phone popup is open"
                      : "Open phone change popup"
                  }
                >
                  <div>
                    <Button
                      type="button"
                      variant={activeModal === "phone" ? "secondary" : "primary"}
                      size="md"
                      emphasis="medium"
                      onClick={openPhoneModal}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Smartphone size={16} />
                        Change Phone
                      </span>
                    </Button>
                  </div>
                </TooltipPortal>

                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  emphasis="medium"
                  onClick={() => navigate("/account/settings")}
                >
                  <span className="inline-flex items-center gap-2">
                    <Settings size={16} />
                    Settings
                  </span>
                </Button>
              </div>
            </div>
          </div>

          {(pageMessage || pageError) && (
            <div className="grid gap-3">
              {pageMessage ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                  {pageMessage}
                </div>
              ) : null}

              {pageError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                  {pageError}
                </div>
              ) : null}
            </div>
          )}

          <div className="overview-status-strip" aria-label="Security quick status">
            <OverviewStatusPill
              icon={Mail}
              title="Email"
              value={emailVerified ? "Verified" : "Pending"}
              tone={emailVerified ? "blue" : "gold"}
            />

            <OverviewStatusPill
              icon={Phone}
              title="Phone"
              value={phoneVerified ? "Verified" : hasPhone ? "Pending" : "Missing"}
              tone={phoneVerified ? "blue" : "gold"}
            />

            <OverviewStatusPill
              icon={ShieldCheck}
              title="Security"
              value={securityLevel}
              tone={securityLevel === "Strong" ? "blue" : "gold"}
            />

            <OverviewStatusPill
              icon={LockKeyhole}
              title="Recovery"
              value={recoveryReadiness}
              tone={recoveryReadiness === "Ready" ? "blue" : "gold"}
            />
          </div>
        </Card>

        <div className="overview-main-grid">
          <Card
            variant="default"
            padding="sm"
            contentSpacing="sm"
            className="card-rect"
          >
            <CardHeader title="Security actions" className="overview-section-header" />
            <CardContent className="overview-nav-grid">
              <NavigationCard
                index={0}
                icon={KeyRound}
                title="Change password"
                description="Open a top popup panel to change your password."
                onClick={openPasswordModal}
                meta="Popup"
              />

              <NavigationCard
                index={1}
                icon={Smartphone}
                title="Change phone"
                description="Start the OTP phone change flow inside a popup."
                onClick={openPhoneModal}
                meta={otpStepReady ? "OTP Ready" : "Popup"}
              />

              <NavigationCard
                index={2}
                icon={LockKeyhole}
                title="Recovery methods"
                description="Manage recovery email and phone on the nested recovery page."
                onClick={() => navigate("/account/settings/security/recovery")}
                meta="Live"
              />

              <NavigationCard
                index={3}
                icon={AlertTriangle}
                title="Back to settings"
                description="Return to the account settings hub."
                onClick={() => navigate("/account/settings")}
                meta="Live"
              />
            </CardContent>
          </Card>

          <Card
            variant="default"
            padding="sm"
            contentSpacing="sm"
            className="card-rect"
          >
            <CardHeader title="Security summary" className="overview-section-header" />
            <CardContent className="overview-checklist">
              <SummaryRow
                label="Email"
                value={personalInfo?.email || "No email"}
                verified={emailVerified}
              />
              <SummaryRow
                label="Phone number"
                value={personalInfo?.phone_number || "Not added"}
                verified={phoneVerified}
              />
              <SummaryRow
                label="Phone country"
                value={personalInfo?.phone_country_code || "—"}
              />
              <SummaryRow label="Security level" value={securityLevel} />
              <SummaryRow label="Recovery readiness" value={recoveryReadiness} />
            </CardContent>
          </Card>
        </div>

        <div className="overview-main-grid">
          <Card
            variant="default"
            padding="sm"
            contentSpacing="sm"
            className="card-rect"
          >
            <CardHeader title="Verification health" className="overview-section-header" />
            <CardContent className="flex flex-col gap-3">
              <p className="overview-summary-note">{verificationSummary}</p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  emphasis="medium"
                  onClick={() => navigate("/account/profile")}
                >
                  Open Profile
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  emphasis="medium"
                  onClick={() => navigate("/account/settings/security/recovery")}
                >
                  Open Recovery
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card
            variant="default"
            padding="sm"
            contentSpacing="sm"
            className="card-rect"
          >
            <CardHeader title="Security note" className="overview-section-header" />
            <CardContent className="flex flex-col gap-3">
              <p className="overview-summary-note">
                Password and phone inputs are intentionally kept out of the page
                flow. They only open inside top popup panels.
              </p>

              {otpStepReady ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                  OTP session is active for {phonePreview || "your new phone"}.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {activeModal === "password" ? (
          <motion.div
            className="profile-edit-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="profile-edit-panel"
              initial={{ opacity: 0, y: -22, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.985 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="profile-edit-panel-header">
                <div className="profile-edit-panel-copy">
                  <h2 className="profile-edit-panel-title">Change password</h2>
                  <p className="profile-edit-panel-subtitle">
                    Keep password editing in a top popup, not dumped inside the page.
                  </p>
                </div>

                <button
                  type="button"
                  className="profile-edit-close"
                  onClick={closeModal}
                  aria-label="Close password popup"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="profile-edit-panel-body">
                <Form onSubmit={submitPasswordChange} spacing="md">
                  <FormSection>
                    <Input
                      id="old_password"
                      name="old_password"
                      type="password"
                      label="Current password"
                      value={passwordForm.old_password}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                      size="lg"
                      disabled={changingPassword}
                    />
                  </FormSection>

                  <FormSection>
                    <FormRow>
                      <Input
                        id="new_password"
                        name="new_password"
                        type="password"
                        label="New password"
                        value={passwordForm.new_password}
                        onChange={handlePasswordChange}
                        placeholder="Enter new password"
                        size="lg"
                        disabled={changingPassword}
                      />

                      <Input
                        id="confirm_password"
                        name="confirm_password"
                        type="password"
                        label="Confirm new password"
                        value={passwordForm.confirm_password}
                        onChange={handlePasswordChange}
                        placeholder="Confirm new password"
                        size="lg"
                        disabled={changingPassword}
                      />
                    </FormRow>
                  </FormSection>

                  <FormActions className="profile-edit-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      emphasis="medium"
                      onClick={closeModal}
                      disabled={changingPassword}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      emphasis="medium"
                      disabled={changingPassword}
                    >
                      <span className="inline-flex items-center gap-2">
                        {changingPassword ? (
                          <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                          <KeyRound size={16} />
                        )}
                        {changingPassword ? "Saving..." : "Save password"}
                      </span>
                    </Button>
                  </FormActions>
                </Form>
              </div>
            </motion.div>
          </motion.div>
        ) : null}

        {activeModal === "phone" ? (
          <motion.div
            className="profile-edit-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="profile-edit-panel"
              initial={{ opacity: 0, y: -22, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.985 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="profile-edit-panel-header">
                <div className="profile-edit-panel-copy">
                  <h2 className="profile-edit-panel-title">Change phone</h2>
                  <p className="profile-edit-panel-subtitle">
                    Start phone replacement and OTP verification from this top popup.
                  </p>
                </div>

                <button
                  type="button"
                  className="profile-edit-close"
                  onClick={closeModal}
                  aria-label="Close phone popup"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="profile-edit-panel-body">
                <Form onSubmit={submitPhoneChangeInitiation} spacing="md">
                  <FormSection>
                    <Input
                      id="phone_number"
                      name="phone_number"
                      type="tel"
                      label="New phone number"
                      value={phoneForm.phone_number}
                      onChange={handlePhoneChange}
                      placeholder="Enter new phone number"
                      size="lg"
                      disabled={initiatingPhoneChange || verifyingPhoneChange}
                    />
                  </FormSection>

                  <FormActions className="profile-edit-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      emphasis="medium"
                      onClick={closeModal}
                      disabled={initiatingPhoneChange || verifyingPhoneChange}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      emphasis="medium"
                      disabled={
                        !phoneForm.phone_number.trim() ||
                        initiatingPhoneChange ||
                        verifyingPhoneChange
                      }
                    >
                      <span className="inline-flex items-center gap-2">
                        {initiatingPhoneChange ? (
                          <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                          <Smartphone size={16} />
                        )}
                        {initiatingPhoneChange ? "Sending..." : "Send OTP"}
                      </span>
                    </Button>
                  </FormActions>
                </Form>

                {otpStepReady ? (
                  <div className="mt-6">
                    <Form onSubmit={submitPhoneChangeVerification} spacing="md">
                      <FormSection>
                        <FormRow>
                          <Input
                            id="session_id"
                            name="session_id"
                            type="text"
                            label="Session ID"
                            value={phoneForm.session_id}
                            onChange={handlePhoneChange}
                            placeholder="Session id"
                            size="lg"
                            disabled
                          />

                          <Input
                            id="otp"
                            name="otp"
                            type="text"
                            label="OTP code"
                            value={phoneForm.otp}
                            onChange={handlePhoneChange}
                            placeholder="Enter OTP"
                            size="lg"
                            disabled={verifyingPhoneChange}
                          />
                        </FormRow>
                      </FormSection>

                      {phonePreview ? (
                        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                          OTP sent to {phonePreview}
                        </div>
                      ) : null}

                      {debugOtp ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                          Debug OTP: {debugOtp}
                        </div>
                      ) : null}

                      <FormActions className="profile-edit-actions">
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          emphasis="medium"
                          onClick={() => {
                            setOtpStepReady(false);
                            setPhonePreview(null);
                            setDebugOtp("");
                            setPhoneForm((prev) => ({
                              ...prev,
                              session_id: "",
                              otp: "",
                            }));
                          }}
                          disabled={verifyingPhoneChange}
                        >
                          Reset
                        </Button>

                        <Button
                          type="submit"
                          variant="primary"
                          size="md"
                          emphasis="medium"
                          disabled={
                            !phoneForm.session_id ||
                            !phoneForm.otp.trim() ||
                            verifyingPhoneChange
                          }
                        >
                          <span className="inline-flex items-center gap-2">
                            {verifyingPhoneChange ? (
                              <LoaderCircle size={16} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={16} />
                            )}
                            {verifyingPhoneChange ? "Verifying..." : "Verify phone"}
                          </span>
                        </Button>
                      </FormActions>
                    </Form>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}