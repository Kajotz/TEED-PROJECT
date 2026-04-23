import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import TeedHeroVisual from "@/components/homeUI/TeedHeroVisual";
import "@/styles/homeUI/HeroSection.css";

export default function HeroSection() {
  const { t } = useTranslation("hero");

  return (
    <section className="hero-section">
      <div className="hero-section__content-pane">
        <div className="hero-section__content">
          <div className="hero-section__eyebrow">
            {t("eyebrow")}
          </div>

          <h1 className="hero-section__title">
            {t("title")}
          </h1>

          <p className="hero-section__description">
            {t("description")}
          </p>

          <div className="hero-section__actions">
            <Link
              to="/signup"
              className="hero-section__button hero-section__button--primary"
            >
              {t("actions.getStarted")}
            </Link>

            <Link
              to="/login"
              className="hero-section__button hero-section__button--secondary"
            >
              {t("actions.signIn")}
            </Link>
          </div>
        </div>
      </div>

      <div className="hero-section__visual-pane" aria-hidden="true">
        <TeedHeroVisual />
      </div>
    </section>
  );
}