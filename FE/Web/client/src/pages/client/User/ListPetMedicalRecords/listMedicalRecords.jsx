import React, { useState, useEffect } from 'react';
import { Button, Spin, Empty, message, Modal, Dropdown } from 'antd';
import { EyeOutlined, PlusOutlined, MoreOutlined } from '@ant-design/icons';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { deletePetApi, getMyPetsApi, getBreedLabel } from '../../../../services/petService';
import { getClientInstance } from '../../../../services/apiClient';
import ScrollToTopButton from '../../../../components/common/ScrollToTopButton/ScrollToTopButton';
import styles from './listMedicalRecords.module.css';

const getPetAgeLabel = (dateOfBirth, t) => {
  if (!dateOfBirth) {
    return t('pages.listPetMedicalRecords.unknownAge');
  }

  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) {
    return t('pages.listPetMedicalRecords.unknownAge');
  }

  const now = new Date();
  let totalMonths =
    (now.getFullYear() - birthDate.getFullYear()) * 12 +
    (now.getMonth() - birthDate.getMonth());

  if (now.getDate() < birthDate.getDate()) {
    totalMonths -= 1;
  }

  totalMonths = Math.max(totalMonths, 0);

  if (totalMonths >= 12) {
    return t('pages.listPetMedicalRecords.ageYears', { count: Math.floor(totalMonths / 12) });
  }

  return t('pages.listPetMedicalRecords.ageMonths', { count: totalMonths });
};

const ListPetMedicalRecords = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    const fetchPets = async () => {
      try {
        setLoading(true);
        const petData = await getMyPetsApi(getClientInstance());
        setPets(Array.isArray(petData) ? petData : []);
      } catch (error) { 
        message.error(error.message || t('pages.listPetMedicalRecords.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, []);

  const handleViewMedicalRecords = (petId) => {
    navigate({
      pathname: '/medical-records',
      search: createSearchParams({ petId: String(petId) }).toString(),
    });
  };

  const handleEditPetInfo = (petId) => {
    navigate(`/petProfile?id=${petId}`);
  };

  const handleDelete = (petId) => {
    Modal.confirm({
      title: t('pages.listPetMedicalRecords.confirmDelete.title'),
      content: t('pages.listPetMedicalRecords.confirmDelete.content'),
      okText: t('pages.listPetMedicalRecords.confirmDelete.okText'),
      cancelText: t('pages.listPetMedicalRecords.confirmDelete.cancelText'),
      okType: 'danger',
      centered: true,
      onOk: async () => {
        try {
          await deletePetApi(getClientInstance(), petId);
          setPets((prev) => prev.filter((pet) => pet.id !== petId));
          message.success(t('pages.listPetMedicalRecords.deleteSuccess'));
        } catch (error) {
          message.error(error.message || t('pages.listPetMedicalRecords.deleteFailed'));
        }
      },
    });
  };

  const handleCardAction = (actionKey, petId) => {
    if (actionKey === 'edit') {
      handleEditPetInfo(petId);
      return;
    }

    if (actionKey === 'delete') {
      handleDelete(petId);
    }
  };



  return (
    <div className={styles['list-pet-wrapper']}>
      <div className={styles['list-pet-container']}>
        <div className={styles['list-pet-header-section']}>
          <h1 className={styles['list-pet-title']}>{t('pages.listPetMedicalRecords.title')}</h1>
          <p className={styles['list-pet-subtitle']}>
            {t('pages.listPetMedicalRecords.subtitle')}
          </p>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className={styles['add-pet-btn']}
            onClick={() => navigate('/add-pet')}
          >
            {t('pages.listPetMedicalRecords.addPet')}
          </Button>
        </div>

        <Spin spinning={loading}>
          {pets.length > 0 ? (
            <div className={styles['cards-grid']}>
              {pets.map((pet) => (
                <article key={pet.id} className={styles['pet-card']}>
                  <div className={styles['pet-image-wrap']}>
                    <img
                      src={pet.avatar || '/gaugau.png'}
                      alt={pet.name}
                      className={styles['pet-image']}
                    />
                  </div>

                  <div className={styles['card-body']}>
                    <div className={styles['card-header']}>
                      <h3 className={styles['pet-name']}>{pet.name}</h3>
                      <div className={styles['card-header-actions']}>
                        <span className={styles['pet-age-badge']}>
                          {t('pages.listPetMedicalRecords.ageLabel')}: {getPetAgeLabel(pet.dateOfBirth, t)}
                        </span>
                        <Dropdown
                          trigger={['click']}
                          placement="bottomRight"
                          menu={{
                            items: [
                              { key: 'edit', label: t('pages.listPetMedicalRecords.actions.editPet') },
                              { key: 'delete', label: t('pages.listPetMedicalRecords.actions.deletePet'), danger: true },
                            ],
                            onClick: ({ key }) => handleCardAction(key, pet.id),
                          }}
                        >
                          <button
                            type="button"
                            className={styles['card-menu-btn']}
                            aria-label={t('pages.listPetMedicalRecords.actions.petOptionsAria')}
                          >
                            <MoreOutlined />
                          </button>
                        </Dropdown>
                      </div>
                    </div>
                    <p className={styles['pet-breed']}>{t('pages.listPetMedicalRecords.speciesLabel')}: {getBreedLabel(pet.breed, pet.species)}</p>

                    <div className={styles['pet-action-group']}>
                      <Button
                        type="primary"
                        className={styles['view-detail-btn']}
                        icon={<EyeOutlined />}
                        block
                        onClick={() => handleViewMedicalRecords(pet.id)}
                      >
                        {t('pages.listPetMedicalRecords.actions.viewMedicalRecords')}
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Empty
              description={t('pages.listPetMedicalRecords.empty')}
              style={{ marginTop: '48px' }}
            />
          )}
        </Spin>
      </div>
      <ScrollToTopButton threshold={300} />
    </div>
  );
};

export default ListPetMedicalRecords;

