import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Spin, Empty, message, Modal } from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getMyPetsApi, deletePetApi, getBreedLabel } from '../../../data/api/petApi';
import './styles.css';
import Header from '../../../components/layout/header';

const ListPet = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
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
    navigate(`/petProfile?id=${petId}`);
  };

  const handleDelete = (petId) => {
  Modal.confirm({
    title: 'Xóa thú cưng',
    content: 'Bạn có chắc muốn xóa thú cưng này?',
    okText: 'Xóa',
    cancelText: 'Hủy',
    centered: true,
    okType: 'danger',

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
    }
  });
};

  return (
    <div className="list-pet-wrapper">
      <Header />

      <div className="list-pet-container">
        <div className="list-pet-header-section">
          <h1 className="list-pet-title">Danh sách thú cưng của bạn</h1>
          <p className="list-pet-subtitle">
            Chọn 1 trong các thú cưng của bạn
          </p>
        </div>

        <Spin spinning={loading}>
          {pets.length > 0 ? (
            <div className="pet-lists">
              {pets.map((pet) => (
                <div key={pet.id} className="pet-item">
                  <Row gutter={[16, 16]} align="middle">
                    {/* Avatar */}
                    <Col xs={24} sm={6} className="pet-avatar-col">
                      <img
                        src={pet.avatar || '/public/gaugau.png'}
                        alt={pet.name}
                        className="pet-avatar"
                      />
                    </Col>

                    <Col xs={24} sm={12} className="pet-info-col">
                      <div className="pet-info">
                        <h3 className="pet-name">
                          {pet.name} <br />
                          {getBreedLabel(pet.breed, pet.species)}
                        </h3>
                      </div>
                    </Col>

                    <Col xs={24} sm={6} className="pet-action-col">
                      <div className="pet-action-group">
                        <Button
                          type="primary"
                          className="view-detail-btn"
                          icon={<EyeOutlined />}
                          block
                          onClick={() => handleViewDetails(pet.id)}
                        >
                          Xem chi tiết
                        </Button>                     
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            loading={deletingId === pet.id}
                            block
                            className="delete-btn"
                            onClick={() => handleDelete(pet.id)}
                          >
                            Xóa
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

export default ListPet;
