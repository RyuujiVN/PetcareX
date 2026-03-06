import { FilterPagintion } from 'src/common/types/pagination.type';

export type VetFilterPagination = FilterPagintion & {
  clinicId: string;
  specialty?: string;
};
