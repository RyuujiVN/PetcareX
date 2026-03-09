import { FilterPagintion } from 'src/common/types/pagination.type';

export type MedicalRecordPagination = FilterPagintion & {
  clinicId?: string;
  petId?: string;
};
