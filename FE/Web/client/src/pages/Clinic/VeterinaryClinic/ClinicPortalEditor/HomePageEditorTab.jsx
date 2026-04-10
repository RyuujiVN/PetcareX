import { CloseOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Divider, Input, message, Modal, Row, Space, Typography, Upload } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { buildClinicHomeContent } from '../../../../config/homePageClinicContent';
import { useAuth } from '../../../../hooks/Clinic/AuthContext';
import { uploadMultipleFilesToCloudinary, uploadOneFileToCloudinary } from '../../../../services/cloudinaryService';
import { getCurrentAdminClinicId } from '../../../../utils/clinicIdentity';
import { getClinicHomeContent, saveClinicHomeContent } from '../../../../utils/storage/clinicHomeStorage';
import HomePageClinic from '../../../client/Home/HomePageClinic';
import './homePageEditorTab.css';

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
  const { t } = useTranslation('clinic');
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
      message.error(t('homeEditor.messages.missingClinicIdEdit'));
      navigate('/clinic/appointments', { replace: true });
      return;
    }

    const nextContent = getClinicHomeContent(targetClinicId);
    setDraftContent(nextContent);
    setSavedContent(nextContent);
  }, [navigate, t, targetClinicId]);

  useEffect(() => {
    if (!targetClinicId || !currentClinicId || deniedRef.current) return;

    if (String(targetClinicId) !== String(currentClinicId)) {
      deniedRef.current = true;
      message.error(t('homeEditor.messages.permissionDenied'));
      navigate('/clinic/appointments', { replace: true });
    }
  }, [currentClinicId, navigate, t, targetClinicId]);

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
      message.error(t('homeEditor.messages.invalidImageType'));
      return false;
    }

    try {
      setUploadingField(uploadKey);
      const payload = await uploadOneFileToCloudinary(file);
      const imageUrl = payload?.url || payload?.file || '';

      if (!imageUrl) {
        throw new Error(t('homeEditor.messages.imageUrlMissing'));
      }

      onSuccess(imageUrl);
      message.success(t('homeEditor.messages.uploadImageSuccess'));
    } catch (error) {
      message.error(error?.message || t('homeEditor.messages.uploadImageFailed'));
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
          alt: t('homeEditor.gallery.imageAlt', { index: currentImages.length + index + 1 }),
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
      message.error(t('homeEditor.messages.invalidImageType'));
      return;
    }

    const failedFiles = [];
    const uploadedUrls = [];
    const uploadOneFile = async (file) => {
      const payload = await uploadOneFileToCloudinary(file);
      const imageUrl = payload?.url || payload?.file || '';

      if (!imageUrl) {
        throw new Error(t('homeEditor.messages.imageUrlMissing'));
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
            failedFiles.push(...imageFiles.slice(batchUrls.length).map((file) => file.name || t('homeEditor.messages.unknownFile')));
          }
        } catch {
          const settledResults = await Promise.allSettled(imageFiles.map((file) => uploadOneFile(file)));
          settledResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
              uploadedUrls.push(result.value);
            } else {
              failedFiles.push(imageFiles[index]?.name || t('homeEditor.messages.unknownFile'));
            }
          });
        }
      } else {
        try {
          const imageUrl = await uploadOneFile(imageFiles[0]);
          uploadedUrls.push(imageUrl);
        } catch {
          failedFiles.push(imageFiles[0]?.name || t('homeEditor.messages.unknownFile'));
        }
      }
    } finally {
      setUploadingField('');
    }

    if (uploadedUrls.length) {
      appendGalleryImages(uploadedUrls);
      message.success(t('homeEditor.messages.galleryUploadSuccess', { count: uploadedUrls.length }));
    }

    if (failedFiles.length) {
      message.warning(t('homeEditor.messages.galleryUploadFailed', { count: failedFiles.length }));
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
      title: t('homeEditor.team.removeDoctorTitle'),
      content: t('homeEditor.team.removeDoctorContent'),
      okText: t('homeEditor.team.removeDoctorConfirm'),
      okType: 'danger',
      cancelText: t('homeEditor.actions.cancel'),
      centered: true,
      onOk: () => removeDoctor(doctorIndex),
    });
  };

  const removeDoctorImage = (doctorIndex) => {
    updateListField('doctors', doctorIndex, 'image', '');
  };

  const handleSave = async () => {
    if (!targetClinicId) {
      message.error(t('homeEditor.messages.missingClinicIdSave'));
      return;
    }

    try {
      setSaving(true);
      const normalized = cloneContent(draftContent);
      saveClinicHomeContent(targetClinicId, normalized);
      setSavedContent(normalized);
      message.success(t('homeEditor.messages.saveSuccess'));
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
      title: t('homeEditor.confirm.leaveTitle'),
      content: t('homeEditor.confirm.leaveContent'),
      okText: t('homeEditor.confirm.continueEditing'),
      cancelText: t('homeEditor.confirm.discardChanges'),
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
        <Card title={t('homeEditor.sections.hero')}>
          <Space direction="vertical" size={12} className="editor-full-width">
            <Input
              value={draftContent.hero.title}
              onChange={(event) => updateNestedField('hero', 'title', event.target.value)}
              placeholder={t('homeEditor.placeholders.heroTitle')}
            />
            <TextArea
              value={draftContent.hero.description}
              onChange={(event) => updateNestedField('hero', 'description', event.target.value)}
              rows={3}
              placeholder={t('homeEditor.placeholders.heroDescription')}
            />
            <Input
              value={draftContent.hero.ctaText}
              onChange={(event) => updateNestedField('hero', 'ctaText', event.target.value)}
              placeholder={t('homeEditor.placeholders.heroCtaText')}
            />

            <Space.Compact className="editor-image-input-row">
              <Input
                value={draftContent.hero.bannerImage || ''}
                onChange={(event) => updateNestedField('hero', 'bannerImage', event.target.value)}
                placeholder={t('homeEditor.placeholders.heroBannerImage')}
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
                  {t('homeEditor.actions.uploadImage')}
                </Button>
              </Upload>
            </Space.Compact>

            {draftContent.hero.bannerImage ? (
              <img src={draftContent.hero.bannerImage} alt={t('homeEditor.alt.heroBanner')} className="editor-image-preview editor-banner-preview" />
            ) : null}
          </Space>
        </Card>

        <Card title={t('homeEditor.sections.about')}>
          <Space direction="vertical" size={12} className="editor-full-width">
            <Input
              value={draftContent.about.label}
              onChange={(event) => updateNestedField('about', 'label', event.target.value)}
              placeholder={t('homeEditor.placeholders.aboutLabel')}
            />
            <Input
              value={draftContent.about.title}
              onChange={(event) => updateNestedField('about', 'title', event.target.value)}
              placeholder={t('homeEditor.placeholders.aboutTitle')}
            />
            <TextArea
              value={draftContent.about.description}
              onChange={(event) => updateNestedField('about', 'description', event.target.value)}
              rows={6}
              placeholder={t('homeEditor.placeholders.aboutDescription')}
            />
            <Row gutter={12}>
              <Col xs={24} md={12}>
                <Input
                  value={draftContent.about.highlightNumber}
                  onChange={(event) => updateNestedField('about', 'highlightNumber', event.target.value)}
                  placeholder={t('homeEditor.placeholders.aboutHighlightNumber')}
                />
              </Col>
              <Col xs={24} md={12}>
                <Input
                  value={draftContent.about.highlightLabel}
                  onChange={(event) => updateNestedField('about', 'highlightLabel', event.target.value)}
                  placeholder={t('homeEditor.placeholders.aboutHighlightLabel')}
                />
              </Col>
            </Row>
          </Space>
        </Card>

        <Card title={t('homeEditor.sections.gallery')}>
          <Space direction="vertical" size={12} className="editor-full-width">
            <Input
              value={draftContent.gallerySection.title}
              onChange={(event) => updateNestedField('gallerySection', 'title', event.target.value)}
              placeholder={t('homeEditor.placeholders.galleryTitle')}
            />
            <TextArea
              value={draftContent.gallerySection.subtitle}
              onChange={(event) => updateNestedField('gallerySection', 'subtitle', event.target.value)}
              rows={2}
              placeholder={t('homeEditor.placeholders.gallerySubtitle')}
            />

            {/* Upload Photo Library   */}
            <label className="ant-btn ant-btn-default editor-upload-button editor-gallery-upload-button">
              <UploadOutlined />
              <span>{isFieldUploading('gallery-images') ? t('homeEditor.actions.uploading') : t('homeEditor.actions.uploadGalleryImages')}</span>
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
                        aria-label={t('homeEditor.gallery.removeImageAria', { index: index + 1 })}
                      >
                        <CloseOutlined />
                      </button>
                      <img src={item.image} alt={item.alt || t('homeEditor.gallery.imageAlt', { index: index + 1 })} className="editor-gallery-preview-image" />
                    </div>
                  ))}
              </div>
            ) : (
              <div className="editor-gallery-empty">{t('homeEditor.gallery.empty')}</div>
            )}
          </Space>
        </Card>

        <div ref={teamSectionRef}>
          <Card
            title={t('homeEditor.sections.team')}
            extra={
              <Button type="dashed" onClick={addDoctor}>
                {t('homeEditor.team.addDoctor')}
              </Button>
            }
          >
          <Space direction="vertical" size={12} className="editor-full-width">
            <Input
              value={draftContent.teamSection.title}
              onChange={(event) => updateNestedField('teamSection', 'title', event.target.value)}
              placeholder={t('homeEditor.placeholders.teamTitle')}
            />
            {draftContent.doctors.map((doctor, index) => (
              <Card
                key={doctor.id || index}
                size="small"
                title={t('homeEditor.team.doctorCardTitle', { index: index + 1 })}
                extra={
                  <Button type="text" danger onClick={() => confirmRemoveDoctor(index)}>
                    {t('homeEditor.team.removeDoctorConfirm')}
                  </Button>
                }
              >
                <Space direction="vertical" size={8} className="editor-full-width">
                  <Input
                    value={doctor.name}
                    onChange={(event) => updateListField('doctors', index, 'name', event.target.value)}
                    placeholder={t('homeEditor.placeholders.doctorName')}
                  />
                  <Space.Compact className="editor-image-input-row">
                    <Input
                      value={doctor.image}
                      onChange={(event) => updateListField('doctors', index, 'image', event.target.value)}
                      placeholder={t('homeEditor.placeholders.doctorImage')}
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
                        <span>{isFieldUploading(`doctor-image-${index}`) ? t('homeEditor.actions.uploading') : t('homeEditor.actions.uploadImage')}</span>
                      </Button>
                    </Upload>
                  </Space.Compact>

                  {doctor.image ? (
                    <div className="editor-image-preview-wrapper">
                      <button
                        type="button"
                        className="editor-remove-image-button"
                        onClick={() => removeDoctorImage(index)}
                        aria-label={t('homeEditor.team.removeDoctorImageAria', { index: index + 1 })}
                      >
                        <CloseOutlined />
                      </button>
                      <img src={doctor.image} alt={doctor.name || t('homeEditor.team.doctorCardTitle', { index: index + 1 })} className="editor-image-preview" />
                    </div>
                  ) : null}
                </Space>
              </Card>
            ))}
          </Space>
          </Card>
        </div>

        <Card title={t('homeEditor.sections.location')}>
          <Space direction="vertical" size={12} className="editor-full-width">
            <Input
              value={draftContent.locationSection.title}
              onChange={(event) => updateNestedField('locationSection', 'title', event.target.value)}
              placeholder={t('homeEditor.placeholders.locationTitle')}
            />
            <TextArea
              value={draftContent.locationSection.subtitle}
              onChange={(event) => updateNestedField('locationSection', 'subtitle', event.target.value)}
              rows={2}
              placeholder={t('homeEditor.placeholders.locationSubtitle')}
            />
            <Input
              value={draftContent.locationSection.address}
              onChange={(event) => updateNestedField('locationSection', 'address', event.target.value)}
              placeholder={t('homeEditor.placeholders.locationAddress')}
            />
            <Input
              value={draftContent.locationSection.mapEmbedUrl}
              onChange={(event) =>
                updateNestedField('locationSection', 'mapEmbedUrl', normalizeMapEmbedValue(event.target.value))
              }
              placeholder={t('homeEditor.placeholders.locationMapEmbed')}
            />
          </Space>
        </Card>
      </Space>

      <div className="clinic-home-editor-actions">
        <Button onClick={handleCancel}>{t('homeEditor.actions.cancel')}</Button>
        <Button type="primary" onClick={handleSave} loading={saving}>
          {t('homeEditor.actions.saveChanges')}
        </Button>
      </div>

      <Divider />

      <div className="clinic-home-preview-block">
        <Title level={3}>{t('homeEditor.preview.title')}</Title>
        <HomePageClinic clinicId={targetClinicId} forcedContent={draftContent} showBookingButton={false} />
      </div>
    </div>
  );
}
