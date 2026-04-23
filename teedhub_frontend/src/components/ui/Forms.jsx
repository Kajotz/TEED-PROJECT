import React from "react";
import clsx from "clsx";
import "@/styles/ui/Forms.css";

const gapMap = {
  none: "0px",
  sm: "16px",
  md: "22px",
  lg: "28px",
  xl: "36px",
};

export default function Form({
  children,
  className = "",
  spacing = "md",
  as: Component = "form",
  style = {},
  ...props
}) {
  return (
    <Component
      className={clsx("ui-form w-full", className)}
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: gapMap[spacing] || gapMap.md,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}

export function FormSection({ children, className = "", style = {} }) {
  return (
    <div
      className={clsx("ui-form-section", className)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        width: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function FormRow({ children, className = "", style = {} }) {
  return (
    <div
      className={clsx("ui-form-row", className)}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
        width: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function FormActions({ children, className = "", style = {} }) {
  return (
    <div
      className={clsx("ui-form-actions", className)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        paddingTop: "8px",
        width: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function FormMeta({ children, className = "", style = {} }) {
  return (
    <div
      className={clsx("ui-form-meta", className)}
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        paddingTop: "4px",
        width: "100%",
        ...style,
      }}
    >
      {children}
    </div>
  );
}