import { ADMIN_AUTH_STORAGE, CLIENT_AUTH_STORAGE, getAdminAuthItem } from "../constants/authStorage";

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');
const BYTES_IN_MB = 1024 * 1024;
const IMAGE_OUTPUT_MIME_TYPE = 'image/webp';
const IMAGE_OUTPUT_EXTENSION = '.webp';
const MAX_COMPRESS_PASSES = 6;
const MIN_DIMENSION = 640;
// BE currently accepts up to 5MB per image, but deployed gateway can reject around 1MB payload.
// Keep default output well below 1MB, then use aggressive retry when 413 still occurs.
const IMAGE_MAX_DIMENSION = 1600;
const IMAGE_QUALITY = 0.8;
const IMAGE_MIN_QUALITY = 0.5;
const IMAGE_MAX_OUTPUT_BYTES = Math.round(0.75 * BYTES_IN_MB);
const AGGRESSIVE_IMAGE_MAX_OUTPUT_BYTES = Math.round(0.55 * BYTES_IN_MB);

const LEGACY_TOKEN_KEYS = ['clientAccessToken', 'adminAccessToken'];
const PAYLOAD_TOO_LARGE_MESSAGE =
  'Vượt giới hạn upload. Vui lòng chọn ảnh có kích thước nhỏ hơn';
const COMPRESS_FAILED_MESSAGE = 'Không thể xử lý nén ảnh trước khi upload';

const createUploadError = (message, options = {}) => {
  const error = new Error(message);

  if (options.status) {
    error.status = options.status;
  }

  if (options.payload) {
    error.payload = options.payload;
  }

  if (options.code) {
    error.code = options.code;
  }

  if (options.cause) {
    error.cause = options.cause;
  }

  return error;
};

const isUploadPayloadTooLargeError = (error) => Number(error?.status) === 413;

const replaceFileExtension = (fileName, extension) => {
  if (!fileName || typeof fileName !== 'string') {
    return `upload${extension}`;
  }

  const normalizedExtension = extension.startsWith('.') ? extension : `.${extension}`;
  const lastDotIndex = fileName.lastIndexOf('.');

  if (lastDotIndex <= 0) {
    return `${fileName}${normalizedExtension}`;
  }

  return `${fileName.slice(0, lastDotIndex)}${normalizedExtension}`;
};

const getScaledDimension = (width, height, maxDimension) => {
  if (!width || !height) {
    return {
      width: maxDimension,
      height: maxDimension,
    };
  }

  const maxSourceDimension = Math.max(width, height);
  if (maxSourceDimension <= maxDimension) {
    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  const ratio = maxDimension / maxSourceDimension;

  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
};

const canvasToBlob = (canvas, mimeType, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(createUploadError(COMPRESS_FAILED_MESSAGE));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality,
    );
  });

const loadImageSource = async (file) => {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file);

    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (context, targetWidth, targetHeight) => {
        context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
      },
      cleanup: () => {
        if (typeof bitmap.close === 'function') {
          bitmap.close();
        }
      },
    };
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise((resolve, reject) => {
      const imageElement = new Image();

      imageElement.onload = () => resolve(imageElement);
      imageElement.onerror = () => reject(createUploadError(COMPRESS_FAILED_MESSAGE));
      imageElement.src = objectUrl;
    });

    return {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
      draw: (context, targetWidth, targetHeight) => {
        context.drawImage(image, 0, 0, targetWidth, targetHeight);
      },
      cleanup: () => {
        URL.revokeObjectURL(objectUrl);
      },
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
};

