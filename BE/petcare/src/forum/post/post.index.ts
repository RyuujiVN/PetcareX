export const FORUM_POST_INDEX = 'forum_post';

export const ForumPostIndexMapping = {
  index: FORUM_POST_INDEX,
  mappings: {
    properties: {
      id: { type: 'keyword' },
      topicId: { type: 'keyword' },
      semantic_content: {
        type: 'semantic_text',
      },
      content: {
        type: 'text',
        copy_to: 'semantic_content',
      },
      createdAt: { type: 'date' },
    },
  },
};
