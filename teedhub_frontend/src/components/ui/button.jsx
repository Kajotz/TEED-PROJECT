import React from "react";
import { Link } from "react-router-dom";
import "@/styles/ui/button.css";

export default function Button({
  children,

  // behavior
  to,
  href,
  onClick,
  type = "button",

  // style
  variant = "primary",
  size = "md",
  fullWidth = false,
  wrap = false,
  className = "",

  // UI extras (IMPORTANT: DO NOT PASS TO DOM)
  loading = false,
  leftIcon = null,
  rightIcon = null,

  // safe DOM props
  disabled,
  id,
  title,
  style,

}) {
  const isDisabled = disabled || loading;

  const classes = [
    "btn",
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? "btn-full" : "",
    wrap ? "btn-wrap" : "",
    loading ? "btn-loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {!loading && leftIcon && <span className="btn-icon">{leftIcon}</span>}

      <span className="btn-text">
        {loading ? "Loading..." : children}
      </span>

      {!loading && rightIcon && <span className="btn-icon">{rightIcon}</span>}
    </>
  );

  const sharedProps = {
    className: classes,
    onClick,
    id,
    title,
    style,
    "aria-busy": loading ? "true" : undefined,
  };

  // 🔵 INTERNAL ROUTING
  if (to) {
    return (
      <Link to={to} {...sharedProps}>
        {content}
      </Link>
    );
  }

  // 🟢 EXTERNAL LINK
  if (href) {
    return (
      <a href={href} {...sharedProps}>
        {content}
      </a>
    );
  }

  // ⚪ BUTTON
  return (
    <button
      type={type}
      disabled={isDisabled}
      {...sharedProps}
    >
      {content}
    </button>
  );
}