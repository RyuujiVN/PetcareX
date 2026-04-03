import { Modal } from 'antd';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getClinicHomeContent, resolveSelectedClinicId } from '../../../../data/client/utils/clinicHomeStorage';
import { buildClinicHomeContent } from '../../../../data/client/utils/homePageClinicContent';
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
  }, [forcedContent, selectedClinicId]);

  const aboutPreview = useMemo(() => getPreviewText(content?.about?.description, INTRO_PREVIEW_WORDS), [content?.about?.description]);
  const galleryImages = useMemo(() => {
    if (!Array.isArray(content?.galleryImages)) {
      return [];
    }

    return content.galleryImages.filter((item) => item?.image);
  }, [content?.galleryImages]);
  const mapEmbedUrl = normalizeMapEmbedValue(content?.locationSection?.mapEmbedUrl) || DEFAULT_MAP_EMBED_URL;

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
        <section className="hero-section clinic-hero">
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
                  Đọc thêm
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
            <h2 className="section-title">{content.gallerySection.title}</h2>
            <p className="section-subtitle">{content.gallerySection.subtitle}</p>

            <div className="clinic-gallery-grid">
              {galleryImages.map((galleryItem, index) => (
                <div key={galleryItem.id || index} className="clinic-gallery-item">
                  <img src={galleryItem.image} alt={galleryItem.alt || `Hình ảnh phòng khám ${index + 1}`} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* <section className="clinic-features">
          <div className="section-container">
            <h2 className="section-title">{content.featuresSection.title}</h2>
            <p className="section-subtitle">{content.featuresSection.subtitle}</p>
            <div className="features-grid compact">
              {content.features.map((feature, index) => (
                <div key={feature.id || index} className="feature-card compact">
                  <div className={`feature-icon-wrapper ${feature.colorClass || 'blue-bg'}`}>
                    {FEATURE_ICONS[index % FEATURE_ICONS.length]}
                  </div>
                  <div className="feature-content">
                    <h4 className="feature-title">{feature.title}</h4>
                    <p className="feature-desc">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section> */}

        <section className="team-section">
          <div className="section-container">
            <h2 className="section-title">{content.teamSection.title}</h2>
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
            <h2 className="section-title">{content.locationSection.title}</h2>
            <p className="section-subtitle">{content.locationSection.subtitle}</p>
            <p className="clinic-address-text">{content.locationSection.address}</p>
          </div>

          <div className="clinic-map-wrapper">
            <iframe
              title="Google Maps địa chỉ phòng khám"
              src={mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>

        {/* <section className="services-section">
          <div className="section-container services-layout">
            <div className="services-column left">
              {content.servicesLeft.map((service, index) => (
                <div key={service.id || index} className="service-item">
                  <h4 className="service-title">{service.title}</h4>
                  <p className="service-desc">{service.description}</p>
                </div>
              ))}
            </div>

            <div className="services-center-image">
              <img src={content.servicesSection.centerImage} alt="Dich vu phong kham" />
            </div>

            <div className="services-column right">
              {content.servicesRight.map((service, index) => (
                <div key={service.id || index} className="service-item">
                  <h4 className="service-title">{service.title}</h4>
                  <p className="service-desc">{service.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section> */}
{/* 
        <section className="community-section">
          <div className="section-container">
            <div className="community-header">
              <span className="community-subtitle">{content.community.subtitle}</span>
              <h2 className="section-title">{content.community.title}</h2>
            </div>
            <div className="community-grid">
              {content.posts.map((post, index) => (
                <div key={post.id || index} className="community-card">
                  <img src={post.image} alt={post.title} />
                  <p>{post.title}</p>
                </div>
              ))}
            </div>
            <div className="community-doctors">
              <h3 className="doctors-heading">{content.community.doctorsHeading}</h3>
              <div className="avatar-row">
                {content.avatars.map((avatar, index) => (
                  <div key={avatar.id || index} className="avatar-item">
                    <img src={avatar.image} alt={avatar.name} />
                    <span className="avatar-name">{avatar.name}</span>
                    {avatar.subtitle ? <span className="avatar-subtitle">{avatar.subtitle}</span> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section> */}
      </div>

      <Modal
        title={content.about.title || 'Giới thiệu phòng khám'}
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
