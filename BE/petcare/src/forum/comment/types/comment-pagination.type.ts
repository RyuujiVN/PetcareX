export type CommentPagination = {
  postId?: string;
  limit: number;
  createdAt?: Date;
};

export type CommentReplyPagination = CommentPagination & {
  parentId: string;
};
