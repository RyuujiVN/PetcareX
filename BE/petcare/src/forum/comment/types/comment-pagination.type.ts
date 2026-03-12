export type CommentPagination = {
  limit: number;
  createdAt?: Date;
};

export type CommentReplyPagination = CommentPagination & {
  parentId: string;
};
