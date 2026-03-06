import { WHITELIST_DOMAIN } from '../constants/list-domain.constant';

export const corsOptions = {
  origin: (origin, callback) => {
    // Nếu là môi trường develop và dùng postman test api
    if (!origin || WHITELIST_DOMAIN.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  optionsSuccessStatus: 200,
};
