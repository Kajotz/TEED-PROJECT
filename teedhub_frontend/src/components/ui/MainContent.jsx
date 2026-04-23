import clsx from "clsx";
import "@/styles/ui/main-content.css";

export default function MainContent({
  children,
  className = "",
  innerClassName = "",
  pageClassName = "",
  maxWidth = "1440px",
  flush = false,
  padded = true,
  as: Component = "main",
}) {
  return (
    <Component
      className={clsx("app-main-content", className)}
      role={Component === "main" ? undefined : "main"}
    >
      <div
        className={clsx(
          "app-main-content-inner",
          {
            "app-main-content-inner-flush": flush,
            "app-main-content-inner-padded": padded && !flush,
          },
          innerClassName
        )}
        style={{ "--app-content-max-width": maxWidth }}
      >
        <div className={clsx("app-page-stack", pageClassName)}>{children}</div>
      </div>
    </Component>
  );
}