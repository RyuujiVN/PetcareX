export const INVOICE_STATUS = {
  PAID: 'PAID',
  UNPAID: 'UNPAID',
}
// Lấy hóa đơn theo id hồ sơ bệnh án
export const getInvoiceByMedicalRecordIdApi = (instance, medicalRecordId) => {
  return instance
    .get(`/invoice/${medicalRecordId}`)
    .then((response) => response.data)
}
// Tạo hóa đơn mới
export const createInvoiceApi = (instance, { petOwnerId, medicalRecordId }) => {
  return instance
    .post('/invoice', { petOwnerId, medicalRecordId })
    .then((response) => response.data)
}
// Cập nhật hóa đơn
export const updateInvoiceApi = (instance, invoiceId, payload) => {
  return instance
    .patch(`/invoice/${invoiceId}`, payload)
    .then((response) => response.data)
}
// Xóa hóa đơn
export const upsertPaidInvoiceByMedicalApi = async (
  instance,
  { medicalRecordId, petOwnerId, note },
) => {
  if (!medicalRecordId) {
    throw new Error('Không tìm thấy hồ sơ bệnh án để thanh toán hóa đơn')
  }

  let invoice = null

  try {
    invoice = await getInvoiceByMedicalRecordIdApi(instance, medicalRecordId)
  } catch (error) {
    const statusCode = error?.response?.status
    if (statusCode !== 404) {
      throw error
    }
  }

  if (!invoice) {
    if (!petOwnerId) {
      throw new Error('Không tìm thấy chủ nuôi để tạo hóa đơn')
    }
    invoice = await createInvoiceApi(instance, {
      petOwnerId,
      medicalRecordId,
    })
  }

  const invoiceId = invoice?.id
  if (!invoiceId) {
    throw new Error('Không xác định được mã hóa đơn để cập nhật trạng thái')
  }

  await updateInvoiceApi(instance, invoiceId, {
    status: INVOICE_STATUS.PAID,
    note: note || undefined,
  })

  return {
    ...invoice,
    id: invoiceId,
    status: INVOICE_STATUS.PAID,
  }
}
