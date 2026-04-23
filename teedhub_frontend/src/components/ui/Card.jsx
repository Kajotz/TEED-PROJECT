import React from "react";
import clsx from "clsx";
import "@/styles/ui/Cards.css";

const variants = {
  default: "card-base card-default",
  soft: "card-base card-soft",
  outline: "card-base card-outline",
};

const paddingMap = {
  none: "0px",
  sm: "16px",
  md: "20px",
  lg: "24px",
  xl: "32px",
};

const gapMap = {
  none: "0px",
  sm: "12px",
  md: "16px",
  lg: "20px",
  xl: "24px",
};

export default function Card({
  children,
  className = "",
  variant = "default",
  padding = "md",
  contentSpacing = "md",
  as: Component = "div",
  style = {},
}) {
  return (
    <Component
      className={clsx(variants[variant], className)}
      style={{
        padding: paddingMap[padding] || paddingMap.md,
        ...style,
      }}
    >
      <div
        className="card-inner"
        style={{
          gap: gapMap[contentSpacing] || gapMap.md,
        }}
      >
        {children}
      </div>
    </Component>
  );
}

export function CardHeader({
  title,
  subtitle,
  children,
  className = "",
  style = {},
}) {
  return (
    <div className={clsx("card-header", className)} style={style}>
      {title ? <h3 className="card-title">{title}</h3> : null}
      {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
      {children}
    </div>
  );
}

export function CardContent({ children, className = "", style = {} }) {
  return (
    <div className={clsx("card-content", className)} style={style}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "", style = {} }) {
  return (
    <div className={clsx("card-footer", className)} style={style}>
      {children}
    </div>
  );
}