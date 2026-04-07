import { CloseOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Input, message, Modal, Row, Space, Typography, Upload } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { buildClinicHomeContent } from '../../../../config/homePageClinicContent';
import { useAuth } from '../../../../hooks/Clinic/AuthContext';
import { uploadMultipleFilesToCloudinary, uploadOneFileToCloudinary } from '../../../../services/cloudinaryService';
import { getCurrentAdminClinicId } from '../../../../utils/clinicIdentity';
import { getClinicHomeContent, saveClinicHomeContent } from '../../../../utils/storage/clinicHomeStorage';
import HomePageClinic from '../../../client/Home/HomePageClinic';
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
  const teamSectionRef = useRef(null);

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

  const appendGalleryImages = (imageUrls) => {
    setDraftContent((prev) => {
      const currentImages = Array.isArray(prev.galleryImages) ? prev.galleryImages : [];

      const nextImages = imageUrls
        .filter(Boolean)
        .map((imageUrl, index) => ({
          id: `gallery-${Date.now()}-${index}`,
          image: imageUrl,
          alt: `Ảnh thư viện ${currentImages.length + index + 1}`,
        }));

      return {
        ...prev,
        galleryImages: [...currentImages, ...nextImages],
      };
    });
  };

  const removeGalleryImage = (imageIndex) => {
    setDraftContent((prev) => {
      const currentImages = Array.isArray(prev.galleryImages) ? prev.galleryImages : [];

      return {
        ...prev,
        galleryImages: currentImages.filter((_, index) => index !== imageIndex),
      };
    });
  };

  const handleGalleryImagesUpload = async (files) => {
    const selectedFiles = Array.from(files || []);
    if (!selectedFiles.length) {
      return;
    }

    const imageFiles = selectedFiles.filter(isImageFile);
    if (!imageFiles.length) {
      message.error('Vui lòng chọn đúng file ảnh.');
      return;
    }

    const failedFiles = [];
    const uploadedUrls = [];
    const uploadOneFile = async (file) => {
      const payload = await uploadOneFileToCloudinary(file);
      const imageUrl = payload?.url || payload?.file || '';

      if (!imageUrl) {
        throw new Error('Thiếu URL ảnh sau khi upload.');
      }

      return imageUrl;
    };

    try {
      setUploadingField('gallery-images');

      if (imageFiles.length > 1) {
        try {
          const batchResult = await uploadMultipleFilesToCloudinary(imageFiles);
          const batchUrls = Array.isArray(batchResult?.urls) ? batchResult.urls.filter(Boolean) : [];

          uploadedUrls.push(...batchUrls);
          if (batchUrls.length < imageFiles.length) {
            failedFiles.push(...imageFiles.slice(batchUrls.length).map((file) => file.name || 'file không xác định'));
          }
        } catch {
          const settledResults = await Promise.allSettled(imageFiles.map((file) => uploadOneFile(file)));
          settledResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
              uploadedUrls.push(result.value);
            } else {
              failedFiles.push(imageFiles[index]?.name || 'file không xác định');
            }
          });
        }
      } else {
        try {
          const imageUrl = await uploadOneFile(imageFiles[0]);
          uploadedUrls.push(imageUrl);
        } catch {
          failedFiles.push(imageFiles[0]?.name || 'file không xác định');
        }
      }
    } finally {
      setUploadingField('');
    }

    if (uploadedUrls.length) {
      appendGalleryImages(uploadedUrls);
      message.success(`Đã tải lên ${uploadedUrls.length} ảnh thư viện.`);
    }

    if (failedFiles.length) {
      message.warning(`Có ${failedFiles.length} ảnh tải lên thất bại.`);
    }
  };

  const addDoctor = () => {
    setDraftContent((prev) => {
      const currentDoctors = Array.isArray(prev.doctors) ? prev.doctors : [];
      const nextDoctor = {
        id: `doctor-${Date.now()}`,
        name: '',
        image: '',
      };

      return {
        ...prev,
        doctors: [nextDoctor, ...currentDoctors],
      };
    });

    window.requestAnimationFrame(() => {
      teamSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const removeDoctor = (doctorIndex) => {
    setDraftContent((prev) => {
      const currentDoctors = Array.isArray(prev.doctors) ? prev.doctors : [];

      return {
        ...prev,
        doctors: currentDoctors.filter((_, index) => index !== doctorIndex),
      };
    });
  };

  const confirmRemoveDoctor = (doctorIndex) => {
    Modal.confirm({
      title: 'Xóa bác sĩ',
      content: 'Bạn có muốn xóa bác sĩ này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      centered: true,
      onOk: () => removeDoctor(doctorIndex),
    });
  };

  const removeDoctorImage = (doctorIndex) => {
    updateListField('doctors', doctorIndex, 'image', '');
  };

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
      centered: true,
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

            <Space.Compact className="editor-image-input-row">
              <Input
                value={draftContent.hero.bannerImage || ''}
                onChange={(event) => updateNestedField('hero', 'bannerImage', event.target.value)}
                placeholder="Ảnh banner đầu trang (URL hoặc đường dẫn public)"
              />

              {/* Upload Photo Banner */}
              <Upload
                showUploadList={false}
                beforeUpload={(file) => {
                  handleImageUpload(file, 'hero-banner', (imageUrl) => {
                    updateNestedField('hero', 'bannerImage', imageUrl);
                  });
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />}>
                  Tải ảnh lên
                </Button>
              </Upload>
            </Space.Compact>

            {draftContent.hero.bannerImage ? (
              <img src={draftContent.hero.bannerImage} alt="Banner đầu trang" className="editor-image-preview editor-banner-preview" />
            ) : null}
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

            {/* Upload Photo Library   */}
            <label className="ant-btn ant-btn-default editor-upload-button editor-gallery-upload-button">
              <UploadOutlined />
              <span>{isFieldUploading('gallery-images') ? 'Đang tải...' : 'Tải ảnh thư viện'}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={Boolean(uploadingField) && !isFieldUploading('gallery-images')}
                onChange={(event) => {
                  void handleGalleryImagesUpload(event.target.files);
                  event.target.value = '';
                }}
              />
            </label>
            {Array.isArray(draftContent.galleryImages) && draftContent.galleryImages.length ? (
              <div className="editor-gallery-preview-grid">
                {draftContent.galleryImages
                  .map((item, index) => ({ item, index }))
                  .filter(({ item }) => item?.image)
                  .map(({ item, index }) => (
                    <div key={item.id || `${item.image}-${index}`} className="editor-gallery-preview-item">
                      <button
                        type="button"
                        className="editor-remove-image-button"
                        onClick={() => removeGalleryImage(index)}
                        aria-label={`Xóa ảnh thư viện ${index + 1}`}
                      >
                        <CloseOutlined />
                      </button>
                      <img src={item.image} alt={item.alt || `Ảnh thư viện ${index + 1}`} className="editor-gallery-preview-image" />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="editor-gallery-empty">Chưa có ảnh thư viện. Hãy tải ảnh lên để hiển thị tại đây.</div>
            )}
          </Space>
        </Card>

        <div ref={teamSectionRef}>
          <Card
            title="Đội ngũ bác sĩ"
            extra={
              <Button type="dashed" onClick={addDoctor}>
                Thêm bác sĩ
              </Button>
            }
          >
          <Space direction="vertical" size={12} className="editor-full-width">
            <Input
              value={draftContent.teamSection.title}
              onChange={(event) => updateNestedField('teamSection', 'title', event.target.value)}
              placeholder="Tiêu đề khối đội ngũ"
            />
            {draftContent.doctors.map((doctor, index) => (
              <Card
                key={doctor.id || index}
                size="small"
                title={`Bác sĩ ${index + 1}`}
                extra={
                  <Button type="text" danger onClick={() => confirmRemoveDoctor(index)}>
                    Xóa
                  </Button>
                }
              >
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
                      placeholder="Ảnh bác sĩ"
                    />

                    {/* Upload Image for Doctor */}
                    <Upload
                      showUploadList={false}
                      beforeUpload={(file) => { 
                        handleImageUpload(file, `doctor-image-${index}`, (imageUrl) => {  
                          updateListField('doctors', index, 'image', imageUrl);
                        });
                        return false;
                      } 
                      }
                    >
                      <Button icon={<UploadOutlined />} disabled={Boolean(uploadingField) && !isFieldUploading(`doctor-image-${index}`)}>
                        <span>{isFieldUploading(`doctor-image-${index}`) ? 'Đang tải...' : 'Tải ảnh'}</span>
                      </Button>
                    </Upload>
                  </Space.Compact>

                  {doctor.image ? (
                    <div className="editor-image-preview-wrapper">
                      <button
                        type="button"
                        className="editor-remove-image-button"
                        onClick={() => removeDoctorImage(index)}
                        aria-label={`Xóa ảnh bác sĩ ${index + 1}`}
                      >
                        <CloseOutlined />
                      </button>
                      <img src={doctor.image} alt={doctor.name || `Bác sĩ ${index + 1}`} className="editor-image-preview" />
                    </div>
                  ) : null}
                </Space>
              </Card>
            ))}
          </Space>
          </Card>
        </div>

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
