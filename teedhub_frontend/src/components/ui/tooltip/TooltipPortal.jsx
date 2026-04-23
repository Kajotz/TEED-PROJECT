import React, {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const MOBILE_BREAKPOINT = 640;

function isTouchLikeDevice() {
  if (typeof window === "undefined") return false;

  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

function getPlacement(triggerRect, tooltipRect, placement, offset) {
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let top = 0;
  let left = 0;
  let finalPlacement = placement;

  const centeredLeft =
    triggerRect.left + scrollX + triggerRect.width / 2 - tooltipRect.width / 2;

  const topPosition = triggerRect.top + scrollY - tooltipRect.height - offset;
  const bottomPosition = triggerRect.bottom + scrollY + offset;

  if (placement === "top") {
    if (topPosition < scrollY + 8) {
      finalPlacement = "bottom";
    }
  }

  if (placement === "bottom") {
    if (bottomPosition + tooltipRect.height > scrollY + viewportHeight - 8) {
      finalPlacement = "top";
    }
  }

  if (finalPlacement === "top") {
    top = triggerRect.top + scrollY - tooltipRect.height - offset;
    left = centeredLeft;
  } else {
    top = triggerRect.bottom + scrollY + offset;
    left = centeredLeft;
  }

  const minLeft = scrollX + 8;
  const maxLeft = scrollX + viewportWidth - tooltipRect.width - 8;
  left = Math.max(minLeft, Math.min(left, maxLeft));

  return { top, left, placement: finalPlacement };
}

export default function TooltipPortal({
  content,
  children,
  placement = "top",
  offset = 10,
  delay = 120,
  disabled = false,
  disableOnMobile = true,
  disableOnTouch = true,
  className = "",
}) {
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timerRef = useRef(null);
  const tooltipId = useId();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({
    top: 0,
    left: 0,
    placement,
  });

  useEffect(() => {
    setMounted(true);

    return () => {
      window.clearTimeout(timerRef.current);
    };
  }, []);

  const shouldDisable =
    disabled ||
    !content ||
    (disableOnMobile &&
      typeof window !== "undefined" &&
      window.innerWidth <= MOBILE_BREAKPOINT) ||
    (disableOnTouch && isTouchLikeDevice());

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    setCoords(getPlacement(triggerRect, tooltipRect, placement, offset));
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, content, placement, offset]);

  useEffect(() => {
    if (!open) return;

    const handleUpdate = () => updatePosition();

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [open, content, placement, offset]);

  const showTooltip = () => {
    if (shouldDisable) return;

    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setOpen(true);
    }, delay);
  };

  const hideTooltip = () => {
    window.clearTimeout(timerRef.current);
    setOpen(false);
  };

  if (!isValidElement(children)) {
    throw new Error("TooltipPortal expects exactly one valid React element child.");
  }

  const childProps = {
    ref: (node) => {
      triggerRef.current = node;

      const originalRef = children.ref;
      if (typeof originalRef === "function") {
        originalRef(node);
      } else if (originalRef && typeof originalRef === "object") {
        originalRef.current = node;
      }
    },
    onMouseEnter: (event) => {
      children.props.onMouseEnter?.(event);
      showTooltip();
    },
    onMouseLeave: (event) => {
      children.props.onMouseLeave?.(event);
      hideTooltip();
    },
    onFocus: (event) => {
      children.props.onFocus?.(event);
      showTooltip();
    },
    onBlur: (event) => {
      children.props.onBlur?.(event);
      hideTooltip();
    },
    "aria-describedby": open && !shouldDisable ? tooltipId : undefined,
  };

  return (
    <>
      {cloneElement(children, childProps)}

      {mounted &&
        open &&
        !shouldDisable &&
        createPortal(
          <div
            id={tooltipId}
            ref={tooltipRef}
            role="tooltip"
            className={`ui-tooltip ui-tooltip--${coords.placement} ${className}`.trim()}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}