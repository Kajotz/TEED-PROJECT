import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  Star,
  Plus,
  UserCircle2,
  X,
  XCircle,
  Settings,
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

function RecoveryMethodCard({
  method,
  onSetDefault,
  onDeactivate,
  settingDefault,
  deactivating,
}) {
  const isEmail = method.method_type === "email";
  const isPhone = method.method_type === "phone";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[#323232] dark:bg-[#1e1e1e]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="overview-nav-card-icon">
            {isEmail ? (
              <Mail size={18} strokeWidth={2} />
            ) : isPhone ? (
              <Phone size={18} strokeWidth={2} />
            ) : (
              <LockKeyhole size={18} strokeWidth={2} />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="m-0 text-sm font-semibold text-gray-700 dark:text-gray-200">
              {isEmail ? "Recovery email" : "Recovery phone"}
            </h3>
            <p className="mt-1 break-all text-sm text-gray-500 dark:text-gray-400">
              {method.masked_value || method.value}
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Type: {method.method_type} · Created:{" "}
              {method.created_at
                ? new Date(method.created_at).toLocaleDateString()
                : "—"}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          <div className="flex flex-wrap gap-2">
            <span
              className={`overview-checklist-badge ${
                method.is_verified ? "is-done" : "is-pending"
              }`}
            >
              {method.is_verified ? "Verified" : "Pending"}
            </span>

            {method.is_default ? (
              <span className="overview-checklist-badge is-done">Default</span>
            ) : null}

            {!method.is_active ? (
              <span className="overview-checklist-badge is-pending">
                Inactive
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {!method.is_default && method.is_verified && method.is_active ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                emphasis="medium"
                onClick={() => onSetDefault(method.id)}
                disabled={settingDefault || deactivating}
              >
                {settingDefault ? "Saving..." : "Set Default"}
              </Button>
            ) : null}

            {method.is_active ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                emphasis="medium"
                onClick={() => onDeactivate(method)}
                disabled={settingDefault || deactivating}
              >
                {deactivating ? "Deactivating..." : "Deactivate"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecoveryPage() {
  const navigate = useNavigate();
  const toast = useAppToast();

  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState([]);

  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");

  const [activeModal, setActiveModal] = useState("");

  const [addForm, setAddForm] = useState({
    method_type: "email",
    value: "",
  });

  const [verifyForm, setVerifyForm] = useState({
    challenge_id: "",
    code: "",
  });

  const [pendingMethod, setPendingMethod] = useState(null);

  const [addingMethod, setAddingMethod] = useState(false);
  const [verifyingMethod, setVerifyingMethod] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState("");
  const [deactivatingId, setDeactivatingId] = useState("");

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

  const loadMethods = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");
      setPageMessage("");

      const response = await authFetch("/api/recovery/methods/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.detail || "Failed to load recovery methods.";
        setPageError(message);
        toast.error(message);
        return;
      }

      setMethods(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load recovery methods:", error);
      setPageError("Failed to load recovery methods.");
      toast.error("Failed to load recovery methods.");
    } finally {
      setLoading(false);
    }
  }, [authFetch, toast]);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  useEffect(() => {
    if (!activeModal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeModal]);

  const activeMethods = useMemo(
    () => methods.filter((item) => item.is_active),
    [methods]
  );

  const verifiedActiveMethods = useMemo(
    () => methods.filter((item) => item.is_active && item.is_verified),
    [methods]
  );

  const defaultMethod = useMemo(
    () => methods.find((item) => item.is_active && item.is_default),
    [methods]
  );

  const recoveryHealth = useMemo(() => {
    if (verifiedActiveMethods.length > 0 && defaultMethod) return "Ready";
    if (activeMethods.length > 0) return "Partial";
    return "Not set";
  }, [verifiedActiveMethods, activeMethods, defaultMethod]);

  const methodsSummary = useMemo(() => {
    if (verifiedActiveMethods.length > 0 && defaultMethod) {
      return "Recovery is configured with at least one verified active default method.";
    }

    if (activeMethods.length > 0) {
      return "Recovery methods exist, but setup is incomplete or still pending verification.";
    }

    return "No recovery methods configured yet.";
  }, [verifiedActiveMethods, activeMethods, defaultMethod]);

  const handleAddFormChange = (event) => {
    const { name, value } = event.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
    setPageError("");
    setPageMessage("");
  };

  const handleVerifyFormChange = (event) => {
    const { name, value } = event.target;
    setVerifyForm((prev) => ({ ...prev, [name]: value }));
    setPageError("");
    setPageMessage("");
  };

  const closeModal = () => {
    setActiveModal("");
    setPageError("");
    setPageMessage("");
  };

  const openAddModal = () => {
    setPageError("");
    setPageMessage("");
    setActiveModal("add");
  };

  const openVerifyModal = () => {
    setPageError("");
    setPageMessage("");
    setActiveModal("verify");
  };

  const submitAddMethod = async (event) => {
    event.preventDefault();

    try {
      setAddingMethod(true);
      setPageError("");
      setPageMessage("");

      const response = await authFetch("/api/recovery/methods/add/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method_type: addForm.method_type,
          value: addForm.value.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.value?.[0] ||
          data?.method_type?.[0] ||
          data?.detail ||
          data?.error ||
          "Failed to add recovery method.";
        setPageError(message);
        toast.error(message);
        return;
      }

      setPendingMethod(data?.recovery_method || null);
      setVerifyForm({
        challenge_id: data?.challenge_id || "",
        code: "",
      });

      setAddForm((prev) => ({
        ...prev,
        value: "",
      }));

      const successMessage =
        "Recovery method added. Verify it to activate it properly.";
      setPageMessage(successMessage);
      toast.success(successMessage);

      await loadMethods();
      setActiveModal("verify");
    } catch (error) {
      console.error("Failed to add recovery method:", error);
      setPageError("Failed to add recovery method.");
      toast.error("Failed to add recovery method.");
    } finally {
      setAddingMethod(false);
    }
  };

  const submitVerifyMethod = async (event) => {
    event.preventDefault();

    try {
      setVerifyingMethod(true);
      setPageError("");
      setPageMessage("");

      const response = await authFetch("/api/recovery/methods/verify/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          challenge_id: verifyForm.challenge_id,
          code: verifyForm.code.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.code?.[0] ||
          data?.challenge_id?.[0] ||
          data?.detail ||
          data?.error ||
          "Failed to verify recovery method.";
        setPageError(message);
        toast.error(message);
        return;
      }

      setPendingMethod(null);
      setVerifyForm({
        challenge_id: "",
        code: "",
      });

      const successMessage = "Recovery method verified successfully.";
      setPageMessage(successMessage);
      toast.success(successMessage);

      await loadMethods();
      closeModal();
    } catch (error) {
      console.error("Failed to verify recovery method:", error);
      setPageError("Failed to verify recovery method.");
      toast.error("Failed to verify recovery method.");
    } finally {
      setVerifyingMethod(false);
    }
  };

  const handleSetDefault = async (recoveryMethodId) => {
    try {
      setSettingDefaultId(recoveryMethodId);
      setPageError("");
      setPageMessage("");

      const response = await authFetch("/api/recovery/methods/set-default/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recovery_method_id: recoveryMethodId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.recovery_method_id?.[0] ||
          data?.detail ||
          data?.error ||
          "Failed to set default recovery method.";
        setPageError(message);
        toast.error(message);
        return;
      }

      const successMessage = "Default recovery method updated.";
      setPageMessage(successMessage);
      toast.success(successMessage);
      await loadMethods();
    } catch (error) {
      console.error("Failed to set default recovery method:", error);
      setPageError("Failed to set default recovery method.");
      toast.error("Failed to set default recovery method.");
    } finally {
      setSettingDefaultId("");
    }
  };

  const handleDeactivate = async (method) => {
    const activeVerifiedCount = verifiedActiveMethods.length;
    const isOnlyVerifiedActive =
      method.is_active && method.is_verified && activeVerifiedCount <= 1;

    if (isOnlyVerifiedActive) {
      const message =
        "You cannot deactivate your only verified active recovery method.";
      setPageError(message);
      setPageMessage("");
      toast.error(message);
      return;
    }

    try {
      setDeactivatingId(method.id);
      setPageError("");
      setPageMessage("");

      const response = await authFetch(
        `/api/recovery/methods/${method.id}/deactivate/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.error || data?.detail || "Failed to deactivate recovery method.";
        setPageError(message);
        toast.error(message);
        return;
      }

      const successMessage = data?.message || "Recovery method deactivated.";
      setPageMessage(successMessage);
      toast.success(successMessage);
      await loadMethods();
    } catch (error) {
      console.error("Failed to deactivate recovery method:", error);
      setPageError("Failed to deactivate recovery method.");
      toast.error("Failed to deactivate recovery method.");
    } finally {
      setDeactivatingId("");
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
            <span>Loading recovery...</span>
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
                    <LockKeyhole size={34} />
                  </div>
                </div>

                <div className="profile-header-copy">
                  <p className="profile-header-username">Recovery methods</p>
                  <p className="profile-header-email">
                    Manage recovery email and phone from one clean place.
                  </p>
                </div>
              </div>
            </div>

            <div className="overview-hero-action">
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <TooltipPortal
                  content={
                    activeModal === "add"
                      ? "Add method popup is open"
                      : "Open add recovery method popup"
                  }
                >
                  <div>
                    <Button
                      type="button"
                      variant={activeModal === "add" ? "secondary" : "primary"}
                      size="md"
                      emphasis="medium"
                      onClick={openAddModal}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Plus size={16} />
                        Add Method
                      </span>
                    </Button>
                  </div>
                </TooltipPortal>

                <TooltipPortal
                  content={
                    activeModal === "verify"
                      ? "Verify popup is open"
                      : "Open verify recovery method popup"
                  }
                >
                  <div>
                    <Button
                      type="button"
                      variant={
                        activeModal === "verify" ? "secondary" : "primary"
                      }
                      size="md"
                      emphasis="medium"
                      onClick={openVerifyModal}
                    >
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        Verify Method
                      </span>
                    </Button>
                  </div>
                </TooltipPortal>

                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  emphasis="medium"
                  onClick={() => navigate("/account/settings/security")}
                >
                  <span className="inline-flex items-center gap-2">
                    <Settings size={16} />
                    Security
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

          <div className="overview-status-strip" aria-label="Recovery quick status">
            <OverviewStatusPill
              icon={ShieldCheck}
              title="Recovery"
              value={recoveryHealth}
              tone={recoveryHealth === "Ready" ? "blue" : "gold"}
            />

            <OverviewStatusPill
              icon={LockKeyhole}
              title="Active"
              value={String(activeMethods.length)}
              tone={activeMethods.length > 0 ? "blue" : "gold"}
            />

            <OverviewStatusPill
              icon={CheckCircle2}
              title="Verified"
              value={String(verifiedActiveMethods.length)}
              tone={verifiedActiveMethods.length > 0 ? "blue" : "gold"}
            />

            <OverviewStatusPill
              icon={Star}
              title="Default"
              value={defaultMethod ? "Set" : "Missing"}
              tone={defaultMethod ? "blue" : "gold"}
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
            <CardHeader title="Recovery actions" className="overview-section-header" />
            <CardContent className="overview-nav-grid">
              <NavigationCard
                index={0}
                icon={Plus}
                title="Add method"
                description="Open a popup and add a recovery email or phone."
                onClick={openAddModal}
                meta="Popup"
              />

              <NavigationCard
                index={1}
                icon={CheckCircle2}
                title="Verify pending"
                description="Finish verification for a newly added recovery method."
                onClick={openVerifyModal}
                meta={verifyForm.challenge_id ? "Ready" : "Idle"}
              />

              <NavigationCard
                index={2}
                icon={Star}
                title="Set default"
                description="Use the methods list below to promote a verified method."
                onClick={() => {
                  const target = document.getElementById("recovery-methods-section");
                  target?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                meta="Live"
              />

              <NavigationCard
                index={3}
                icon={AlertTriangle}
                title="Back to security"
                description="Return to the parent security page."
                onClick={() => navigate("/account/settings/security")}
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
            <CardHeader title="Recovery summary" className="overview-section-header" />
            <CardContent className="overview-checklist">
              <SummaryRow label="Status" value={recoveryHealth} />
              <SummaryRow
                label="Default method"
                value={defaultMethod?.masked_value || "Not set"}
                verified={Boolean(defaultMethod)}
              />
              <SummaryRow
                label="Verified active"
                value={String(verifiedActiveMethods.length)}
              />
              <SummaryRow label="Available types" value="Email, Phone" />
              <SummaryRow label="Summary" value={methodsSummary} />
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
            <CardHeader title="Recovery note" className="overview-section-header" />
            <CardContent className="flex flex-col gap-3">
              <p className="overview-summary-note">
                Recovery inputs stay closed by default. Add and verify flows only
                open inside popup panels, same pattern as profile and security.
              </p>

              {pendingMethod ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                  Pending method: {pendingMethod.masked_value || pendingMethod.value}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card
            variant="default"
            padding="sm"
            contentSpacing="sm"
            className="card-rect"
          >
            <CardHeader title="Navigation" className="overview-section-header" />
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                size="md"
                emphasis="medium"
                onClick={() => navigate("/account/settings/security")}
              >
                Security
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                emphasis="medium"
                onClick={() => navigate("/account/settings")}
              >
                Account Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card
          id="recovery-methods-section"
          variant="default"
          padding="sm"
          contentSpacing="sm"
          className="card-rect"
        >
          <CardHeader
            title="Your recovery methods"
            className="overview-section-header"
          />
          <CardContent className="flex flex-col gap-4">
            {methods.length === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-[#323232] dark:text-gray-400">
                <XCircle size={18} />
                <p>No recovery methods configured yet.</p>
              </div>
            ) : (
              methods.map((method) => (
                <RecoveryMethodCard
                  key={method.id}
                  method={method}
                  onSetDefault={handleSetDefault}
                  onDeactivate={handleDeactivate}
                  settingDefault={settingDefaultId === method.id}
                  deactivating={deactivatingId === method.id}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {activeModal === "add" ? (
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
                  <h2 className="profile-edit-panel-title">Add recovery method</h2>
                  <p className="profile-edit-panel-subtitle">
                    Add a recovery email or phone from a top popup, not inside the page body.
                  </p>
                </div>

                <button
                  type="button"
                  className="profile-edit-close"
                  onClick={closeModal}
                  aria-label="Close add recovery popup"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="profile-edit-panel-body">
                <Form onSubmit={submitAddMethod} spacing="md">
                  <FormSection>
                    <div className="profile-edit-select-wrap">
                      <label
                        className="profile-edit-select-label"
                        htmlFor="method_type"
                      >
                        Method type
                      </label>
                      <select
                        id="method_type"
                        name="method_type"
                        value={addForm.method_type}
                        onChange={handleAddFormChange}
                        className="profile-edit-select"
                        disabled={addingMethod}
                      >
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                      </select>
                    </div>
                  </FormSection>

                  <FormSection>
                    <Input
                      id="value"
                      name="value"
                      type="text"
                      label={
                        addForm.method_type === "email"
                          ? "Recovery email"
                          : "Recovery phone"
                      }
                      value={addForm.value}
                      onChange={handleAddFormChange}
                      placeholder={
                        addForm.method_type === "email"
                          ? "Enter recovery email"
                          : "Enter recovery phone"
                      }
                      size="lg"
                      disabled={addingMethod}
                    />
                  </FormSection>

                  <FormActions className="profile-edit-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      emphasis="medium"
                      onClick={closeModal}
                      disabled={addingMethod}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      emphasis="medium"
                      disabled={addingMethod}
                    >
                      <span className="inline-flex items-center gap-2">
                        {addingMethod ? (
                          <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                          <Plus size={16} />
                        )}
                        {addingMethod ? "Adding..." : "Add method"}
                      </span>
                    </Button>
                  </FormActions>
                </Form>
              </div>
            </motion.div>
          </motion.div>
        ) : null}

        {activeModal === "verify" ? (
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
                  <h2 className="profile-edit-panel-title">Verify recovery method</h2>
                  <p className="profile-edit-panel-subtitle">
                    Finish recovery verification inside this popup panel.
                  </p>
                </div>

                <button
                  type="button"
                  className="profile-edit-close"
                  onClick={closeModal}
                  aria-label="Close verify recovery popup"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="profile-edit-panel-body">
                {verifyForm.challenge_id ? (
                  <Form onSubmit={submitVerifyMethod} spacing="md">
                    {pendingMethod ? (
                      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                        Pending method:{" "}
                        <strong>
                          {pendingMethod.masked_value || pendingMethod.value}
                        </strong>
                      </div>
                    ) : null}

                    <FormSection>
                      <FormRow>
                        <Input
                          id="challenge_id"
                          name="challenge_id"
                          type="text"
                          label="Challenge ID"
                          value={verifyForm.challenge_id}
                          onChange={handleVerifyFormChange}
                          placeholder="Challenge id"
                          size="lg"
                          disabled
                        />

                        <Input
                          id="code"
                          name="code"
                          type="text"
                          label="Verification code"
                          value={verifyForm.code}
                          onChange={handleVerifyFormChange}
                          placeholder="Enter 6-digit code"
                          size="lg"
                          disabled={verifyingMethod}
                        />
                      </FormRow>
                    </FormSection>

                    <FormActions className="profile-edit-actions">
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        emphasis="medium"
                        onClick={() => {
                          setPendingMethod(null);
                          setVerifyForm({
                            challenge_id: "",
                            code: "",
                          });
                          setPageError("");
                          setPageMessage("");
                        }}
                        disabled={verifyingMethod}
                      >
                        Clear
                      </Button>

                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        emphasis="medium"
                        disabled={verifyingMethod}
                      >
                        <span className="inline-flex items-center gap-2">
                          {verifyingMethod ? (
                            <LoaderCircle size={16} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                          {verifyingMethod ? "Verifying..." : "Verify method"}
                        </span>
                      </Button>
                    </FormActions>
                  </Form>
                ) : (
                  <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-[#323232] dark:text-gray-400">
                    <XCircle size={18} />
                    <p>No pending verification challenge right now.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}