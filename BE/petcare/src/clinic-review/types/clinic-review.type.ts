import { FilterPagination } from 'src/common/types/pagination.type';

export type ClinicReviewPagination = FilterPagination & {
  clinicId: string;
};
