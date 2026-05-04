// NOTE: BE currently exposes generic report endpoint: POST /report.
// Endpoint variants POST /post/:id/report and POST /comment/:id/report are not present yet.
// Keep these helpers for forward compatibility and add runtime fallback in Forum UI.

/**
 * Report a post.
 * Preferred endpoint: POST /post/:postId/report
 */
export const reportPostApi = async (instance, postId, payload) => {
  return instance.post(`/post/${postId}/report`, payload);
};

/**
 * Report a comment.
 * Preferred endpoint: POST /comment/:commentId/report
 */
export const reportCommentApi = async (instance, commentId, payload) => {
  return instance.post(`/comment/${commentId}/report`, payload);
};

/**
 * Admin: get reports.
 * GET /report?page=&limit=&status=
 */
export const getReportsApi = async (instance, params = {}) => {
  return instance.get('/report', { params });
};

/**
 * Admin: update report status.
 * PATCH /report/:id
 * TODO: BE controller currently does not expose this endpoint.
 */
export const updateReportStatusApi = async (instance, reportId, payload) => {
  return instance.patch(`/report/${reportId}`, payload);
};

/**
 * BE fallback: create report via generic endpoint.
 * POST /report with { targetId, targetType, reason }
 */
export const createGenericReportApi = async (instance, payload) => {
  return instance.post('/report', payload);
};
