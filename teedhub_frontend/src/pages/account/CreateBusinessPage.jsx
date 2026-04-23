import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/button";
import Form, { FormActions } from "@/components/ui/Forms";
import { activateBusiness, createBusiness } from "@/api/business";
import { useAppToast } from "@/components/ui/toast/AppToastProvider";
import { useAuthState } from "@/context/AuthStateContext";
import "@/styles/AccountShell/CreateBusinessPage.css";

const BUSINESS_TYPES = [
  { value: "retail", label: "Retail" },
  { value: "service", label: "Service" },
  { value: "online", label: "Online" },
  { value: "creator", label: "Creator" },
];

const pageAnimation = {
  initial: { opacity: 0, y: 16, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.35 },
};

const initialState = {
  name: "",
  business_type: "",
};

export default function CreateBusinessPage() {
  const navigate = useNavigate();
  const toast = useAppToast();
  const { refreshAuthState } = useAuthState();

  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Business name is required.";
    } else if (formData.name.trim().length < 2) {
      nextErrors.name = "Business name is too short.";
    } else if (formData.name.trim().length > 255) {
      nextErrors.name = "Business name is too long.";
    }

    if (!formData.business_type.trim()) {
      nextErrors.business_type = "Business type is required.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.warning("Please fix the form errors first.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: formData.name.trim(),
        business_type: formData.business_type,
      };

      const created = await createBusiness(payload);

      try {
        await activateBusiness(created.id);
      } catch (activationError) {
        console.warn("Business activation failed:", activationError);
        toast.warning("Business created, but activation did not finish cleanly.");
      }

      await refreshAuthState();

      toast.success("Business created successfully.");
      navigate(`/business/${created.id}/overview`, { replace: true });
    } catch (error) {
      console.error("Create business failed:", error);
      toast.error(error?.message || "Failed to create business.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <motion.div {...pageAnimation} className="w-full max-w-[560px]">
        <Card
          variant="soft"
          padding="lg"
          contentSpacing="lg"
          className="rounded-[30px] border border-white/80 bg-white/78 shadow-[0_24px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl"
        >
          <div className="space-y-2">
            <h2 className="create-business-title text-2xl font-semibold tracking-[-0.03em] text-gray-900">
              Create business
            </h2>

            <p className="create-business-subtitle text-sm text-gray-600">
              Add the basic details to open your workspace.
            </p>
          </div>

          <Form onSubmit={handleSubmit} spacing="md">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Business Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                disabled={submitting}
                placeholder="Enter business name"
                autoComplete="organization"
                maxLength={255}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-base text-gray-900 shadow-sm outline-none transition focus:border-[#1F75FE] focus:ring-4 focus:ring-[#1F75FE]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />

              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="business_type"
                className="text-sm font-medium text-gray-700"
              >
                Business Type
              </label>

              <select
                id="business_type"
                name="business_type"
                value={formData.business_type}
                onChange={handleChange}
                disabled={submitting}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-base text-gray-900 shadow-sm outline-none transition focus:border-[#1F75FE] focus:ring-4 focus:ring-[#1F75FE]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Select business type</option>
                {BUSINESS_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              {errors.business_type && (
                <p className="text-sm text-red-600">{errors.business_type}</p>
              )}
            </div>

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
                {submitting ? "Creating..." : "Create Business"}
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="lg"
                emphasis="strong"
                fullWidth
                className="create-business-cancel !min-h-[52px] !rounded-2xl"
                onClick={() => navigate("/account/home")}
                disabled={submitting}
              >
                Cancel
              </Button>
            </FormActions>
          </Form>
        </Card>
      </motion.div>
    </div>
  );
}