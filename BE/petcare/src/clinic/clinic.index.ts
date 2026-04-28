export const CLINIC_INDEX = 'clinic_index';

export const ClinicIndexMapping = {
  index: CLINIC_INDEX,
  mappings: {
    properties: {
      id: { type: 'keyword' },
      name: { type: 'text' },
      address: { type: 'text' },
      location: { type: 'geo_point' },
      avatarUrl: { type: 'keyword' },
      phone: { type: 'keyword' },
      avgRating: { type: 'float' },
      totalReviews: { type: 'integer' },
      openingTime: { type: 'keyword' },
      closingTime: { type: 'keyword' },
      deleted: { type: 'boolean' },
    },
  },
};
