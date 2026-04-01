import { FilterPagination } from 'src/common/types/pagination.type';

export type AppointmentPagination = FilterPagination & {
  appointmentDate?: Date;
  appointmentTime?: string;
};
