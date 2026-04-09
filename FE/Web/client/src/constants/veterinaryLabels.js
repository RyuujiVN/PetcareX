import {
  getRoleLabel as getRoleLabelVi,
  getVeterinarySpecialtyLabel,
  getVeterinarySpecialtyOptions,
} from '../utils/enumLabel'

export const getRoleLabel = (role) => getRoleLabelVi(role)

export const getSpecialtyLabel = (specialty) => getVeterinarySpecialtyLabel(specialty)

export const getSpecialtyOptions = () => getVeterinarySpecialtyOptions()
