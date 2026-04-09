import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./styles.css";
import { ScheduleOutlined, LaptopOutlined, RobotOutlined, UsergroupAddOutlined } from '@ant-design/icons';
import { TbCircleCheck } from "react-icons/tb";
import { IoCloseCircle } from "react-icons/io5";
import { MdPets } from "react-icons/md";
import { FcDepartment, FcManager } from "react-icons/fc";
import { MdSecurity } from "react-icons/md";
import { TbLockAccess } from "react-icons/tb";
import { FcStatistics } from "react-icons/fc";
import { FcLock } from "react-icons/fc";
import { AiOutlineRise } from "react-icons/ai";





export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const stats = [
      { number: '30+', label: t('pages.home.homePage.stats.items.clinics') },
      { number: '50,000+', label: t('pages.home.homePage.stats.items.users') },
      { number: '999+', label: t('pages.home.homePage.stats.items.data') },
      { number: '24/7', label: t('pages.home.homePage.stats.items.support') }
  ];

  const technologies = [
    {
      id: 1,
      title: t('pages.home.homePage.technologies.items.onlineBooking.title'),
      icon: <ScheduleOutlined />,
      description: t('pages.home.homePage.technologies.items.onlineBooking.description')
    },
    {
      id: 2,
      title: t('pages.home.homePage.technologies.items.medicalRecord.title'),
      icon: <LaptopOutlined />,
      description: t('pages.home.homePage.technologies.items.medicalRecord.description')
    },
    {
      id: 3,
      title: t('pages.home.homePage.technologies.items.aiChatbot.title'),
      icon: <RobotOutlined />,
      description: t('pages.home.homePage.technologies.items.aiChatbot.description')
    },
    {
      id: 4,
      title: t('pages.home.homePage.technologies.items.communityForum.title'),
      icon: <UsergroupAddOutlined />,
      description: t('pages.home.homePage.technologies.items.communityForum.description')
    }
  ];
  const challenges = [
    {
      id: 1,
      title: t('pages.home.homePage.challenges.items.medicalRecord.title'),
      description: t('pages.home.homePage.challenges.items.medicalRecord.description')
    },
    {
      id: 2,
      title: t('pages.home.homePage.challenges.items.booking.title'),
      description: t('pages.home.homePage.challenges.items.booking.description')
    },
    {
      id: 3,
      title: t('pages.home.homePage.challenges.items.management.title'),
      description: t('pages.home.homePage.challenges.items.management.description')
    }
  ];

  const solutions = [
    {
      id: 1,
      title: t('pages.home.homePage.solutions.items.digitalRecord.title'),
      description: t('pages.home.homePage.solutions.items.digitalRecord.description')
    },
    {
      id: 2,
      title: t('pages.home.homePage.solutions.items.onlineBooking.title'),
      description: t('pages.home.homePage.solutions.items.onlineBooking.description')
    },
    {
      id: 3,
      title: t('pages.home.homePage.solutions.items.analytics.title'),
      description: t('pages.home.homePage.solutions.items.analytics.description')
    }
  ];
  const features = [
    {
      id: 1,
      title: (
        <>
            <FcDepartment size={40}/> {t('pages.home.homePage.features.clinic.title')}
        </>),
          description: t('pages.home.homePage.features.clinic.description'),
          actionText: t('pages.home.homePage.features.clinic.actionText'),
      color: "green",
      items: [
        t('pages.home.homePage.features.clinic.items.appointments'),
        t('pages.home.homePage.features.clinic.items.inventory'),
        t('pages.home.homePage.features.clinic.items.revenue')
      ]
    },
    {
      id: 2,
      title: (
        <>
            <FcManager size={40}/>{t('pages.home.homePage.features.owner.title')}
        </>),
      description: t('pages.home.homePage.features.owner.description'),
      actionText: t('pages.home.homePage.features.owner.actionText'),
      color: "orange",
      items: [
        t('pages.home.homePage.features.owner.items.lifetimeRecord'),
        t('pages.home.homePage.features.owner.items.findDoctor'),
        t('pages.home.homePage.features.owner.items.reminder')
      ]
    }
  ];

  const handleLogin = () => navigate("/login");
  const handleRegister = () => navigate("/choose-clinic");

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-overlay">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              {t('pages.home.homePage.heroBadge')}
            </div>

            <h1 className="hero-title">
              {t('pages.home.homePage.heroTitle')}
            </h1>

            <p className="hero-description">
              {t('pages.home.homePage.heroDescription')}
            </p>

            <div className="hero-buttons">
              <button className="btn btn-primary" onClick={handleLogin}>
                <MdPets size={20}/> 
                {t('pages.home.homePage.downloadApp')}
              </button>

              <button className="btn btn-secondary-hero" onClick={handleRegister}>
                <FcDepartment size={20}/> 
                {t('pages.home.homePage.chooseClinic')}
              </button>
            </div>
          </div>
        </div>
      </section>


      <section className="stats-section">
        <div className="stats-containers">
          <h2> <AiOutlineRise size={45} color="var(--c-eb524d)"/> {t('pages.home.homePage.stats.title')}</h2>

          <div className="stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="challenges-sections">
        <div className="section-container">
          <h2 className="section-titles">{t('pages.home.homePage.challenges.title')}</h2>
          <p className="section-subtitle">
            {t('pages.home.homePage.challenges.subtitle')}
          </p>

          <div className="challenges-solutions-grid">
            <div className="challenges-column">
              <div className="column-header challenges-header">
                <span className="badge badge-red">{t('pages.home.homePage.challenges.badges.reality')}</span>
              </div>

              <div className="items-list">
                {challenges.map((challenge) => (
                  <div key={challenge.id} className="challenge-item">
                    <div className="item-icon challenge-icon"><IoCloseCircle size={40}/></div>
                    <div className="item-content">
                      <h4>{challenge.title}</h4>
                      <p>{challenge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="solutions-column">
              <div className="column-header solutions-header">
                <span className="badge badge-green">{t('pages.home.homePage.challenges.badges.solution')}</span>
              </div>

              <div className="items-list">
                {solutions.map((solution) => (
                  <div key={solution.id} className="solution-item">
                    <div className="item-icon solution-icon"><TbCircleCheck /></div>
                    <div className="item-content">
                      <h4 style={{color: '#333'}}>{solution.title}</h4>
                      <p>{solution.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    
      <section className="technology-section">
        <div className="section-container">
          <h2 className="section-titles">{t('pages.home.homePage.technologies.title')}</h2>

          <div className="technology-grid">
            {technologies.map((tech) => (
              <div key={tech.id} className="tech-card">
                <div className="tech-icon">{tech.icon}</div>
                <h3>{tech.title}</h3>
                <p>{tech.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="features-section">
        <div className="section-container">
          <div className="features-grid">
            {features.map((feature) => (
              <div
                key={feature.id}
                className={`feature-card feature-${feature.color}`}
              >
                <h3>{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
                
                <div className="feature-items">
                  {feature.items.map((item, index) => (
                    <div key={index} className="feature-item">
                      <span className="feature-check">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <button className="feature-btn">
                  {feature.actionText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="security-section">
        <div className="section-container">
          <div className="security-content">
            <div className="security-icon">
              <MdSecurity size={50} color="var(--color-info)"/>
            </div>

            <h2 className="security-title">{t('pages.home.homePage.security.title')}</h2>

            <p className="security-description">
              {t('pages.home.homePage.security.description')}
            </p>

            <div className="security-features">
              <div className="security-feature-box">
                <FcLock size={40}/>
                <h4>{t('pages.home.homePage.security.items.encryption.title')}</h4>
                <p>{t('pages.home.homePage.security.items.encryption.description')}</p>
              </div>
              <div className="security-feature-box">
                <TbLockAccess size={40}/>
                <h4>{t('pages.home.homePage.security.items.access.title')}</h4>
                <p>{t('pages.home.homePage.security.items.access.description')}</p>
              </div>
              <div className="security-feature-box">
                <FcStatistics size={40}/>
                <h4>{t('pages.home.homePage.security.items.audit.title')}</h4>
                <p>{t('pages.home.homePage.security.items.audit.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="section-container">
          <h2 className="cta-title">{t('pages.home.homePage.cta.title')}</h2>
          <p className="cta-subtitle">
            {t('pages.home.homePage.cta.subtitle')}
          </p>

          <div className="cta-buttons">
            <button className="btn-cta btn-cta-primary" onClick={handleRegister}>
              {t('pages.home.homePage.cta.registerFree')}
            </button>
            <button className="btn-cta btn-cta-secondary">
              {t('pages.home.homePage.cta.contact')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

