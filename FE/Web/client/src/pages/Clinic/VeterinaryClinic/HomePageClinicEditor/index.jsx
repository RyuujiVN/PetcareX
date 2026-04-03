import { UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Input, Modal, Row, Space, Typography, message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../../hooks/Clinic/AuthContext';
import HomePageClinic from '../../../client/Home/HomePageClinic';
import { uploadOneFileToCloudinary } from '../../../../data/shared/api/cloudinaryUploadFetch';
import { getClinicHomeContent, saveClinicHomeContent } from '../../../../data/client/utils/clinicHomeStorage';
import { buildClinicHomeContent } from '../../../../data/client/utils/homePageClinicContent';
import { getCurrentAdminClinicId } from '../../../../utils/clinicIdentity';
import './styles.css';

const { TextArea } = Input;
const { Title } = Typography;

const cloneContent = (content) => buildClinicHomeContent(JSON.parse(JSON.stringify(content)));
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

export default function HomePageClinicEditor() {
  const { clinicId: clinicIdParam = '' } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [draftContent, setDraftContent] = useState(() => getClinicHomeContent(clinicIdParam));
  const [savedContent, setSavedContent] = useState(() => getClinicHomeContent(clinicIdParam));
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState('');
  const deniedRef = useRef(false);

  const currentClinicId = useMemo(() => getCurrentAdminClinicId(userProfile), [userProfile]);
  const targetClinicId = String(clinicIdParam || '').trim();

  useEffect(() => {
    if (!targetClinicId) {
      message.error('Thiếu clinicId để chỉnh sửa trang chủ phòng khám.');
      navigate('/clinic/appointments', { replace: true });
      return;
    }

    const nextContent = getClinicHomeContent(targetClinicId);
    setDraftContent(nextContent);
    setSavedContent(nextContent);
  }, [targetClinicId, navigate]);

  useEffect(() => {
    if (!targetClinicId || !currentClinicId || deniedRef.current) return;

    if (String(targetClinicId) !== String(currentClinicId)) {
      deniedRef.current = true;
      message.error('Bạn chỉ có thể chỉnh sửa trang chủ của phòng khám đang đăng nhập.');
      navigate('/clinic/appointments', { replace: true });
    }
  }, [targetClinicId, currentClinicId, navigate]);

  const isDirty = useMemo(
    () => JSON.stringify(draftContent) !== JSON.stringify(savedContent),
    [draftContent, savedContent],
  );

  const updateNestedField = (section, field, value) => {
    setDraftContent((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const updateListField = (listName, index, field, value) => {
    setDraftContent((prev) => {
      const nextList = Array.isArray(prev[listName]) ? [...prev[listName]] : [];
      nextList[index] = {
        ...nextList[index],
        [field]: value,
      };

      return {
        ...prev,
        [listName]: nextList,
      };
    });
  };

  const isImageFile = (file) => String(file?.type || '').startsWith('image/');

  const handleImageUpload = async (file, uploadKey, onSuccess) => {
    if (!file) {
      return false;
    }

    if (!isImageFile(file)) {
      message.error('Vui lòng chọn đúng file ảnh.');
      return false;
    }

    try {
      setUploadingField(uploadKey);
      const payload = await uploadOneFileToCloudinary(file);
      const imageUrl = payload?.url || payload?.file || '';

      if (!imageUrl) {
        throw new Error('Không nhận được URL ảnh sau khi upload.');
      }

      onSuccess(imageUrl);
      message.success('Tải ảnh lên thành công.');
    } catch (error) {
      message.error(error?.message || 'Tải ảnh thất bại.');
    } finally {
      setUploadingField('');
    }

    return false;
  };

  const isFieldUploading = (fieldKey) => uploadingField === fieldKey;

  const handleSave = async () => {
    if (!targetClinicId) {
      message.error('Thiếu clinicId để lưu dữ liệu.');
      return;
    }

    try {
      setSaving(true);
      const normalized = cloneContent(draftContent);
      saveClinicHomeContent(targetClinicId, normalized);
      setSavedContent(normalized);
      message.success('Lưu thành công');
      window.location.reload();
    } finally {
      setSaving(false);
    }
  };

  const discardAndExit = () => {
    navigate('/clinic/appointments');
  };

  const handleCancel = () => {
    if (!isDirty) {
      discardAndExit();
      return;
    }

    Modal.confirm({
      title: 'Xác nhận',
      content: 'Bạn có muốn tiếp tục chỉnh sửa hay hủy bỏ thay đổi?',
      okText: 'Tiếp tục chỉnh sửa',
      cancelText: 'Hủy bỏ thay đổi',
      closable: false,
      maskClosable: false,
      onCancel: discardAndExit,
      onOk: () => {},
    });
  };

  return (
    <div className="clinic-home-editor-page">
      <Space direction="vertical" size={16} className="clinic-home-editor-content">
        <Card title="Phần đầu trang">
          <Space direction="vertical" size={12} className="editor-full-width">
            <Input
              value={draftContent.hero.title}
              onChange={(event) => updateNestedField('hero', 'title', event.target.value)}
              placeholder="Tên phòng khám và lời chào mừng"
            />
            <TextArea
              value={draftContent.hero.description}
              onChange={(event) => updateNestedField('hero', 'description', event.target.value)}
              rows={3}
              placeholder="Slogan riêng cho phòng khám của bạn"
            />
            <Input
              value={draftContent.hero.ctaText}
              onChange={(event) => updateNestedField('hero', 'ctaText', event.target.value)}
              placeholder="Nội dung nút CTA"
            />
          </Space>
        </Card>

        <Card title="Giới thiệu bệnh viện">
          <Space direction="vertical" size={12} className="editor-full-width">
            <Input
              value={draftContent.about.label}
              onChange={(event) => updateNestedField('about', 'label', event.target.value)}
              placeholder="Nhãn phần giới thiệu"
            />
            <Input
              value={draftContent.about.title}
              onChange={(event) => updateNestedField('about', 'title', event.target.value)}
              placeholder="Tiêu đề phần giới thiệu"
            />
            <TextArea
              value={draftContent.about.description}
              onChange={(event) => updateNestedField('about', 'description', event.target.value)}
              rows={6}
              placeholder="Nội dung giới thiệu"
            />
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Input
                  value={draftContent.about.highlightNumber}
                  onChange={(event) => updateNestedField('about', 'highlightNumber', event.target.value)}
                  placeholder="Số năm thành lập phòng khám của bạn"
                />
              </Col>
              <Col xs={24} md={12}>
                <Input
                  value={draftContent.about.highlightLabel}
                  onChange={(event) => updateNestedField('about', 'highlightLabel', event.target.value)}
                  placeholder="Số chi nhánh phòng khám của bạn"
                />
              </Col>
            </Row>
          </Space>
        </Card>

        <Card title="Thư viện ảnh">
          <Space direction="vertical" size={12} className="editor-full-width">
            <Input
              value={draftContent.gallerySection.title}
              onChange={(event) => updateNestedField('gallerySection', 'title', event.target.value)}
              placeholder="Tiêu đề thư viện ảnh"
            />
            <TextArea
              value={draftContent.gallerySection.subtitle}
              onChange={(event) => updateNestedField('gallerySection', 'subtitle', event.target.value)}
              rows={2}
              placeholder="Mô tả thư viện ảnh"
            />

            {draftContent.galleryImages.map((item, index) => {
              const uploadKey = `gallery-image-${index}`;
              const lockByOtherUpload = Boolean(uploadingField) && !isFieldUploading(uploadKey);

              return (
                <Card key={item.id || index} size="small" title={`Ảnh thư viện ${index + 1}`}>
                  <Space direction="vertical" size={8} className="editor-full-width">
                    <Input
                      value={item.alt || ''}
                      onChange={(event) => updateListField('galleryImages', index, 'alt', event.target.value)}
                      placeholder="Mô tả ảnh"
                    />

                    <Space.Compact className="editor-image-input-row">
                      <Input
                        value={item.image}
                        onChange={(event) => updateListField('galleryImages', index, 'image', event.target.value)}
                        placeholder="Ảnh thư viện (URL hoặc đường dẫn public)"
                      />
                      <label className="ant-btn ant-btn-default editor-upload-button">
                        <UploadOutlined />
                        <span>{isFieldUploading(uploadKey) ? 'Đang tải...' : 'Tải ảnh'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={lockByOtherUpload}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            void handleImageUpload(file, uploadKey, (imageUrl) => {
                              updateListField('galleryImages', index, 'image', imageUrl);
                            });
                            event.target.value = '';
                          }}
                        />
                      </label>
                    </Space.Compact>

                    {item.image ? (
                      <img src={item.image} alt={item.alt || `Ảnh thư viện ${index + 1}`} className="editor-image-preview" />
                    ) : null}
                  </Space>
                </Card>
              );
            })}
          </Space>
        </Card>

        {/* <Card title="Khối tính năng">
          <Space direction="vertical" size={12} className="editor-full-width">
            <Input
              value={draftContent.featuresSection.title}
              onChange={(event) => updateNestedField('featuresSection', 'title', event.target.value)}
              placeholder="Tiêu đề khối tính năng"
            />
            <TextArea
              value={draftContent.featuresSection.subtitle}
              onChange={(event) => updateNestedField('featuresSection', 'subtitle', event.target.value)}
              rows={2}
              placeholder="Mô tả khối tính năng"
            />

            {draftContent.features.map((feature, index) => (
              <Card key={feature.id || index} size="small" title={`Tính năng ${index + 1}`}>
                <Space direction="vertical" size={8} className="editor-full-width">
                  <Input
                    value={feature.title}
                    onChange={(event) => updateListField('features', index, 'title', event.target.value)}
                    placeholder="Tên tính năng"
                  />
                  <TextArea
                    value={feature.description}
                    onChange={(event) => updateListField('features', index, 'description', event.target.value)}
                    rows={2}
                    placeholder="Mô tả tính năng"
                  />
                </Space>
              </Card>
            ))}
          </Space>
        </Card> */}

        <Card title="Đội ngũ bác sĩ">
          <Space direction="vertical" size={12} className="editor-full-width">
            <Input
              value={draftContent.teamSection.title}
              onChange={(event) => updateNestedField('teamSection', 'title', event.target.value)}
              placeholder="Tiêu đề khối đội ngũ"
            />
            {draftContent.doctors.map((doctor, index) => (
              <Card key={doctor.id || index} size="small" title={`Bác sĩ ${index + 1}`}>
                <Space direction="vertical" size={8} className="editor-full-width">
                  <Input
                    value={doctor.name}
                    onChange={(event) => updateListField('doctors', index, 'name', event.target.value)}
                    placeholder="Tên bác sĩ"
                  />
                  <Space.Compact className="editor-image-input-row">
                    <Input
                      value={doctor.image}
                      onChange={(event) => updateListField('doctors', index, 'image', event.target.value)}
                      placeholder="Ảnh bác sĩ (URL hoặc đường dẫn public)"
                    />
                    <label className="ant-btn ant-btn-default editor-upload-button">
                      <UploadOutlined />
                      <span>{isFieldUploading(`doctor-image-${index}`) ? 'Đang tải...' : 'Tải ảnh'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={Boolean(uploadingField) && !isFieldUploading(`doctor-image-${index}`)}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          void handleImageUpload(file, `doctor-image-${index}`, (imageUrl) => {
                            updateListField('doctors', index, 'image', imageUrl);
                          });
                          event.target.value = '';
                        }}
                      />
                    </label>
                  </Space.Compact>

                  {doctor.image ? (
                    <img src={doctor.image} alt={doctor.name || `Bác sĩ ${index + 1}`} className="editor-image-preview" />
                  ) : null}
                </Space>
              </Card>
            ))}
          </Space>
        </Card>

        <Card title="Địa chỉ phòng khám (Google Maps)">
          <Space direction="vertical" size={12} className="editor-full-width">
            <Input
              value={draftContent.locationSection.title}
              onChange={(event) => updateNestedField('locationSection', 'title', event.target.value)}
              placeholder="Tiêu đề phần địa chỉ"
            />
            <TextArea
              value={draftContent.locationSection.subtitle}
              onChange={(event) => updateNestedField('locationSection', 'subtitle', event.target.value)}
              rows={2}
              placeholder="Mô tả ngắn"
            />
            <Input
              value={draftContent.locationSection.address}
              onChange={(event) => updateNestedField('locationSection', 'address', event.target.value)}
              placeholder="Địa chỉ hiển thị"
            />
            <Input
              value={draftContent.locationSection.mapEmbedUrl}
              onChange={(event) =>
                updateNestedField('locationSection', 'mapEmbedUrl', normalizeMapEmbedValue(event.target.value))
              }
              placeholder="Dán link nhúng Google Maps hoặc cả đoạn iframe"
            />
          </Space>
        </Card>

        <Card title="Dịch vụ phòng khám">
          <Space direction="vertical" size={12} className="editor-full-width">
            <Space.Compact className="editor-image-input-row">
              <Input
                value={draftContent.servicesSection.centerImage}
                onChange={(event) => updateNestedField('servicesSection', 'centerImage', event.target.value)}
                placeholder="Ảnh trung tâm"
              />
              <label className="ant-btn ant-btn-default editor-upload-button">
                <UploadOutlined />
                <span>{isFieldUploading('services-center-image') ? 'Đang tải...' : 'Tải ảnh'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={Boolean(uploadingField) && !isFieldUploading('services-center-image')}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    void handleImageUpload(file, 'services-center-image', (imageUrl) => {
                      updateNestedField('servicesSection', 'centerImage', imageUrl);
                    });
                    event.target.value = '';
                  }}
                />
              </label>
            </Space.Compact>

            {draftContent.servicesSection.centerImage ? (
              <img
                src={draftContent.servicesSection.centerImage}
                alt="Ảnh trung tâm dịch vụ"
                className="editor-image-preview"
              />
            ) : null}

            <Divider orientation="left">Cột trái</Divider>
            {draftContent.servicesLeft.map((service, index) => (
              <Card key={service.id || index} size="small" title={`Dịch vụ trái ${index + 1}`}>
                <Space direction="vertical" size={8} className="editor-full-width">
                  <Input
                    value={service.title}
                    onChange={(event) => updateListField('servicesLeft', index, 'title', event.target.value)}
                    placeholder="Tên dịch vụ"
                  />
                  <TextArea
                    value={service.description}
                    onChange={(event) => updateListField('servicesLeft', index, 'description', event.target.value)}
                    rows={3}
                    placeholder="Mô tả dịch vụ"
                  />
                </Space>
              </Card>
            ))}

            <Divider orientation="left">Cột phải</Divider>
            {draftContent.servicesRight.map((service, index) => (
              <Card key={service.id || index} size="small" title={`Dịch vụ phải ${index + 1}`}>
                <Space direction="vertical" size={8} className="editor-full-width">
                  <Input
                    value={service.title}
                    onChange={(event) => updateListField('servicesRight', index, 'title', event.target.value)}
                    placeholder="Tên dịch vụ"
                  />
                  <TextArea
                    value={service.description}
                    onChange={(event) => updateListField('servicesRight', index, 'description', event.target.value)}
                    rows={3}
                    placeholder="Mô tả dịch vụ"
                  />
                </Space>
              </Card>
            ))}
          </Space>
        </Card>

        {/* <Card title="Diễn đàn cộng đồng">
          <Space direction="vertical" size={12} className="editor-full-width">
            <Input
              value={draftContent.community.subtitle}
              onChange={(event) => updateNestedField('community', 'subtitle', event.target.value)}
              placeholder="Nhãn phụ"
            />
            <Input
              value={draftContent.community.title}
              onChange={(event) => updateNestedField('community', 'title', event.target.value)}
              placeholder="Tiêu đề diễn đàn"
            />
            <Input
              value={draftContent.community.doctorsHeading}
              onChange={(event) => updateNestedField('community', 'doctorsHeading', event.target.value)}
              placeholder="Tiêu đề bác sĩ nổi bật"
            />

            <Divider orientation="left">Bài viết nổi bật</Divider>
            {draftContent.posts.map((post, index) => (
              <Card key={post.id || index} size="small" title={`Bài viết ${index + 1}`}>
                <Space direction="vertical" size={8} className="editor-full-width">
                  <Input
                    value={post.title}
                    onChange={(event) => updateListField('posts', index, 'title', event.target.value)}
                    placeholder="Tiêu đề bài viết"
                  />
                  <Input
                    value={post.image}
                    onChange={(event) => updateListField('posts', index, 'image', event.target.value)}
                    placeholder="Ảnh bài viết"
                  />
                </Space>
              </Card>
            ))}

            <Divider orientation="left">Bác sĩ cộng đồng</Divider>
            {draftContent.avatars.map((avatar, index) => (
              <Card key={avatar.id || index} size="small" title={`Bác sĩ cộng đồng ${index + 1}`}>
                <Space direction="vertical" size={8} className="editor-full-width">
                  <Input
                    value={avatar.name}
                    onChange={(event) => updateListField('avatars', index, 'name', event.target.value)}
                    placeholder="Tên hiển thị"
                  />
                  <Input
                    value={avatar.subtitle || ''}
                    onChange={(event) => updateListField('avatars', index, 'subtitle', event.target.value)}
                    placeholder="Chuyên môn (tùy chọn)"
                  />
                  <Input
                    value={avatar.image}
                    onChange={(event) => updateListField('avatars', index, 'image', event.target.value)}
                    placeholder="Ảnh đại diện"
                  />
                </Space>
              </Card>
            ))}
          </Space>
        </Card> */}
      </Space>

      <div className="clinic-home-editor-actions">
        <Button onClick={handleCancel}>Hủy</Button>
        <Button type="primary" onClick={handleSave} loading={saving}>
          Lưu thay đổi
        </Button>
      </div>

      <Divider />

      <div className="clinic-home-preview-block">
        <Title level={3}>Xem trước trang chủ sau khi lưu</Title>
        <HomePageClinic clinicId={targetClinicId} forcedContent={draftContent} showBookingButton={false} />
      </div>
    </div>
  );
}
