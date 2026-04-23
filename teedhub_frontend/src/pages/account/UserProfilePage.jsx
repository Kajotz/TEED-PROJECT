import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck,
  Building2,
  Camera,
  CheckCircle2,
  ChevronRight,
  Globe,
  LoaderCircle,
  Mail,
  Phone,
  Settings,
  ShieldCheck,
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

const COUNTRY_OPTIONS = [
  { value: "TZ", label: "Tanzania" },
  { value: "KE", label: "Kenya" },
  { value: "UG", label: "Uganda" },
  { value: "BI", label: "Burundi" },
  { value: "RW", label: "Rwanda" },
  { value: "CD", label: "DRC" },
  { value: "ZM", label: "Zambia" },
];

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

export default function UserProfilePage() {
  const navigate = useNavigate();
  const toast = useAppToast();

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [personalInfo, setPersonalInfo] = useState(null);

  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");

  const [isEditOpen, setIsEditOpen] = useState(false);

  const [basicForm, setBasicForm] = useState({
    first_name: "",
    last_name: "",
  });

  const [identityForm, setIdentityForm] = useState({
    username: "",
    country: "",
  });

  const [savingBasic, setSavingBasic] = useState(false);
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const loadProfilePage = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");
      setPageMessage("");

      const [profileResponse, personalResponse] = await Promise.all([
        authFetch("/api/profile/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }),
        authFetch("/api/personal-info/get_personal_info/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }),
      ]);

      const profileJson = await profileResponse.json();
      const personalJson = await personalResponse.json();

      const nextProfile = profileJson || null;
      const nextPersonalInfo = personalJson?.data || null;

      setProfileData(nextProfile);
      setPersonalInfo(nextPersonalInfo);

      setBasicForm({
        first_name: nextProfile?.first_name || "",
        last_name: nextProfile?.last_name || "",
      });

      setIdentityForm({
        username: nextPersonalInfo?.username || "",
        country: nextPersonalInfo?.country || "",
      });
    } catch (error) {
      console.error("Failed to load profile page:", error);
      setPageError("Failed to load profile data.");
      toast.error("Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  }, [authFetch, toast]);

  useEffect(() => {
    loadProfilePage();
  }, [loadProfilePage]);

  useEffect(() => {
    if (!isEditOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isEditOpen]);

  const usernameValue = useMemo(() => {
    return personalInfo?.username || profileData?.username || "user";
  }, [personalInfo, profileData]);

  const emailValue = useMemo(() => {
    return personalInfo?.email || profileData?.email || "No email";
  }, [personalInfo, profileData]);

  const phoneValue = personalInfo?.phone_number || "Not added";

  const joinedDate = useMemo(() => {
    if (!profileData?.date_joined) return "—";

    try {
      return new Date(profileData.date_joined).toLocaleDateString();
    } catch {
      return "—";
    }
  }, [profileData]);

  const businessesCount = profileData?.businesses?.length || 0;
  const ownedBusinessesCount = profileData?.owned_businesses?.length || 0;

  const emailVerified = Boolean(personalInfo?.email_verified);
  const phoneVerified = Boolean(personalInfo?.phone_verified);
  const completionPassed = Boolean(personalInfo?.completion_passed);

  const profileStrength = useMemo(() => {
    let score = 0;
    if (emailVerified) score += 1;
    if (phoneVerified) score += 1;
    if (completionPassed) score += 1;

    if (score === 3) return "Strong";
    if (score === 2) return "Good";
    if (score === 1) return "Partial";
    return "Weak";
  }, [emailVerified, phoneVerified, completionPassed]);

  const handleBasicChange = (event) => {
    const { name, value } = event.target;
    setBasicForm((prev) => ({ ...prev, [name]: value }));
    setPageError("");
    setPageMessage("");
  };

  const handleIdentityChange = (event) => {
    const { name, value } = event.target;
    setIdentityForm((prev) => ({ ...prev, [name]: value }));
    setPageError("");
    setPageMessage("");
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setPageError("");
    setPageMessage("");
  };

  const handleSaveBasicProfile = async (event) => {
    event.preventDefault();

    try {
      setSavingBasic(true);
      setPageError("");
      setPageMessage("");

      const response = await authFetch("/api/profile/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: basicForm.first_name.trim(),
          last_name: basicForm.last_name.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.detail || data?.error || "Failed to update basic profile.";
        setPageError(message);
        toast.error(message);
        return;
      }

      setProfileData(data?.data || data);
      setPageMessage("Basic profile updated successfully.");
      toast.success("Basic profile updated successfully.");
    } catch (error) {
      console.error("Failed to update basic profile:", error);
      setPageError("Failed to update basic profile.");
      toast.error("Failed to update basic profile.");
    } finally {
      setSavingBasic(false);
    }
  };

  const handleSaveIdentity = async (event) => {
    event.preventDefault();

    try {
      setSavingIdentity(true);
      setPageError("");
      setPageMessage("");

      if (
        identityForm.username.trim() &&
        identityForm.username.trim() !== (personalInfo?.username || "")
      ) {
        const usernameResponse = await authFetch(
          "/api/personal-info/update_username/",
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: identityForm.username.trim(),
            }),
          }
        );

        const usernameJson = await usernameResponse.json();

        if (!usernameResponse.ok) {
          const message =
            usernameJson?.username?.[0] ||
            usernameJson?.detail ||
            usernameJson?.error ||
            "Failed to update username.";
          setPageError(message);
          toast.error(message);
          return;
        }
      }

      if (
        identityForm.country &&
        identityForm.country !== (personalInfo?.country || "")
      ) {
        const countryResponse = await authFetch(
          "/api/personal-info/update_country/",
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              country: identityForm.country,
            }),
          }
        );

        const countryJson = await countryResponse.json();

        if (!countryResponse.ok) {
          const message =
            countryJson?.country?.[0] ||
            countryJson?.detail ||
            countryJson?.error ||
            "Failed to update country.";
          setPageError(message);
          toast.error(message);
          return;
        }
      }

      await loadProfilePage();
      setPageMessage("Identity details updated successfully.");
      toast.success("Identity details updated successfully.");
      closeEditModal();
    } catch (error) {
      console.error("Failed to update identity:", error);
      setPageError("Failed to update identity details.");
      toast.error("Failed to update identity details.");
    } finally {
      setSavingIdentity(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setPageError("");
      setPageMessage("");

      const formData = new FormData();
      formData.append("profile_image", file);

      const response = await authFetch(
        "/api/personal-info/upload_profile_image/",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const message = data?.error || "Failed to upload profile image.";
        setPageError(message);
        toast.error(message);
        return;
      }

      setPersonalInfo((prev) => ({
        ...(prev || {}),
        ...(data?.data || {}),
      }));
      setPageMessage("Profile image uploaded successfully.");
      toast.success("Profile image uploaded successfully.");
    } catch (error) {
      console.error("Failed to upload profile image:", error);
      setPageError("Failed to upload profile image.");
      toast.error("Failed to upload profile image.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
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
            <span>Loading profile...</span>
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
                  {personalInfo?.profile_image ? (
                    <img
                      src={personalInfo.profile_image}
                      alt={usernameValue}
                      className="profile-header-avatar-image"
                    />
                  ) : (
                    <div className="profile-header-avatar-fallback">
                      <UserCircle2 size={34} />
                    </div>
                  )}

                  <label className="profile-header-avatar-upload">
                    {uploadingImage ? (
                      <LoaderCircle size={15} className="animate-spin" />
                    ) : (
                      <Camera size={15} />
                    )}

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                </div>

                <div className="profile-header-copy">
                  <p className="profile-header-username">@{usernameValue}</p>
                  <p className="profile-header-email">{emailValue}</p>
                </div>
              </div>
            </div>

            <div className="overview-hero-action">
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <TooltipPortal content={isEditOpen ? "Close edit popup" : "Open edit popup"}>
                  <div>
                    <Button
                      type="button"
                      variant={isEditOpen ? "secondary" : "primary"}
                      size="md"
                      emphasis="medium"
                      onClick={() => setIsEditOpen(true)}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Settings size={16} />
                        Edit Profile
                      </span>
                    </Button>
                  </div>
                </TooltipPortal>

                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  emphasis="medium"
                  onClick={() => navigate("/account/home")}
                >
                  <span className="inline-flex items-center gap-2">
                    <UserCircle2 size={16} />
                    Account Home
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

          <div className="overview-status-strip" aria-label="Profile quick status">
            <OverviewStatusPill
              icon={Mail}
              title="Email"
              value={emailVerified ? "Verified" : "Pending"}
              tone={emailVerified ? "blue" : "gold"}
            />

            <OverviewStatusPill
              icon={Phone}
              title="Phone"
              value={phoneVerified ? "Verified" : "Pending"}
              tone={phoneVerified ? "blue" : "gold"}
            />

            <OverviewStatusPill
              icon={BadgeCheck}
              title="Profile"
              value={completionPassed ? "Completed" : "Incomplete"}
              tone={completionPassed ? "blue" : "gold"}
            />

            <OverviewStatusPill
              icon={Building2}
              title="Businesses"
              value={String(businessesCount)}
              tone={businessesCount > 0 ? "blue" : "gold"}
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
            <CardHeader title="Profile actions" className="overview-section-header" />
            <CardContent className="overview-nav-grid">
              <NavigationCard
                index={0}
                icon={Settings}
                title="Edit Profile"
                description="Open profile editing in a top popup panel."
                onClick={() => setIsEditOpen(true)}
                meta="Popup"
              />

              <NavigationCard
                index={1}
                icon={ShieldCheck}
                title="Security"
                description="Manage password, recovery, and verification details."
                onClick={() => navigate("/account/settings/security")}
                meta={profileStrength}
              />

              <NavigationCard
                index={2}
                icon={Settings}
                title="Account Settings"
                description="Open the account settings hub."
                onClick={() => navigate("/account/settings")}
                meta="Live"
              />

              <NavigationCard
                index={3}
                icon={Globe}
                title="Back Home"
                description="Return to your account home overview."
                onClick={() => navigate("/account/home")}
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
            <CardHeader title="Profile summary" className="overview-section-header" />
            <CardContent className="overview-checklist">
              <SummaryRow
                label="Email"
                value={emailValue}
                verified={emailVerified}
              />
              <SummaryRow
                label="Phone number"
                value={phoneValue}
                verified={phoneVerified}
              />
              <SummaryRow
                label="Country"
                value={personalInfo?.country || "Not added"}
              />
              <SummaryRow label="Joined" value={joinedDate} />
              <SummaryRow
                label="Owned businesses"
                value={String(ownedBusinessesCount)}
              />
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
            <CardHeader title="Businesses" className="overview-section-header" />
            <CardContent className="flex flex-col gap-3">
              {profileData?.businesses?.length ? (
                profileData.businesses.slice(0, 5).map((business) => (
                  <button
                    key={business.id}
                    type="button"
                    onClick={() => navigate(`/business/${business.id}/overview`)}
                    className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-4 py-4 text-left transition hover:border-gray-300 hover:shadow-sm dark:border-[#323232] dark:bg-[#1f1f1f] dark:hover:border-[#3a3a3a]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {business.name}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {business.business_type || "Business"}
                      </p>
                    </div>

                    <ChevronRight
                      size={16}
                      className="shrink-0 text-gray-400 dark:text-gray-500"
                    />
                  </button>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-white/10 dark:text-gray-400">
                  No businesses found yet.
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            variant="default"
            padding="sm"
            contentSpacing="sm"
            className="card-rect"
          >
            <CardHeader title="Identity status" className="overview-section-header" />
            <CardContent className="overview-checklist">
              {[
                {
                  label: "Email verified",
                  done: emailVerified,
                  icon: Mail,
                  action: "/account/settings/security",
                },
                {
                  label: "Phone verified",
                  done: phoneVerified,
                  icon: Phone,
                  action: "/account/settings/security",
                },
                {
                  label: "Country added",
                  done: Boolean(personalInfo?.country),
                  icon: Globe,
                  action: null,
                },
                {
                  label: "Profile completed",
                  done: completionPassed,
                  icon: BadgeCheck,
                  action: null,
                },
              ].map((item) => {
                const ItemIcon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    className={`overview-checklist-row ${
                      item.action ? "is-clickable" : ""
                    }`}
                    onClick={() => {
                      if (item.action) navigate(item.action);
                    }}
                    disabled={!item.action}
                  >
                    <div className="overview-checklist-left">
                      <div
                        className={`overview-checklist-mark ${
                          item.done ? "done" : ""
                        }`}
                      >
                        {item.done ? (
                          <CheckCircle2 size={14} strokeWidth={2.4} />
                        ) : (
                          <ItemIcon size={14} strokeWidth={2.2} />
                        )}
                      </div>

                      <span className="overview-checklist-label">{item.label}</span>
                    </div>

                    <span className="overview-checklist-state">
                      {item.done ? "Done" : "Pending"}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {isEditOpen ? (
          <motion.div
            className="profile-edit-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeEditModal}
          >
            <motion.div
              className="profile-edit-panel"
              initial={{ opacity: 0, y: -28, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.985 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="profile-edit-panel-header">
                <div className="profile-edit-panel-copy">
                  <h2 className="profile-edit-panel-title">Edit profile</h2>
                  <p className="profile-edit-panel-subtitle">
                    Update your profile from this top popup, not inside the page flow.
                  </p>
                </div>

                <button
                  type="button"
                  className="profile-edit-close"
                  onClick={closeEditModal}
                  aria-label="Close edit popup"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="profile-edit-panel-body">
                <Form onSubmit={handleSaveBasicProfile} spacing="md">
                  <FormSection>
                    <FormRow>
                      <Input
                        id="first_name"
                        name="first_name"
                        type="text"
                        label="First name"
                        value={basicForm.first_name}
                        onChange={handleBasicChange}
                        placeholder="Enter first name"
                        size="lg"
                        disabled={savingBasic || savingIdentity}
                      />

                      <Input
                        id="last_name"
                        name="last_name"
                        type="text"
                        label="Last name"
                        value={basicForm.last_name}
                        onChange={handleBasicChange}
                        placeholder="Enter last name"
                        size="lg"
                        disabled={savingBasic || savingIdentity}
                      />
                    </FormRow>
                  </FormSection>

                  <FormSection>
                    <FormRow>
                      <Input
                        id="username"
                        name="username"
                        type="text"
                        label="Username"
                        value={identityForm.username}
                        onChange={handleIdentityChange}
                        placeholder="Enter username"
                        size="lg"
                        disabled={savingBasic || savingIdentity}
                      />

                      <div className="profile-edit-select-wrap">
                        <label htmlFor="country" className="profile-edit-select-label">
                          Country
                        </label>

                        <select
                          id="country"
                          name="country"
                          value={identityForm.country}
                          onChange={handleIdentityChange}
                          disabled={savingBasic || savingIdentity}
                          className="profile-edit-select"
                        >
                          <option value="">Select country</option>
                          {COUNTRY_OPTIONS.map((country) => (
                            <option key={country.value} value={country.value}>
                              {country.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </FormRow>
                  </FormSection>

                  <FormActions className="profile-edit-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      emphasis="medium"
                      onClick={closeEditModal}
                      disabled={savingBasic || savingIdentity}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      emphasis="medium"
                      disabled={savingBasic || savingIdentity}
                      onClick={handleSaveIdentity}
                    >
                      <span className="inline-flex items-center gap-2">
                        {savingBasic || savingIdentity ? (
                          <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                          <BadgeCheck size={16} />
                        )}
                        {savingBasic || savingIdentity ? "Saving..." : "Save Changes"}
                      </span>
                    </Button>
                  </FormActions>
                </Form>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}