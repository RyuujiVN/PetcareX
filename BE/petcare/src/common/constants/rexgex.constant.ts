const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/;

const phoneRegex = /^\d{10}$/;

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const regex = {
  passwordRegex,
  phoneRegex,
  timeRegex,
};
