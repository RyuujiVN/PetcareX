import { FilterPagination } from "src/common/types/pagination.type";


export type VetFilterPagination = FilterPagination & {
  clinicId: string;
  specialty?: string;
};
