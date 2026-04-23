import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Camera,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  LoaderCircle,
  Palette,
  Settings,
  X,
} from "lucide-react";

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
import { apiPatch } from "@/utils/api";

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

function SummaryRow({ label, value, done = null }) {
  return (
    <div className="overview-checklist-row">
      <div className="overview-checklist-left">
        <div className={`overview-checklist-mark ${done ? "done" : ""}`}>
          {done ? (
            <CheckCircle2 size={14} strokeWidth={2.4} />
          ) : (
            <FileText size={14} strokeWidth={2.2} />
          )}
        </div>

        <span className="overview-checklist-label">{label}</span>
      </div>

      <span className="overview-checklist-state">{value || "—"}</span>
    </div>
  );
}

const FORM_KEYS = [
  "primary_color",
  "secondary_color",
  "theme",
  "about",
  "contact_email",
  "contact_phone",
  "website",
  "instagram",
  "facebook",
  "tiktok",
  "whatsapp",
];

const buildFormFromProfile = (profile) => ({
  primary_color: profile?.primary_color || "",
  secondary_color: profile?.secondary_color || "",
  theme: profile?.theme || "",
  about: profile?.about || "",
  contact_email: profile?.contact_email || "",
  contact_phone: profile?.contact_phone || "",
  website: profile?.website || "",
  instagram: profile?.instagram || "",
  facebook: profile?.facebook || "",
  tiktok: profile?.tiktok || "",
  whatsapp: profile?.whatsapp || "",
});

