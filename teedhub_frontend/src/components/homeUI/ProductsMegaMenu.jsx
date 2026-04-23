import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import "@/styles/homeUI/ProductsMegaMenu.css";

function DesktopMegaMenu({ isOpen, sections, onNavigate }) {
  const scrollRef = useRef(null);
  const [scrollState, setScrollState] = useState({
    canScrollUp: false,
    canScrollDown: false,
  });

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScrollTop = el.scrollHeight - el.clientHeight;
    const hasOverflow = maxScrollTop > 6;

    setScrollState({
      canScrollUp: hasOverflow && el.scrollTop > 6,
      canScrollDown: hasOverflow && el.scrollTop < maxScrollTop - 6,
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();

    const handleScroll = () => updateScrollState();
    const handleResize = () => updateScrollState();

    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, sections]);

  useEffect(() => {
    if (!isOpen) return;

    const frame = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = 0;
      updateScrollState();
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const scrollByAmount = (direction) => {
    const el = scrollRef.current;
    if (!el) return;

    const amount = Math.max(180, Math.round(el.clientHeight * 0.55));
    el.scrollBy({
      top: direction === "down" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="products-mega-panel"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          <div className="products-mega-shell">
            <button
              type="button"
              className={clsx("products-mega-scroll-btn", "up", {
                visible: scrollState.canScrollUp,
              })}
              onClick={() => scrollByAmount("up")}
              aria-label="Scroll products menu up"
            >
              <ChevronUp size={16} />
            </button>

            <div
              className={clsx("products-mega-scroll-fade", "top", {
                visible: scrollState.canScrollUp,
              })}
              aria-hidden="true"
            />

            <div
              ref={scrollRef}
              className="products-mega-scroll"
            >
              <div className="products-mega-grid">
                {sections.map((section) => (
                  <div key={section.title} className="products-mega-column">
                    <p className="products-mega-title">{section.title}</p>
                    <p className="products-mega-description">{section.description}</p>

                    <div className="products-mega-items">
                      {section.items.map((item) => (
                        <div key={item.label} className="products-mega-item">
                          <a
                            href={item.href}
                            className="products-mega-item-head"
                            onClick={onNavigate}
                          >
                            <span className="products-mega-item-label-row">
                              <span className="products-mega-item-label">
                                {item.label}
                              </span>
                              <ArrowUpRight
                                size={14}
                                className="products-mega-direction-icon"
                              />
                            </span>

                            <span className="products-mega-item-copy">
                              {item.description}
                            </span>
                          </a>

                          <div className="products-mega-sublinks">
                            {item.sublinks.map((sub) => (
                              <a
                                key={sub.label}
                                href={sub.href}
                                className="products-mega-sublink"
                                onClick={onNavigate}
                              >
                                <span className="products-mega-sublink-row">
                                  <ChevronRight
                                    size={13}
                                    className="products-mega-sub-icon"
                                  />
                                  <span>{sub.label}</span>
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={clsx("products-mega-scroll-fade", "bottom", {
                visible: scrollState.canScrollDown,
              })}
              aria-hidden="true"
            />

            <button
              type="button"
              className={clsx("products-mega-scroll-btn", "down", {
                visible: scrollState.canScrollDown,
              })}
              onClick={() => scrollByAmount("down")}
              aria-label="Scroll products menu down"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MobileMegaMenu({ sections, onNavigate, productsLabel = "Products" }) {
  const [expandedIds, setExpandedIds] = useState({});

  useEffect(() => {
    const initial = {};
    sections.forEach((section, sectionIndex) => {
      if (sectionIndex === 0) {
        initial[`section-${sectionIndex}`] = true;
      }
    });
    setExpandedIds(initial);
  }, [sections]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="products-mobile-shell">
      <div className="products-mobile-root">
        <div className="products-mobile-root-label">{productsLabel}</div>

        <div className="products-mobile-sections">
          {sections.map((section, sectionIndex) => {
            const sectionId = `section-${sectionIndex}`;
            const sectionExpanded = Boolean(expandedIds[sectionId]);

            return (
              <div
                key={section.title}
                className={clsx("products-mobile-group", {
                  expanded: sectionExpanded,
                })}
              >
                <div className="products-mobile-group-row">
                  <button
                    type="button"
                    className={clsx("products-mobile-group-button", {
                      open: sectionExpanded,
                    })}
                    onClick={() => toggleExpand(sectionId)}
                    aria-expanded={sectionExpanded}
                  >
                    <div className="products-mobile-group-content">
                      <span className="products-mobile-group-title">{section.title}</span>
                      <span className="products-mobile-group-copy">
                        {section.description}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="products-mobile-expand-btn"
                    onClick={() => toggleExpand(sectionId)}
                    aria-label={
                      sectionExpanded ? "Collapse section" : "Expand section"
                    }
                  >
                    <ChevronDown
                      size={16}
                      className={clsx("products-mobile-expand-icon", {
                        open: sectionExpanded,
                      })}
                    />
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {sectionExpanded && (
                    <motion.div
                      className="products-mobile-panel-wrap"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <div className="products-mobile-panel">
                        {section.items.map((item, itemIndex) => {
                          const itemId = `${sectionId}-item-${itemIndex}`;
                          const itemExpanded = Boolean(expandedIds[itemId]);

                          return (
                            <div
                              key={item.label}
                              className={clsx("products-mobile-item-group", {
                                expanded: itemExpanded,
                              })}
                            >
                              <div className="products-mobile-item-row">
                                <a
                                  href={item.href}
                                  className="products-mobile-item-main"
                                  onClick={onNavigate}
                                >
                                  <span className="products-mobile-item-main-top">
                                    <span className="products-mobile-item-label">
                                      {item.label}
                                    </span>
                                    <ArrowUpRight size={14} />
                                  </span>

                                  <span className="products-mobile-item-copy">
                                    {item.description}
                                  </span>
                                </a>

                                <button
                                  type="button"
                                  className="products-mobile-item-expand-btn"
                                  onClick={() => toggleExpand(itemId)}
                                  aria-label={
                                    itemExpanded ? "Collapse links" : "Expand links"
                                  }
                                >
                                  <ChevronDown
                                    size={15}
                                    className={clsx(
                                      "products-mobile-item-expand-icon",
                                      {
                                        open: itemExpanded,
                                      }
                                    )}
                                  />
                                </button>
                              </div>

                              <AnimatePresence initial={false}>
                                {itemExpanded && (
                                  <motion.div
                                    className="products-mobile-sublinks-wrap"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.16 }}
                                  >
                                    <div className="products-mobile-sublinks">
                                      {item.sublinks.map((sub) => (
                                        <a
                                          key={sub.label}
                                          href={sub.href}
                                          className="products-mobile-sublink"
                                          onClick={onNavigate}
                                        >
                                          <ChevronRight size={13} />
                                          <span>{sub.label}</span>
                                        </a>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ProductsMegaMenu({
  isOpen = false,
  sections = [],
  onNavigate,
  mode = "desktop",
  productsLabel = "Products",
}) {
  if (mode === "mobile") {
    return (
      <MobileMegaMenu
        sections={sections}
        onNavigate={onNavigate}
        productsLabel={productsLabel}
      />
    );
  }

  return (
    <DesktopMegaMenu
      isOpen={isOpen}
      sections={sections}
      onNavigate={onNavigate}
    />
  );
}