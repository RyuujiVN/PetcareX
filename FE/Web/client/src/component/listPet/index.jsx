import React, { useState, useEffect } from 'react';
import { Row, Col, Button, Spin, Empty, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './styles.css';
import Header from '../../default/header';
const ListPet = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    try {
      const petData = [
        {
          id: 1,
          name: 'LuLu',
          breed: 'Chó Poodle',
          avatar: '/public/gaugau.png',
          species: 'Chó',
        },
        {
          id: 2,
          name: 'Mimi',
          breed: 'Mèo Anh Lông Ngắn',
          avatar: '/public/meomeo.png',
          species: 'Mèo',
        },
        {
          id: 3,
          name: 'LuLu',
          breed: 'Chó Poodle',
          avatar: '/public/gaugau.png',
          species: 'Chó',
        },
        {
          id: 4,
          name: 'LuLu',
          breed: 'Chó Poodle',
          avatar: '/public/gaugau.png',
          species: 'Chó',
        },
        {
          id: 5,
          name: 'LuLu',
          breed: 'Chó Poodle',
          avatar: '/public/gaugau.png',
          species: 'Chó',
        },
      ];
      setPets(petData);
    } catch (error) {
      message.error('Lỗi khi tải danh sách thú cưng');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleViewDetails = (petId) => {
    navigate(`/petProfile?id=${petId}`);
  };

  return (
    <div className="list-pet-wrapper">
        <Header/>
      <div className="list-pet-container">
        <div className="list-pet-header-section">
          <h1 className="list-pet-title">Danh sách thú cưng của bạn</h1>
          <p className="list-pet-subtitle">
            Chọn 1 trong các thú cưng của bạn
          </p>
        </div>

        <Spin spinning={loading}>
          {pets.length > 0 ? (
            <div className="pet-list">
              {pets.map((pet) => (
                <div key={pet.id} className="pet-item">
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={6} className="pet-avatar-col">
                      <img 
                        src={pet.avatar} 
                        alt={pet.name} 
                        className="pet-avatar"
                      />
                    </Col>
                    <Col xs={24} sm={12} className="pet-info-col">
                      <div className="pet-info">
                        <h3 className="pet-name">{pet.name} - {pet.breed}</h3>
                      </div>
                    </Col>
                    <Col xs={24} sm={6} className="pet-action-col">
                      <Button
                        type="primary"
                        className="view-detail-btn"
                        icon={<EyeOutlined />}
                        block
                        onClick={() => handleViewDetails(pet.id)}
                      >
                        Xem chi tiết
                      </Button>
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