const normalizeWebsite = (value) => {
  const cleaned = String(value || "").trim();

  if (!cleaned) return "";
  if (/^https?:\/\//i.test(cleaned)) return cleaned;

  return `https://${cleaned}`;
};

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { businessId } = useParams();
  const toast = useAppToast();

  const outletContext = useOutletContext() || {};
  const {
    business: outletBusiness = null,
    profile: outletProfile = null,
    membership: outletMembership = null,
    setBusiness: setOutletBusiness,
    setProfile: setOutletProfile,
    setMembership: setOutletMembership,
  } = outletContext;

  const [business, setBusiness] = useState(outletBusiness);
  const [profile, setProfile] = useState(outletProfile);
  const [membership, setMembership] = useState(outletMembership);

  const [isEditOpen, setIsEditOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState(null);

  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState(buildFormFromProfile(outletProfile));

  useEffect(() => {
    setBusiness(outletBusiness || null);
  }, [outletBusiness]);

  useEffect(() => {
    setProfile(outletProfile || null);
  }, [outletProfile]);

  useEffect(() => {
    setMembership(outletMembership || null);
  }, [outletMembership]);

  useEffect(() => {
    setForm(buildFormFromProfile(profile));
  }, [profile]);

  useEffect(() => {
    if (!isEditOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isEditOpen]);

  const dirtyFields = useMemo(() => {
    const source = buildFormFromProfile(profile);
    const changed = {};

    for (const key of FORM_KEYS) {
      let nextValue = form[key] ?? "";
      const currentValue = source[key] ?? "";

      if (key === "website") {
        nextValue = normalizeWebsite(nextValue);
      } else {
        nextValue = String(nextValue);
      }

      if (nextValue !== currentValue) {
        changed[key] = nextValue;
      }
    }

    return changed;
  }, [form, profile]);

  const dirty = useMemo(() => {
    return Object.keys(dirtyFields).length > 0 || Boolean(logoFile);
  }, [dirtyFields, logoFile]);

  const completionScore = useMemo(() => {
    const fields = [
      form.primary_color,
      form.secondary_color,
      form.theme,
      form.about,
      form.contact_email,
      form.contact_phone,
      form.website,
      form.instagram,
      form.facebook,
      form.tiktok,
      form.whatsapp,
      profile?.logo || logoFile,
    ];

    const done = fields.filter(Boolean).length;
    return Math.round((done / fields.length) * 100);
  }, [form, profile, logoFile]);

  const brandingStrength = useMemo(() => {
    if (completionScore >= 85) return "Strong";
    if (completionScore >= 60) return "Good";
    if (completionScore >= 35) return "Partial";
    return "Weak";
  }, [completionScore]);

  const headerTitle = business?.name || "Business Profile";
  const headerEmail =
    form.contact_email || profile?.contact_email || "No contact email";

  const logoPreview = useMemo(() => {
    if (logoFile) {
      return URL.createObjectURL(logoFile);
    }
    return profile?.logo || "";
  }, [logoFile, profile]);

  useEffect(() => {
    return () => {
      if (logoPreview && logoFile) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview, logoFile]);

  const quickActions = [
    {
      icon: Settings,
      title: "Edit Profile",
      description: "Open business profile editing in a top popup panel.",
      meta: "Popup",
      onClick: () => setIsEditOpen(true),
    },
    {
      icon: FileText,
      title: "Profile Details",
      description: "Review the readable business profile details page.",
      meta: "Read only",
      onClick: () => navigate(`/business/${businessId}/profile/details`),
    },
    {
      icon: ArrowLeft,
      title: "Back to Overview",
      description: "Return to the profile overview page.",
      meta: membership?.role || "Live",
      onClick: () => navigate(`/business/${businessId}/profile`),
    },
    {
      icon: Building2,
      title: "Business Home",
      description: "Go back to the workspace profile summary.",
      meta: "Live",
      onClick: () => navigate(`/business/${businessId}/profile`),
    },
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPageError("");
    setPageMessage("");
    // clear per-field error when user edits that field
    setFieldErrors((prev) => {
      if (!prev || !prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const applyLiveState = (payload) => {
    const nextBusiness = payload?.business || business;
    const nextProfile = payload?.profile || profile;
    const nextMembership = payload?.membership || membership;

    setBusiness(nextBusiness);
    setProfile(nextProfile);
    setMembership(nextMembership);

    if (typeof setOutletBusiness === "function" && payload?.business) {
      setOutletBusiness(payload.business);
    }

    if (typeof setOutletProfile === "function" && payload?.profile) {
      setOutletProfile(payload.profile);
    }

    if (typeof setOutletMembership === "function" && payload?.membership) {
      setOutletMembership(payload.membership);
    }

    if (payload?.profile) {
      setForm(buildFormFromProfile(payload.profile));
    }

    setLogoFile(null);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    navigate(`/business/${businessId}/profile`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!dirty) {
      return;
    }

    try {
      setSubmitting(true);
      setPageError("");
      setPageMessage("");

      const payload = new FormData();

      Object.entries(dirtyFields).forEach(([key, value]) => {
        payload.append(key, value);
      });

      if (logoFile) {
        payload.append("logo", logoFile);
      }

      // client-side validation for website to avoid confusing server errors
      const websiteToCheck = dirtyFields.website;
      if (websiteToCheck) {
        try {
          // will throw for invalid urls
          // eslint-disable-next-line no-new
          new URL(websiteToCheck);
        } catch (err) {
          const msg = "Enter a valid URL (e.g. https://www.example.com).";
          setFieldErrors((prev) => ({ ...(prev || {}), website: msg }));
          setPageError(msg);
          toast.error(msg);
          setSubmitting(false);
          return;
        }
      }

      const response = await apiPatch(
        `/api/businesses/${businessId}/profile/`,
        payload
      );

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        // If server returned field validation errors (e.g. { website: ["Enter a valid URL."] })
        if (data && typeof data === "object") {
          const mapped = {};
          for (const [k, v] of Object.entries(data)) {
            try {
              if (Array.isArray(v)) mapped[k] = String(v.join(" "));
              else if (typeof v === "object") mapped[k] = JSON.stringify(v);
              else mapped[k] = String(v);
            } catch {
              mapped[k] = String(v);
            }
          }

          if (Object.keys(mapped).length > 0) {
            setFieldErrors(mapped);
            const firstMsg = mapped[Object.keys(mapped)[0]];
            const toastMsg = firstMsg || `Failed to update business profile (${response.status}).`;
            setPageError("Please fix the highlighted fields and try again.");
            toast.error(toastMsg);
            return;
          }
        }

        const message =
          data?.detail || data?.error || `Failed to update business profile (${response.status}).`;

        const msg = typeof message === "string" ? message : JSON.stringify(message);
        setPageError(msg);
        toast.error(msg);
        return;
      }

      // success
      setFieldErrors({});
      applyLiveState(data);
      setPageMessage(data?.message || "Business profile updated successfully.");
      toast.success(data?.message || "Business profile updated successfully.");

      navigate(`/business/${businessId}/profile`, {
        replace: true,
        state: { profileUpdatedAt: Date.now() },
      });
    } catch (error) {
      console.error("Profile update failed:", error);
      const message =
        error?.message || "Failed to update business profile.";
      setPageError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!business) {
    return (
      <div className="account-overview-page">
        <Card
          variant="default"
          padding="md"
          contentSpacing="md"
          className="card-rect overview-hero-card"
        >
          <CardHeader
            title="Unable to load edit page"
            subtitle="Business context is missing."
          />
          <CardContent>
            <Button
              type="button"
              variant="primary"
              size="md"
              emphasis="medium"
              onClick={() => navigate(`/business/${businessId}/profile`)}
            >
              Back to profile overview
            </Button>
          </CardContent>
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
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt={headerTitle}
                      className="profile-header-avatar-image"
                    />
                  ) : (
                    <div className="profile-header-avatar-fallback">
                      <Building2 size={34} />
                    </div>
                  )}

                  <label className="profile-header-avatar-upload">
                    {submitting ? (
                      <LoaderCircle size={15} className="animate-spin" />
                    ) : (
                      <Camera size={15} />
                    )}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                      className="hidden"
                      onChange={(event) =>
                        setLogoFile(event.target.files?.[0] || null)
                      }
                      disabled={submitting}
                    />
                  </label>
                </div>

                <div className="profile-header-copy">
                  <p className="profile-header-username">{headerTitle}</p>
                  <p className="profile-header-email">{headerEmail}</p>
                </div>
              </div>
            </div>

            <div className="overview-hero-action">
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <TooltipPortal
                  content={
                    isEditOpen ? "Edit popup is already open" : "Open edit popup"
                  }
                >
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
                  onClick={() => navigate(`/business/${businessId}/profile`)}
                >
                  <span className="inline-flex items-center gap-2">
                    <ArrowLeft size={16} />
                    Profile Overview
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

          <div
            className="overview-status-strip"
            aria-label="Business profile quick status"
          >
            <OverviewStatusPill
              icon={BadgeCheck}
              title="Edit state"
              value={dirty ? "Unsaved" : "Synced"}
              tone={dirty ? "gold" : "blue"}
            />

            <OverviewStatusPill
              icon={FileText}
              title="Completion"
              value={`${completionScore}%`}
              tone={completionScore >= 60 ? "blue" : "gold"}
            />

            <OverviewStatusPill
              icon={Palette}
              title="Theme"
              value={form.theme || "Not set"}
              tone={form.theme ? "blue" : "gold"}
            />

            <OverviewStatusPill
              icon={ImageIcon}
              title="Logo"
              value={logoFile ? "New file" : profile?.logo ? "Uploaded" : "Missing"}
              tone={logoFile || profile?.logo ? "blue" : "gold"}
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
            <CardHeader
              title="Profile actions"
              className="overview-section-header"
            />
            <CardContent className="overview-nav-grid">
              {quickActions.map((item, index) => (
                <NavigationCard
                  key={item.title}
                  index={index}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  meta={item.meta}
                  onClick={item.onClick}
                />
              ))}
            </CardContent>
          </Card>

          <Card
            variant="default"
            padding="sm"
            contentSpacing="sm"
            className="card-rect"
          >
            <CardHeader
              title="Profile summary"
              className="overview-section-header"
            />
            <CardContent className="overview-checklist">
              <SummaryRow label="Business name" value={business?.name || "—"} done />
              <SummaryRow
                label="Brand strength"
                value={brandingStrength}
                done={completionScore >= 60}
              />
              <SummaryRow
                label="Unsaved changes"
                value={dirty ? "Yes" : "No"}
                done={!dirty}
              />
              <SummaryRow
                label="Contact email"
                value={form.contact_email || "Not added"}
                done={Boolean(form.contact_email)}
              />
              <SummaryRow
                label="Website"
                value={form.website || "Not added"}
                done={Boolean(form.website)}
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
            <CardHeader
              title="Branding status"
              className="overview-section-header"
            />
            <CardContent className="overview-checklist">
              <SummaryRow
                label="Primary color"
                value={form.primary_color || "Not set"}
                done={Boolean(form.primary_color)}
              />
              <SummaryRow
                label="Secondary color"
                value={form.secondary_color || "Not set"}
                done={Boolean(form.secondary_color)}
              />
              <SummaryRow
                label="Theme"
                value={form.theme || "Not set"}
                done={Boolean(form.theme)}
              />
              <SummaryRow
                label="About section"
                value={form.about ? "Added" : "Missing"}
                done={Boolean(form.about)}
              />
            </CardContent>
          </Card>

          <Card
            variant="default"
            padding="sm"
            contentSpacing="sm"
            className="card-rect"
          >
            <CardHeader
              title="Contact status"
              className="overview-section-header"
            />
            <CardContent className="overview-checklist">
              <SummaryRow
                label="Phone"
                value={form.contact_phone || "Not added"}
                done={Boolean(form.contact_phone)}
              />
              <SummaryRow
                label="Instagram"
                value={form.instagram || "Not added"}
                done={Boolean(form.instagram)}
              />
              <SummaryRow
                label="Facebook"
                value={form.facebook || "Not added"}
                done={Boolean(form.facebook)}
              />
              <SummaryRow
                label="TikTok"
                value={form.tiktok || "Not added"}
                done={Boolean(form.tiktok)}
              />
              <SummaryRow
                label="WhatsApp"
                value={form.whatsapp || "Not added"}
                done={Boolean(form.whatsapp)}
              />
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
                  <h2 className="profile-edit-panel-title">Edit business profile</h2>
                  <p className="profile-edit-panel-subtitle">
                    Same UI system as user profile. Clean popup, same inputs, same form structure.
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
                <Form onSubmit={handleSubmit} spacing="md">
                  <FormSection title="Branding">
                    <FormRow>
                      <div className="profile-edit-select-wrap">
                        <label className="profile-edit-select-label">
                          Logo
                        </label>

                        <label className="flex min-h-[48px] cursor-pointer items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 transition hover:border-gray-300 dark:border-[#323232] dark:bg-[#1f1f1f] dark:text-gray-200 dark:hover:border-[#3a3a3a]">
                          <span className="inline-flex min-w-0 items-center gap-3">
                            <ImageIcon size={16} />
                            <span className="truncate">
                              {logoFile
                                ? logoFile.name
                                : profile?.logo
                                ? "Replace current logo"
                                : "Choose logo file"}
                            </span>
                          </span>

                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) =>
                              setLogoFile(event.target.files?.[0] || null)
                            }
                            disabled={submitting}
                          />
                        </label>
                      </div>

                      <Input
                        id="theme"
                        name="theme"
                        type="text"
                        label="Theme"
                        value={form.theme}
                        onChange={handleChange}
                        placeholder="default"
                        error={fieldErrors.theme}
                        size="lg"
                        disabled={submitting}
                      />
                    </FormRow>

                    <FormRow>
                      <Input
                        id="primary_color"
                        name="primary_color"
                        type="text"
                        label="Primary color"
                        value={form.primary_color}
                        onChange={handleChange}
                        placeholder="#1F75FE"
                        error={fieldErrors.primary_color}
                        size="lg"
                        disabled={submitting}
                      />

                      <Input
                        id="secondary_color"
                        name="secondary_color"
                        type="text"
                        label="Secondary color"
                        value={form.secondary_color}
                        onChange={handleChange}
                        placeholder="#f2a705"
                        error={fieldErrors.secondary_color}
                        size="lg"
                        disabled={submitting}
                      />
                    </FormRow>

                    <div className="grid gap-2">
                      <label
                        htmlFor="about"
                        className="text-sm font-medium text-gray-700 dark:text-gray-200"
                      >
                        About
                      </label>
                      <textarea
                        id="about"
                        name="about"
                        value={form.about}
                        onChange={handleChange}
                        rows={5}
                        placeholder="Tell customers about your business..."
                        disabled={submitting}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#1F75FE] focus:ring-4 focus:ring-[#1F75FE]/10 dark:border-[#323232] dark:bg-[#1f1f1f] dark:text-gray-100 dark:placeholder:text-gray-500"
                      />
                    </div>
                  </FormSection>

                  <FormSection title="Contact and social">
                    <FormRow>
                      <Input
                        id="contact_email"
                        name="contact_email"
                        type="email"
                        label="Contact email"
                        value={form.contact_email}
                        onChange={handleChange}
                        placeholder="business@example.com"
                        hint="Used for customer contact and notifications."
                        error={fieldErrors.contact_email}
                        size="lg"
                        disabled={submitting}
                      />

                      <Input
                        id="contact_phone"
                        name="contact_phone"
                        type="text"
                        label="Contact phone"
                        value={form.contact_phone}
                        onChange={handleChange}
                        placeholder="+255..."
                        hint="Include country code (e.g. +1 555 555 555)."
                        error={fieldErrors.contact_phone}
                        size="lg"
                        disabled={submitting}
                      />
                    </FormRow>

                    <FormRow>
                      <Input
                        id="website"
                        name="website"
                        type="url"
                        label="Website"
                        value={form.website}
                        onChange={handleChange}
                        placeholder="https://www.example.com"
                        hint="Include https:// — we'll normalize if missing."
                        error={fieldErrors.website}
                        size="lg"
                        disabled={submitting}
                      />

                      <Input
                        id="whatsapp"
                        name="whatsapp"
                        type="text"
                        label="WhatsApp"
                        value={form.whatsapp}
                        onChange={handleChange}
                        placeholder="+255..."
                        error={fieldErrors.whatsapp}
                        size="lg"
                        disabled={submitting}
                      />
                    </FormRow>

                    <FormRow>
                      <Input
                        id="instagram"
                        name="instagram"
                        type="text"
                        label="Instagram"
                        value={form.instagram}
                        onChange={handleChange}
                        placeholder="@yourbrand"
                        error={fieldErrors.instagram}
                        size="lg"
                        disabled={submitting}
                      />

                      <Input
                        id="facebook"
                        name="facebook"
                        type="text"
                        label="Facebook"
                        value={form.facebook}
                        onChange={handleChange}
                        placeholder="facebook page or handle"
                        error={fieldErrors.facebook}
                        size="lg"
                        disabled={submitting}
                      />
                    </FormRow>

                    <FormRow>
                      <Input
                        id="tiktok"
                        name="tiktok"
                        type="text"
                        label="TikTok"
                        value={form.tiktok}
                        onChange={handleChange}
                        placeholder="@tiktokhandle"
                        error={fieldErrors.tiktok}
                        size="lg"
                        disabled={submitting}
                      />

                      <div />
                    </FormRow>
                  </FormSection>

                  <FormActions className="profile-edit-actions">
                    <Button
                      type="button"
                      variant="secondary"
                      size="md"
                      emphasis="medium"
                      onClick={closeEditModal}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      emphasis="medium"
                      disabled={submitting || !dirty}
                    >
                      <span className="inline-flex items-center gap-2">
                        {submitting ? (
                          <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                          <BadgeCheck size={16} />
                        )}
                        {submitting ? "Saving..." : "Save Changes"}
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