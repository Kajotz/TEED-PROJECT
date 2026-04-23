export function resolvePostAuthRoute(authState) {
  if (!authState?.authenticated) {
    return "/login";
  }

  if (!authState?.identity_verified) {
    return "/verify";
  }

  const missingFields = Array.isArray(authState?.missing_fields)
    ? authState.missing_fields
    : [];

  if (missingFields.length > 0) {
    return "/complete-account";
  }

  const businessIds = Array.isArray(authState?.accessible_business_ids)
    ? authState.accessible_business_ids
    : [];

  if (!authState?.has_business_access || businessIds.length === 0) {
    return "/account/home";
  }

  if (businessIds.length === 1) {
    return `/business/${businessIds[0]}/profile`;
  }

  const activeBusinessId = authState?.active_business_id;

  if (activeBusinessId && businessIds.includes(activeBusinessId)) {
    return `/business/${activeBusinessId}/profile`;
  }

  return "/account/switch-business";
}