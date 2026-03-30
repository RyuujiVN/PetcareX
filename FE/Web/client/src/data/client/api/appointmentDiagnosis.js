import socket from '../../../socket/socket';

const STORAGE_KEY = 'petcarex.appointmentDiagnosis.v1';

const HIGH_RISK_KEYWORDS = ['khó thở', 'co giật', 'bất tỉnh', 'nôn ra máu', 'tiêu chảy ra máu'];
const MEDIUM_RISK_KEYWORDS = ['nôn', 'tiêu chảy', 'sốt', 'ho', 'bỏ ăn', 'chán ăn', 'rụng lông'];

const readStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeStorage = (payload) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
  }
};

const normalizeSymptoms = (symptomsText) => {
  if (!symptomsText) return [];

  return symptomsText
    .split(/[\n,.;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const makeRequestId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `diag-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const formatDateLabel = (dateValue) => {
  if (!dateValue) return '';

  return new Date(dateValue).toLocaleDateString('vi-VN');
};

const buildPrompt = ({ symptomsText, petName, species, appointmentDate }) => {
  const dateLabel = formatDateLabel(appointmentDate);

  return [
    'Bạn là trợ lý thú y AI.',
    'Hãy phân tích triệu chứng và trả về bằng TIẾNG VIỆT dưới dạng markdown, ngắn gọn, rõ ràng.',
    'BẮT BUỘC theo đúng các mục:',
    '1. Các triệu chứng đầu vào và phân tích',
    '2. Dự đoán các bệnh có thể xảy ra (xếp theo xác suất, có mức độ nguy cơ)',
    '3. Vùng cơ thể ảnh hưởng',
    '4. Khuyến nghị chăm sóc tại nhà tạm thời',
    '5. Cảnh báo quan trọng',
    `Tên thú cưng: ${petName || 'Không rõ'}`,
    `Loài: ${species || 'Không rõ'}`,
    `Ngày lịch khám: ${dateLabel || 'Không rõ'}`,
    `Triệu chứng: ${symptomsText || 'Không có'}`,
    'Không trả về JSON, không dùng code block.',
  ].join('\n');
};

const requestDiagnosisFromAi = ({ symptomsText, petName, species, appointmentDate, timeoutMs = 25000 }) => {
  return new Promise((resolve, reject) => {
    const requestId = makeRequestId();
    const prompt = `${buildPrompt({ symptomsText, petName, species, appointmentDate })}\n[MÃ_YÊU_CẦU:${requestId}]`;

    let resolved = false;
    let diagnosisRoomId = '';

    const cleanup = () => {
      socket.off('serverResponseMessage', onServerResponseMessage);
      socket.off('serverResponseAIMessage', onServerResponseAIMessage);
    };

    const finish = (callback) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      callback();
    };

    const timer = window.setTimeout(() => {
      finish(() => reject(new Error('AI phân tích quá thời gian chờ')));
    }, timeoutMs);

    const onServerResponseMessage = (message) => {
      const isMatchingUserPrompt =
        message?.sendBy === 'USER' &&
        typeof message?.content === 'string' &&
        message.content.includes(`[MÃ_YÊU_CẦU:${requestId}]`);

      if (isMatchingUserPrompt) {
        diagnosisRoomId = message.roomId || '';
      }
    };

    const onServerResponseAIMessage = (message) => {
      if (!diagnosisRoomId) return;
      if (message?.sendBy !== 'AI') return;
      if (message?.roomId !== diagnosisRoomId) return;

      window.clearTimeout(timer);
      finish(() => resolve(String(message?.content || '').trim()));
    };

    socket.on('serverResponseMessage', onServerResponseMessage);
    socket.on('serverResponseAIMessage', onServerResponseAIMessage);

    socket.emit('message', {
      content: prompt,
      roomId: undefined,
      sendBy: 'USER',
    });
  });
};

const getRiskLevel = (symptoms) => {
  const text = symptoms.join(' ').toLowerCase();

  const hasHighRisk = HIGH_RISK_KEYWORDS.some((keyword) => text.includes(keyword));
  if (hasHighRisk) return 'Nguy cơ cao';

  const hasMediumRisk = MEDIUM_RISK_KEYWORDS.some((keyword) => text.includes(keyword));
  if (hasMediumRisk) return 'Nguy cơ trung bình';

  return 'Nguy cơ thấp đến trung bình';
};

const buildFallbackMarkdown = ({ symptomsText, petName, appointmentDate }) => {
  const symptoms = normalizeSymptoms(symptomsText);
  const dateLabel = formatDateLabel(appointmentDate) || 'Không rõ';
  const riskLevel = getRiskLevel(symptoms);
  const symptomLines = symptoms.length > 0 ? symptoms.map((item) => `- ${item}`).join('\n') : '- Chưa có dữ liệu triệu chứng rõ ràng';

  return [
    `### 1. Các triệu chứng đầu vào và phân tích`,
    symptomLines,
    '',
    'Các triệu chứng trên cho thấy thú cưng có dấu hiệu bất thường cần theo dõi sát trong thời gian trước lịch khám.',
    '',
    '### 2. Dự đoán các bệnh có thể xảy ra',
    `- Rối loạn tiêu hóa hoặc nhiễm trùng mức độ nhẹ đến trung bình (${riskLevel}).`,
    '- Phản ứng viêm theo cơ địa hoặc thay đổi chế độ ăn, môi trường sống.',
    '- Cần bác sĩ khám trực tiếp để loại trừ bệnh lý nền nghiêm trọng.',
    '',
    '### 3. Vùng cơ thể ảnh hưởng',
    '- Hệ tiêu hóa và chuyển hóa.',
    '- Tổng trạng (ăn uống, năng lượng, thể trạng).',
    '',
    '### 4. Khuyến nghị chăm sóc tại nhà tạm thời',
    '- Theo dõi ăn uống, uống nước, thân nhiệt và mức độ hoạt động.',
    '- Tránh tự ý dùng thuốc của người cho thú cưng.',
    '- Nếu triệu chứng tăng nhanh, cần đưa thú cưng đến cơ sở thú y sớm hơn lịch hẹn.',
    '',
    '### 5. Cảnh báo quan trọng',
    `- Báo cáo AI cho ${petName || 'thú cưng'} (lịch khám ${dateLabel}) chỉ mang tính tham khảo, không thay thế chẩn đoán lâm sàng của bác sĩ thú y.`,
  ].join('\n');
};

export const getStoredDiagnosisReport = (appointmentId) => {
  if (!appointmentId) return null;

  const storage = readStorage();
  return storage[appointmentId] || null;
};

export const saveDiagnosisReport = (appointmentId, reportData) => {
  if (!appointmentId || !reportData) return;

  const storage = readStorage();
  storage[appointmentId] = reportData;
  writeStorage(storage);
};

export const generateAndStoreDiagnosisReport = async ({
  appointmentId,
  symptomsText,
  petName,
  species,
  appointmentDate,
}) => {
  const cached = getStoredDiagnosisReport(appointmentId);
  if (cached) {
    return cached;
  }

  const fallbackMarkdown = buildFallbackMarkdown({
    symptomsText,
    petName,
    appointmentDate,
  });

  let reportMarkdown = fallbackMarkdown;
  let source = 'fallback';

  try {
    const aiMarkdown = await requestDiagnosisFromAi({
      symptomsText,
      petName,
      species,
      appointmentDate,
    });

    if (aiMarkdown) {
      reportMarkdown = aiMarkdown;
      source = 'ai';
    }
  } catch {
    source = 'fallback';
  }

  const reportData = {
    appointmentId,
    symptomsText: symptomsText || '',
    petName: petName || '',
    species: species || '',
    appointmentDate,
    appointmentDateLabel: formatDateLabel(appointmentDate),
    reportMarkdown,
    source,
    generatedAt: new Date().toISOString(),
  };

  saveDiagnosisReport(appointmentId, reportData);

  return reportData;
};