const compressImageFile = async (
  file,
  {
    maxDimension = IMAGE_MAX_DIMENSION,
    quality = IMAGE_QUALITY,
    minQuality = IMAGE_MIN_QUALITY,
    maxOutputBytes = IMAGE_MAX_OUTPUT_BYTES,
  } = {},
) => {
  if (!file) {
    throw createUploadError('Vui long chon file truoc khi tai len');
  }

  if (!String(file.type || '').startsWith('image/')) {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressed: false,
    };
  }

  const source = await loadImageSource(file);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: false });

  if (!context) {
    source.cleanup();
    throw createUploadError(COMPRESS_FAILED_MESSAGE);
  }

  let currentQuality = quality;
  let currentMaxDimension = Math.max(MIN_DIMENSION, Math.round(maxDimension));
  let bestBlob = null;

  try {
    for (let pass = 0; pass < MAX_COMPRESS_PASSES; pass += 1) {
      const { width, height } = getScaledDimension(source.width, source.height, currentMaxDimension);

      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      source.draw(context, width, height);

      const blob = await canvasToBlob(canvas, IMAGE_OUTPUT_MIME_TYPE, currentQuality);

      if (!bestBlob || blob.size < bestBlob.size) {
        bestBlob = blob;
      }

      if (blob.size <= maxOutputBytes) {
        break;
      }

      const nextQuality = Math.max(minQuality, Number((currentQuality - 0.08).toFixed(2)));

      if (nextQuality === currentQuality && currentMaxDimension > MIN_DIMENSION) {
        currentMaxDimension = Math.max(MIN_DIMENSION, Math.round(currentMaxDimension * 0.85));
      }

      currentQuality = nextQuality;
    }
  } finally {
    source.cleanup();
  }

  if (!bestBlob) {
    throw createUploadError(COMPRESS_FAILED_MESSAGE);
  }

  const compressedFile = new File([bestBlob], replaceFileExtension(file.name, IMAGE_OUTPUT_EXTENSION), {
    type: IMAGE_OUTPUT_MIME_TYPE,
    lastModified: Date.now(),
  });

  return {
    file: compressedFile,
    originalSize: file.size,
    compressedSize: compressedFile.size,
    compressed: true,
  };
};

const buildMultipartFormData = (fieldName, fileOrFiles) => {
  const formData = new FormData();

  if (Array.isArray(fileOrFiles)) {
    fileOrFiles.forEach((file) => {
      formData.append(fieldName, file);
    });
    return formData;
  }

  formData.append(fieldName, fileOrFiles);
  return formData;
};

const normalizeSingleUploadPayload = (payload) => {
  const fileUrl = extractCloudinaryUrl(payload);

  if (!fileUrl) {
    throw createUploadError('Khong nhan duoc URL anh tu server');
  }

  return {
    ...payload,
    file: fileUrl,
    url: fileUrl,
  };
};

const normalizeMultiUploadPayload = (payload) => {
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.files)
      ? payload.files
      : [];

  const items = rawItems
    .map((item) => {
      const fileUrl = extractCloudinaryUrl(item);
      return fileUrl
        ? {
          ...item,
          file: fileUrl,
          url: fileUrl,
        }
        : null;
    })
    .filter(Boolean);

  if (items.length === 0) {
    throw createUploadError('Khong nhan duoc URL anh tu server');
  }

  return {
    items,
    urls: items.map((item) => item.file),
    raw: payload,
  };
};

const uploadSingleCompressedFile = async (
  file,
  {
    endpoint = '/cloudinary/upload/one-file',
    maxOutputBytes = IMAGE_MAX_OUTPUT_BYTES,
  } = {},
) => {
  const prepared = await compressImageFile(file, { maxOutputBytes });
  const payload = await postMultipartFormData(endpoint, buildMultipartFormData('file', prepared.file));
  return normalizeSingleUploadPayload(payload);
};

