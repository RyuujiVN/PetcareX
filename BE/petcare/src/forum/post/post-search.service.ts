import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { FORUM_POST_INDEX, ForumPostIndexMapping } from './post.index';
import { UpdatePostDTO } from './dtos/update-post.dto';
import { PostPagination } from './types/post-pagination.type';
import { range } from 'rxjs';

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

      this.logger.log(`Createdd index: ${FORUM_POST_INDEX}`);
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
        _source: false,
        retriever: {
          rrf: {
            retrievers: [
              // Retriever 1: BM25 full-text search
              {
                standard: {
                  query: {
                    bool: {
                      must: [
                        {
                          match: {
                            content: {
                              query: hasKeyword,
                              fuzziness: 'AUTO',
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

              // Retriever 1: Semantic search
              {
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
            ],
            rank_window_size: 50, // Mỗi retriever trả về 50 record
            rank_constant: 20,
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
