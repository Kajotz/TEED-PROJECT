import React, { forwardRef } from "react";
import clsx from "clsx";

const inputSizes = {
  sm: "h-10 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-4 text-base",
};

const inputVariants = {
  default: [
    "border",
    "border-gray-200",
    "bg-white",
    "text-gray-900",
    "placeholder:text-gray-400",
    "focus:border-[#1F75FE]",
    "focus:ring-4",
    "focus:ring-[#1F75FE]/10",
    "dark:border-white/10",
    "dark:bg-white/5",
    "dark:text-gray-100",
    "dark:placeholder:text-gray-500",
    "dark:focus:border-[#1F75FE]",
    "dark:focus:ring-[#1F75FE]/20",
  ].join(" "),

  filled: [
    "border",
    "border-transparent",
    "bg-gray-100",
    "text-gray-900",
    "placeholder:text-gray-400",
    "focus:border-[#1F75FE]",
    "focus:ring-4",
    "focus:ring-[#1F75FE]/10",
    "dark:bg-white/10",
    "dark:text-gray-100",
    "dark:placeholder:text-gray-500",
    "dark:focus:border-[#1F75FE]",
    "dark:focus:ring-[#1F75FE]/20",
  ].join(" "),

  error: [
    "border",
    "border-red-400",
    "bg-white",
    "text-gray-900",
    "placeholder:text-gray-400",
    "focus:border-red-500",
    "focus:ring-4",
    "focus:ring-red-500/10",
    "dark:border-red-500/80",
    "dark:bg-white/5",
    "dark:text-gray-100",
    "dark:placeholder:text-gray-500",
    "dark:focus:border-red-400",
    "dark:focus:ring-red-500/20",
  ].join(" "),
};

const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    size = "md",
    variant,
    className = "",
    wrapperClassName = "",
    leftIcon,
    rightIcon,
    disabled = false,
    id,
    ...props
  },
  ref
) {
  const resolvedVariant = error ? "error" : variant || "default";

  return (
    <div className={clsx("w-full", wrapperClassName)}>
      {label && (
        <label
          htmlFor={id}
          className={clsx(
            "mb-2 block text-sm font-medium transition-colors",
            error
              ? "text-red-600 dark:text-red-400"
              : "text-gray-700 dark:text-gray-200"
          )}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span
            className={clsx(
              "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors",
              error
                ? "text-red-400 dark:text-red-400"
                : "text-gray-400 dark:text-gray-500"
            )}
          >
            {leftIcon}
          </span>
        )}

        <input
          id={id}
          ref={ref}
          disabled={disabled}
          className={clsx(
            "w-full rounded-2xl outline-none transition-all duration-200",
            "disabled:cursor-not-allowed disabled:opacity-60",
            inputSizes[size],
            inputVariants[resolvedVariant],
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          {...props}
        />

        {rightIcon && (
          <span
            className={clsx(
              "absolute right-3 top-1/2 -translate-y-1/2 transition-colors",
              error
                ? "text-red-400 dark:text-red-400"
                : "text-gray-400 dark:text-gray-500"
            )}
          >
            {rightIcon}
          </span>
        )}
      </div>

      {error ? (
        <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;