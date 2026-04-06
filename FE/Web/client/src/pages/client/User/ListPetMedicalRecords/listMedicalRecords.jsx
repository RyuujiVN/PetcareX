import React, { useState, useEffect } from 'react';
import { Button, Spin, Empty, message, Modal, Dropdown } from 'antd';
import { EyeOutlined, PlusOutlined, MoreOutlined } from '@ant-design/icons';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { deletePetApi, getMyPetsApi, getBreedLabel } from '../../../../services/petService';
import { getClientInstance } from '../../../../services/apiClient';
import ScrollToTopButton from '../../../../components/common/ScrollToTopButton/ScrollToTopButton';
import styles from './listMedicalRecords.module.css';

const getPetAgeLabel = (dateOfBirth) => {
  if (!dateOfBirth) {
    return 'Chưa rõ tuổi';
  }

  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) {
    return 'Chưa rõ tuổi';
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
    return `${Math.floor(totalMonths / 12)} tuổi`;
  }

  return `${totalMonths} tháng tuổi`;
};

const ListPetMedicalRecords = () => {
  const navigate = useNavigate();
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
        message.error(error.message || 'Lỗi khi tải danh sách thú cưng');
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
      title: 'Xóa thú cưng',
      content: 'Bạn có chắc muốn xóa thú cưng này không?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      centered: true,
      onOk: async () => {
        try {
          await deletePetApi(getClientInstance(), petId);
          setPets((prev) => prev.filter((pet) => pet.id !== petId));
          message.success('Xóa thú cưng thành công');
        } catch (error) {
          message.error(error.message || 'Xóa thất bại');
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
          <h1 className={styles['list-pet-title']}>Danh sách thú cưng của bạn</h1>
          <p className={styles['list-pet-subtitle']}>
            Chọn 1 trong các thú cưng của bạn
          </p>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className={styles['add-pet-btn']}
            onClick={() => navigate('/add-pet')}
          >
            Thêm thú cưng mới
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
                          Tuổi: {getPetAgeLabel(pet.dateOfBirth)}
                        </span>
                        <Dropdown
                          trigger={['click']}
                          placement="bottomRight"
                          menu={{
                            items: [
                              { key: 'edit', label: 'Chỉnh sửa thông tin thú cưng' },
                              { key: 'delete', label: 'Xóa thú cưng', danger: true },
                            ],
                            onClick: ({ key }) => handleCardAction(key, pet.id),
                          }}
                        >
                          <button
                            type="button"
                            className={styles['card-menu-btn']}
                            aria-label="Tùy chọn thú cưng"
                          >
                            <MoreOutlined />
                          </button>
                        </Dropdown>
                      </div>
                    </div>
                    <p className={styles['pet-breed']}>Loài: {getBreedLabel(pet.breed, pet.species)}</p>

                    <div className={styles['pet-action-group']}>
                      <Button
                        type="primary"
                        className={styles['view-detail-btn']}
                        icon={<EyeOutlined />}
                        block
                        onClick={() => handleViewMedicalRecords(pet.id)}
                      >
                        Xem hồ sơ y tế
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Empty
              description="Chưa có thú cưng nào"
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

