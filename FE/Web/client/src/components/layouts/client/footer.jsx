import React from "react";
import { useTranslation } from "react-i18next";
import { FaGlobe, FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import "./footer.css";

function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="petcare-footer">
      <div className="footer-top">
        <div className="footer-col about">
          <h4>{t("footer.about.title")}</h4>
          <p>
            {t("footer.about.description")}
          </p>
          <div className="social-icons" style={{display:"flex", paddingTop:"10px"}}>
            <a href="#" aria-label={t("footer.social.websiteAria")}>
              <FaGlobe />
            </a>
            <a href="#" aria-label={t("footer.social.emailAria")}>
              <FaEnvelope />
            </a>
            <a href="#" aria-label={t("footer.social.phoneAria")}>
              <FaPhone />
            </a>
          </div>
        </div>

        <div className="footer-col products">
          <h4>{t("footer.products.title")}</h4>
          <ul>
            <li>
              <a href="#">{t("footer.products.management")}</a>
            </li>
            <li>
              <a href="#">{t("footer.products.ownerApp")}</a>
            </li>
            <li>
              <a href="#">{t("footer.products.booking")}</a>
            </li>
            <li>
              <a href="#">{t("footer.products.pricing")}</a>
            </li>
          </ul>
        </div>

        <div className="footer-col company">
          <h4>{t("footer.company.title")}</h4>
          <ul>
            <li>
              <a href="#">{t("footer.company.aboutUs")}</a>
            </li>
            <li>
              <a href="#">{t("footer.company.careers")}</a>
            </li>
            <li>
              <a href="#">{t("footer.company.news")}</a>
            </li>
            <li>
              <a href="#">{t("footer.company.partners")}</a>
            </li>
          </ul>
        </div>

        <div className="footer-col contact">
          <h4>{t("footer.contact.title")}</h4>
          <p>
            <FaMapMarkerAlt /> {t("footer.contact.address")}
          </p>
          <p>
            <FaPhone /> 1900 123 456
          </p>
          <p>
            <FaEnvelope /> support@petcarex.vn
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>{t("footer.copyright")}</p>
        <div className="footer-links">
          <a href="#">{t("footer.links.terms")}</a>
          <a href="#">{t("footer.links.privacy")}</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
