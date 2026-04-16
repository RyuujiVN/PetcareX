import { InvoiceStatusEnum } from 'src/common/enums/invoice-status.enum';
import { FilterPagination } from 'src/common/types/pagination.type';

export type InvoicePagination = FilterPagination & {
  status?: InvoiceStatusEnum;
};
