import { Modal } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { buildClinicHomeContent } from '../../../../config/homePageClinicContent';
import { getClinicHomeContent, resolveSelectedClinicId } from '../../../../utils/storage/clinicHomeStorage';
import '../HomePage/styles.css';
import './HomePageClinic.css';

const INTRO_PREVIEW_WORDS = 100;

const DEFAULT_MAP_EMBED_URL =
  'https://www.google.com/maps?q=B%E1%BB%87nh%20vi%E1%BB%87n%20th%C3%BA%20y%20Procare&output=embed';

const normalizeMapEmbedValue = (rawValue) => {
  const normalizedRaw = String(rawValue || '').trim();
  if (!normalizedRaw) {
    return '';
  }

  const iframeSrcMatch = normalizedRaw.match(/src=(['"])(.*?)\1/i);
  if (iframeSrcMatch?.[2]) {
    return iframeSrcMatch[2].trim();
  }

  return normalizedRaw;
};

const getPreviewText = (text, wordLimit = INTRO_PREVIEW_WORDS) => {
  const source = String(text || '').trim();
  if (!source) {
    return '';
  }

  const words = source.split(/\s+/);
  if (words.length <= wordLimit) {
    return source;
  }

  return `${words.slice(0, wordLimit).join(' ')}...`;
};

export default function HomePageClinic({ clinicId = '', forcedContent = null, showBookingButton = true }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const selectedClinicId = useMemo(() => {
    if (clinicId) return String(clinicId);
    return resolveSelectedClinicId(location.state);
  }, [clinicId, location.state]);

  const content = useMemo(() => {
    if (forcedContent) {
      return buildClinicHomeContent(forcedContent);
    }
    return getClinicHomeContent(selectedClinicId);
  }, [forcedContent, i18n.language, selectedClinicId]);

  const aboutPreview = useMemo(() => getPreviewText(content?.about?.description, INTRO_PREVIEW_WORDS), [content?.about?.description]);
  const galleryImages = useMemo(() => {
    if (!Array.isArray(content?.galleryImages)) {
      return [];
    }

    return content.galleryImages.filter((item) => item?.image);
  }, [content?.galleryImages]);
  const mapEmbedUrl = normalizeMapEmbedValue(content?.locationSection?.mapEmbedUrl) || DEFAULT_MAP_EMBED_URL;
  const heroBannerImage = String(content?.hero?.bannerImage || '').trim();
  const heroBackgroundStyle = heroBannerImage
    ? {
        backgroundImage: `url('${heroBannerImage}')`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }
    : undefined;

  const goToBookingAppointment = () => {
    navigate('/booking', {
      state: {
        selectedClinicId,
      },
    });
  };

  return (
    <>
      <div className="home-page clinic-page">
        <section className="hero-section clinic-hero" style={heroBackgroundStyle}>
          <div className="hero-content">
            <h1 className="hero-title">{content.hero.title}</h1>
            <p className="hero-description">{content.hero.description}</p>

            {showBookingButton ? (
              <div className="hero-button">
                <button className="btn btn-secondary-hero" onClick={goToBookingAppointment}>
                  {content.hero.ctaText}
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <section className="about-section">
          <div className="section-container about-grid about-split">
            <div className="about-left">
              <span className="about-label">{content.about.label}</span>
              <h2 className="about-title">{content.about.title}</h2>
            </div>
            <div className="about-right">
              <p className="about-text">{aboutPreview}</p>
              {content.about.description ? (
                <button className="btn btn-secondary" onClick={() => setIsAboutModalOpen(true)}>
                  {t('common.actions.readMore')}
                </button>
              ) : null}
            </div>
            <div className="about-highlight">
              <div className="highlight-number">{content.about.highlightNumber}</div>
              <div className="highlight-label">{content.about.highlightLabel}</div>
            </div>
          </div>
        </section>

        <section className="clinic-gallery-section">
          <div className="section-container">
            <h2 className="section-title" style={{textAlign: 'center', fontSize: 25, fontWeight: 'bold', marginBottom: 25, color: '#4672b4'}}>{content.gallerySection.title}</h2>
            <p className="section-subtitle">{content.gallerySection.subtitle}</p>

            <div className="clinic-gallery-grid">
              {galleryImages.map((galleryItem, index) => (
                <div key={galleryItem.id || index} className="clinic-gallery-item">
                  <img src={galleryItem.image} alt={galleryItem.alt || t('pages.home.homePageClinic.galleryAltFallback', { index: index + 1 })} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="team-section">
          <div className="section-container">
            <h2 className="section-title" style={{textAlign: 'center', fontSize: 25, fontWeight: 'bold', marginBottom: 25, color: '#4672b4'}}>{content.teamSection.title}</h2>
            <div className="team-grid">
              {content.doctors.map((doctor, index) => (
                <div key={doctor.id || index} className="doctor-cards">
                  <img src={doctor.image} alt={doctor.name} />
                  <div className="doctor-name">{doctor.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="clinic-location-section">
          <div className="section-container clinic-location-header">
            <h2 className="section-title" style={{textAlign: 'center', fontSize: 25, fontWeight: 'bold', marginBottom: 25, color: '#4672b4'}}>{content.locationSection.title}</h2>
            <p className="section-subtitle">{content.locationSection.subtitle}</p>
            <p className="clinic-address-text">{content.locationSection.address}</p>
          </div>

          <div className="clinic-map-wrapper">
            <iframe
              title={t('pages.home.homePageClinic.mapIframeTitle')}
              src={mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>
      </div>

      <Modal
        title={content.about.title || t('pages.home.homePageClinic.aboutModalFallbackTitle')}
        open={isAboutModalOpen}
        onCancel={() => setIsAboutModalOpen(false)}
        footer={null}
        width={720}
      >
        <p className="about-modal-text">{content.about.description}</p>
      </Modal>
    </>
  );
}
