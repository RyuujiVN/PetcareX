export const ENUM_KEYS = {
  APPOINTMENT_STATUS: 'appointmentStatus',
  SERVICE: 'service',
  ROLE: 'role',
  VETERINARY_SPECIALTY: 'veterinarySpecialty',
  PET_SPECIES: 'petSpecies',
  PET_BREED: 'petBreed',
  INVOICE_STATUS: 'invoiceStatus',
  SENDER: 'sender',
  MEDICINE_UNIT: 'medicineUnit',
  MEDICAL_RECORD_STATUS: 'medicalRecordStatus',
}

export const APPOINTMENT_STATUS_LABELS = {
  BOOKED: 'Chờ khám',
  SUCCESS: 'Chờ khám',
  IN_PROGRESS: 'Đang khám',
  COMPLETED: 'Đã hoàn thành',
  DONE: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
  CANCELED: 'Đã hủy',
}

export const SERVICE_LABELS = {
  PERIODIC_HEALTH_CHECK: 'Khám sức khỏe định kỳ',
  MEDICAL_EXAMINATION: 'Khám bệnh',
  VACCINATION: 'Tiêm chủng',
  DEWORMING: 'Tẩy giun',
  ULTRASOUND_AND_TEST: 'Siêu âm xét nghiệm',
  SURGERY: 'Phẫu thuật',
  EMERGENCY: 'Cấp cứu',
}

export const ROLE_LABELS = {
  ADMIN: 'Quản trị hệ thống',
  ADMIN_CLINIC: 'Admin phòng khám',
  VETERINARIAN: 'Bác sĩ thú y',
  CUSTOMER: 'Khách hàng',
  USER: 'Khách hàng',
}

export const VETERINARY_SPECIALTY_LABELS = {
  GENERAL_EXAMINATION: 'Khám tổng quát',
  INTERNAL_MEDICINE: 'Nội khoa',
  SURGERY: 'Ngoại khoa',
  ULTRASOUND: 'Chẩn đoán hình ảnh',
  VACCINATION_AND_PREVENTION: 'Tiêm chủng và phòng ngừa',
}

export const PET_SPECIES_LABELS = {
  DOG: 'Chó',
  CAT: 'Mèo',
  BIRD: 'Chim',
  RABBIT: 'Thỏ',
}

export const PET_BREED_LABELS = {
  DOG_GOLDEN_RETRIEVER: 'Golden Retriever',
  DOG_POODLE: 'Poodle',
  DOG_POMERANIAN: 'Phốc sóc',
  DOG_CORGI: 'Corgi',
  DOG_HUSKY: 'Husky',
  DOG_LABRADOR: 'Labrador',
  DOG_SHIBA_INU: 'Shiba Inu',
  CAT_BRITISH_SHORTHAIR: 'Mèo Anh lông ngắn',
  CAT_BRITISH_LONGHAIR: 'Mèo Anh lông dài',
  CAT_PERSIAN: 'Mèo Ba Tư',
  CAT_SIAMESE: 'Mèo Xiêm',
  CAT_BENGAL: 'Mèo Bengal',
  BIRD_RED_WHISKERED_BULBUL: 'Chào mào',
  BIRD_PARROT: 'Vẹt',
  BIRD_BUDGERIGAR: 'Yến phụng',
  RABBIT_DUTCH: 'Thỏ Dutch',
  RABBIT_LIONHEAD: 'Thỏ Lionhead',
}

export const INVOICE_STATUS_LABELS = {
  PAID: 'Đã thanh toán',
  UNPAID: 'Chưa thanh toán',
}

export const SENDER_LABELS = {
  USER: 'Người dùng',
  AI: 'AI',
}

export const MEDICINE_UNIT_LABELS = {
  PILL: 'Viên',
  BLISTER: 'Vỉ',
  CAPSULE: 'Viên nang',
  SACHET: 'Gói',
  BOTTLE: 'Chai',
  VIAL: 'Lọ',
  AMPOULE: 'Ống',
  ML: 'ml',
  MG: 'mg',
}

export const MEDICAL_RECORD_STATUS_LABELS = {
  DONE: 'Đã hoàn thành',
  COMPLETED: 'Đã hoàn thành',
  PENDING: 'Chưa hoàn thành',
  INCOMPLETE: 'Chưa hoàn thành',
}

export const ENUM_LABEL_MAPS = {
  [ENUM_KEYS.APPOINTMENT_STATUS]: APPOINTMENT_STATUS_LABELS,
  [ENUM_KEYS.SERVICE]: SERVICE_LABELS,
  [ENUM_KEYS.ROLE]: ROLE_LABELS,
  [ENUM_KEYS.VETERINARY_SPECIALTY]: VETERINARY_SPECIALTY_LABELS,
  [ENUM_KEYS.PET_SPECIES]: PET_SPECIES_LABELS,
  [ENUM_KEYS.PET_BREED]: PET_BREED_LABELS,
  [ENUM_KEYS.INVOICE_STATUS]: INVOICE_STATUS_LABELS,
  [ENUM_KEYS.SENDER]: SENDER_LABELS,
  [ENUM_KEYS.MEDICINE_UNIT]: MEDICINE_UNIT_LABELS,
  [ENUM_KEYS.MEDICAL_RECORD_STATUS]: MEDICAL_RECORD_STATUS_LABELS,
}
