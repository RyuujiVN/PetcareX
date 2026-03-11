import { FilterPagination } from "src/common/types/pagination.type";


export type MedicalRecordPagination = FilterPagination & {
  clinicId?: string;
  petId?: string;
};
