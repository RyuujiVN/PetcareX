import instance from './instance'

export const INVOICE_STATUS = {
	PAID: 'PAID',
	UNPAID: 'UNPAID',
}

export const getInvoiceByMedicalRecordIdApi = (medicalRecordId) => {
	return instance.get(`/invoice/${medicalRecordId}`).then((response) => response.data)
}

export const createInvoiceApi = ({ petOwnerId, medicalRecordId }) => {
	return instance
		.post('/invoice', {
			petOwnerId,
			medicalRecordId,
		})
		.then((response) => response.data)
}

export const updateInvoiceApi = (invoiceId, payload) => {
	return instance.patch(`/invoice/${invoiceId}`, payload).then((response) => response.data)
}

export const upsertPaidInvoiceByMedicalApi = async ({ medicalRecordId, petOwnerId, note }) => {
	if (!medicalRecordId) {
		throw new Error('Không tìm thấy hồ sơ bệnh án để thanh toán')
	}

	let invoice = null

	try {
		invoice = await getInvoiceByMedicalRecordIdApi(medicalRecordId)
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
		invoice = await createInvoiceApi({
			petOwnerId,
			medicalRecordId,
		})
	}

	const invoiceId = invoice?.id
	if (!invoiceId) {
		throw new Error('Không xác định được mã hóa đơn để cập nhật')
	}

	await updateInvoiceApi(invoiceId, {
		status: INVOICE_STATUS.PAID,
		note: note || undefined,
	})

	return {
		...invoice,
		id: invoiceId,
		status: INVOICE_STATUS.PAID,
	}
}
