export type RevenueFilterChart = {
  dateStart: Date;
  dateEnd: Date;
  groupBy: 'DAY' | 'MONTH';
};

export type RevenueBookedClinic = {
  orderByType: 'ASC' | 'DESC';
};
