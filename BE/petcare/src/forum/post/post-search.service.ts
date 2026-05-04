import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { FORUM_POST_INDEX, ForumPostIndexMapping } from './post.index';
import { UpdatePostDTO } from './dtos/update-post.dto';
import { PostPagination } from './types/post-pagination.type';

@Injectable()
export class PostSearchService implements OnModuleInit {
  private readonly logger = new Logger(PostSearchService.name);

  constructor(private readonly elasticSearchService: ElasticsearchService) {}

  async onModuleInit() {
    await this.ensureIndex();
  }

  // Kiểm tra index có tồn tại
  async ensureIndex() {
    const exist = await this.elasticSearchService.indices.exists({
      index: FORUM_POST_INDEX,
    });

    if (!exist) {
      await this.elasticSearchService.indices.create(
        ForumPostIndexMapping as any,
      );

      this.logger.log(`Created index: ${FORUM_POST_INDEX}`);
    }
  }

  // Tìm kiếm và phân trang
  async searchPostIds(options: PostPagination) {
    const filter: any[] = [];
    const sort: any[] = [];

    if (options.lastPostTime) {
      filter.push({
        range: { createdAt: { lt: new Date(options.lastPostTime) } },
      });
    }

    if (options.topicId) {
      filter.push({
        term: { topicId: options.topicId },
      });
    }

    if (options.sortRecent) {
      sort.push({
        createAt: 'desc',
      });
    }

    const hasKeyword = options.keyword?.trim();

    let postDocuments: any;

    // Nếu có keyword thì sẽ search
    if (hasKeyword) {
      postDocuments = await this.elasticSearchService.search({
        index: FORUM_POST_INDEX,
        size: options.limit,
        min_score: 0.5,
        _source: false,
        retriever: {
          linear: {
            retrievers: [
              // Retriever 1: BM25 full-text search
              {
                retriever: {
                  standard: {
                    query: {
                      bool: {
                        must: [
                          {
                            match: {
                              content: {
                                query: hasKeyword,
                                fuzziness: 'AUTO',
                                minimum_should_match: '2<70%',
                              },
                            },
                          },
                        ],
                        filter,
                      },
                    },
                    sort,
                  },
                },
                normalizer: 'l2_norm',
                weight: 0.3,
              },

              // Retriever 2: Semantic search
              {
                retriever: {
                  standard: {
                    query: {
                      bool: {
                        must: [
                          {
                            match: {
                              semantic_content: hasKeyword,
                            },
                          },
                        ],
                        filter,
                      },
                    },
                    sort,
                  },
                },
                normalizer: 'none',
                weight: 0.7,
              },
            ],
            rank_window_size: 50, // Mỗi retriever trả về 50 record
          },
        },
      });
    } else {
      // Không có keyword thì phân trang bình thường
      postDocuments = await this.elasticSearchService.search({
        index: FORUM_POST_INDEX,
        size: options.limit,
        _source: false,
        query: {
          bool: {
            filter,
          },
        },
        sort: [{ createdAt: 'desc' }],
      });
    }

    return postDocuments?.hits?.hits?.map((hit) => hit?._id);
  }

  // Tạo mới document
  async createPost(post: any) {
    await this.elasticSearchService.index({
      index: FORUM_POST_INDEX,
      id: post.id,
      document: {
        id: post.id,
        authorId: post.authorId,
        topicId: post.topicId,
        content: post.content,
        createdAt: post.createdAt,
      },
    });
  }

  // Tạo mới nhiều document
  async createManyPosts(posts: any[]) {
    const operations = posts.flatMap((post) => [
      { index: { _index: FORUM_POST_INDEX, _id: post.id } },
      {
        id: post.id,
        authorId: post.authorId,
        topicId: post.topicId,
        content: post.content,
        createdAt: post.createdAt,
      },
    ]);

    const result = await this.elasticSearchService.bulk({
      refresh: true,
      operations,
    });

    if (result.errors) {
      const errors = result.items.filter((item) => item.index?.error);
      this.logger.error('Bulk index errors', JSON.stringify(errors));
    }

    return result;
  }

  // Chỉnh sửa document
  async updatePost(data: UpdatePostDTO, postId: string) {
    await this.elasticSearchService.update({
      index: FORUM_POST_INDEX,
      id: postId,
      doc: data,
    });
  }

  // Xoá document
  async deletePost(postId: string) {
    return await this.elasticSearchService.delete({
      index: FORUM_POST_INDEX,
      id: postId,
    });
  }
}
