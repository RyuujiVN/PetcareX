import React, { useState, useEffect } from 'react';
import { Button, Spin, Empty, message, Modal } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { createSearchParams, useNavigate } from 'react-router-dom';
import { deletePetApi, getMyPetsApi, getBreedLabel } from '../../../../data/client/api/petApi';
import styles from './listMedicalRecords.module.css';

const ListPetMedicalRecords = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    const fetchPets = async () => {
      try {
        setLoading(true);
        const petData = await getMyPetsApi();
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
      content: 'Bạn có chắc muốn xóa thú cưng này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okType: 'danger',
      centered: true,
      onOk: async () => {
        try {
          setDeletingId(petId);
          await deletePetApi(petId);
          setPets((prev) => prev.filter((pet) => pet.id !== petId));
          message.success('Xóa thú cưng thành công');
        } catch (error) {
          message.error(error.message || 'Xóa thất bại');
        } finally {
          setDeletingId(null);
        }
      },
    });
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
                    <h3 className={styles['pet-name']}>Tên: {pet.name}</h3>
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

                      <Button
                        type="primary"
                        ghost
                        className={styles['view-record-btn']}
                        icon={<EditOutlined />}
                        block
                        onClick={() => handleEditPetInfo(pet.id)}
                      >
                        Chỉnh sửa thông tin
                      </Button>

                      <Button
                        danger
                        className={styles['delete-btn']}
                        icon={<DeleteOutlined />}
                        loading={deletingId === pet.id}
                        block
                        onClick={() => handleDelete(pet.id)}
                      >
                        Xóa
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
    </div>
  );
};

export default ListPetMedicalRecords;

