import { ReportStatusEnum, ReportTypeEnum } from 'src/common/enums/report.enum';
import { FilterPagination } from 'src/common/types/pagination.type';

export type ReportPagination = FilterPagination & {
  status?: ReportStatusEnum;
  targetType?: ReportTypeEnum;
};
