import { apiGet, apiPost } from "@/utils/api";

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage =
      data?.error?.name?.[0] ||
      data?.error?.business_type?.[0] ||
      data?.error?.detail ||
      data?.detail ||
      data?.message ||
      "Request failed";

    throw new Error(errorMessage);
  }

  return data;
}

export async function createBusiness(payload) {
  const response = await apiPost("/api/businesses/create/", payload);
  return handleResponse(response);
}

export async function activateBusiness(businessId) {
  const response = await apiPost(`/api/businesses/${businessId}/activate/`, {});
  return handleResponse(response);
}

export async function getBusinesses() {
  const response = await apiGet("/api/businesses/");
  return handleResponse(response);
}