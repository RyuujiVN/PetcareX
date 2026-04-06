import {
  getPetBreedLabel,
  getPetSpeciesLabel,
  humanizeEnumValue,
} from '../utils/enumLabel'
import { uploadOneFileToCloudinary } from './cloudinaryService'
// Lấy các enum label cho pet
export const getEnumLabel = (value) => {
  if (!value) return ''
  return humanizeEnumValue(value, '')
}
// Lấy enum của loài
export const getSpeciesLabel = (species) =>
  getPetSpeciesLabel(species, 'Chưa câp nhật loài')

export const getBreedLabel = (breed, species) =>
  getPetBreedLabel(breed, species, 'Chưa câp nhật giống')

export const getMyPetsApi = (instance) => {
  return instance.get('/pet').then((response) => {
    const data = response.data
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.items)) return data.items
    if (Array.isArray(data?.data)) return data.data
    return []
  })
}
// Lấy thông tin chi tiết của pet theo id
export const getPetByIdApi = (instance, petId) => {
  return instance.get(`/pet/${petId}`).then((response) => response.data)
}
// Tạo pet mới
export const createPetApi = (instance, data) => {
  return instance.post('/pet', data).then((response) => response.data)
}
// Cập nhật thông tin pet
export const updatePetApi = (instance, petId, data) => {
  return instance.put(`/pet/${petId}`, data).then((response) => response.data)
}
// Xóa pet
export const deletePetApi = (instance, petId) => {
  return instance.delete(`/pet/${petId}`).then((response) => response.data)
}
// Lấy danh sách loài
export const getPetSpeciesApi = (instance) => {
  return instance.get('/pet/species').then((response) => response.data)
}
// Lấy danh sách giống theo loài
export const getBreedsBySpeciesApi = (instance, speciesId) => {
  return instance
    .get(`/pet/species/${speciesId}/breed`)
    .then((response) => response.data)
}
// Lấy danh sách pet của chủ sở hữu
export const getPetsByOwnerApi = (
  instance,
  { ownerId, page = 1, limit = 200 } = {},
) => {
  return instance
    .get('/pet', {
      params: { ownerId, page, limit },
    })
    .then((response) => response.data)
}
// Tải lên ảnh đại diện cho pet
export const uploadPetAvatarApi = (file) => {
  return uploadOneFileToCloudinary(file).then((payload) => ({
    ...payload,
    file: payload.file,
  }))
}