const readJsonSafely = async (response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const normalizeErrorMessage = (payload, fallbackMessage, status) => {
  if (Number(status) === 413) {
    return PAYLOAD_TOO_LARGE_MESSAGE;
  }

  if (!payload) {
    return fallbackMessage;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (Array.isArray(payload.message) && payload.message.length > 0) {
    return payload.message[0];
  }

  return payload.message || payload.error || fallbackMessage;
};

const getAuthToken = () => {
  const legacyToken = LEGACY_TOKEN_KEYS
    .map((tokenKey) => localStorage.getItem(tokenKey) || sessionStorage.getItem(tokenKey))
    .find(Boolean);

  return (
    localStorage.getItem(CLIENT_AUTH_STORAGE.tokenKey) ||
    getAdminAuthItem(ADMIN_AUTH_STORAGE.tokenKey) ||
    legacyToken ||
    ''
  );
};

export const extractCloudinaryUrl = (payload) => {
  if (!payload) {
    return '';
  }

  return payload.file || payload.url || payload.secure_url || payload.data?.url || payload.data?.file || '';
};

export const postMultipartFormData = async (endpoint, formData) => {
  const token = getAuthToken();
  const headers = {
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const payload = await readJsonSafely(response);

  if (!response.ok) {
    throw createUploadError(
      normalizeErrorMessage(payload, `Upload failed (${response.status})`, response.status),
      {
        status: response.status,
        payload,
        code: response.status === 413 ? 'UPLOAD_PAYLOAD_TOO_LARGE' : undefined,
      },
    );
  }

  return payload;
};

export const uploadOneFileToCloudinary = async (file) => {
  if (!file) {
    throw createUploadError('Vui long chon file truoc khi tai len');
  }

  try {
    return await uploadSingleCompressedFile(file, {
      endpoint: '/cloudinary/upload/one-file',
      maxOutputBytes: IMAGE_MAX_OUTPUT_BYTES,
    });
  } catch (error) {
    if (!isUploadPayloadTooLargeError(error)) {
      throw error;
    }

    return uploadSingleCompressedFile(file, {
      endpoint: '/cloudinary/upload/one-file',
      maxOutputBytes: AGGRESSIVE_IMAGE_MAX_OUTPUT_BYTES,
    }).catch((retryError) => {
      if (isUploadPayloadTooLargeError(retryError)) {
        throw createUploadError(PAYLOAD_TOO_LARGE_MESSAGE, {
          status: 413,
          code: 'UPLOAD_PAYLOAD_TOO_LARGE',
          cause: retryError,
        });
      }

      throw retryError;
    });
  }
};

export const uploadOneFileResize = async (file) => {
  if (!file) {
    throw createUploadError('Vui long chon file truoc khi tai len');
  }

  try {
    return await uploadSingleCompressedFile(file, {
      endpoint: '/cloudinary/upload/file-resize',
      maxOutputBytes: IMAGE_MAX_OUTPUT_BYTES,
    });
  } catch (error) {
    if (!isUploadPayloadTooLargeError(error)) {
      throw error;
    }

    return uploadSingleCompressedFile(file, {
      endpoint: '/cloudinary/upload/file-resize',
      maxOutputBytes: AGGRESSIVE_IMAGE_MAX_OUTPUT_BYTES,
    }).catch((retryError) => {
      if (isUploadPayloadTooLargeError(retryError)) {
        throw createUploadError(PAYLOAD_TOO_LARGE_MESSAGE, {
          status: 413,
          code: 'UPLOAD_PAYLOAD_TOO_LARGE',
          cause: retryError,
        });
      }

      throw retryError;
    });
  }
};

const uploadMultipleCompressedFiles = async (files) => {
  const compressedEntries = await Promise.all(
    files.map((file) => compressImageFile(file, { maxOutputBytes: IMAGE_MAX_OUTPUT_BYTES })),
  );

  const payload = await postMultipartFormData(
    '/cloudinary/upload/multi-file',
    buildMultipartFormData(
      'files',
      compressedEntries.map((entry) => entry.file),
    ),
  );

  return normalizeMultiUploadPayload(payload);
};

const uploadMultipleFilesSequentially = async (files) => {
  const items = [];

  for (const file of files) {
    const payload = await uploadOneFileToCloudinary(file);
    items.push(payload);
  }

  return {
    items,
    urls: items.map((item) => item.file),
    raw: {
      mode: 'sequential-after-413',
    },
  };
};

export const uploadMultipleFilesToCloudinary = async (files) => {
  const fileList = Array.from(files || []).filter(Boolean);

  if (fileList.length === 0) {
    throw createUploadError('Vui long chon it nhat 1 file');
  }

  try {
    return await uploadMultipleCompressedFiles(fileList);
  } catch (error) {
    if (!isUploadPayloadTooLargeError(error)) {
      throw error;
    }

    return uploadMultipleFilesSequentially(fileList).catch((fallbackError) => {
      if (isUploadPayloadTooLargeError(fallbackError)) {
        throw createUploadError(PAYLOAD_TOO_LARGE_MESSAGE, {
          status: 413,
          code: 'UPLOAD_PAYLOAD_TOO_LARGE',
          cause: fallbackError,
        });
      }

      throw fallbackError;
    });
  }
};
