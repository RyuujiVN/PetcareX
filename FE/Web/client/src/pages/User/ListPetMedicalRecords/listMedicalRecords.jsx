import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Spin, Empty, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getMyPetsApi, getBreedLabel } from '../../../data/api/petApi';
import styles from './listMedicalRecords.module.css';
import Header from '../../../components/layout/header';

const ListPetMedicalRecords = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const handleViewDetails = (petId) => {
    navigate(`/medical-records/detail?petId=${petId}`);
  };



  return (
    <div className={styles['list-pet-wrapper']}>
      <Header />

      <div className={styles['list-pet-container']}>
        <div className={styles['list-pet-header-section']}>
          <h1 className={styles['list-pet-title']}>Danh sách thú cưng của bạn</h1>
          <p className={styles['list-pet-subtitle']}>
            Chọn 1 trong các thú cưng của bạn
          </p>
        </div>

        <Spin spinning={loading}>
          {pets.length > 0 ? (
            <div className={styles['pet-lists']}>
              {pets.map((pet) => (
                <div key={pet.id} className={styles['pet-item']}>
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={6} className={styles['pet-avatar-col']}>
                      <img
                        src={pet.avatar || '/gaugau.png'}
                        alt={pet.name}
                        className={styles['pet-avatar']}
                      />
                    </Col>

                    <Col xs={24} sm={12} className={styles['pet-info-col']}>
                      <div className={styles['pet-info']}>
                        <h3 className={styles['pet-name']}>
                          {pet.name} <br />
                          {getBreedLabel(pet.breed, pet.species)}
                        </h3>
                      </div>
                    </Col>

                    <Col xs={24} sm={6} className={styles['pet-action-col']}>
                      <div className={styles['pet-action-group']}>
                        <Button
                          type="primary"
                          className={styles['view-detail-btn']}
                          icon={<EyeOutlined />}
                          block
                          onClick={() => handleViewDetails(pet.id)}
                        >
                          Xem chi tiết
                        </Button>                       
                      </div>
                    </Col>
                  </Row>
                </div>
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
