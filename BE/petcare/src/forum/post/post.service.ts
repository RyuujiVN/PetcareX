/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDTO } from './dtos/create-post.dto';
import { ForumPost } from '../entities/forum_post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UpdatePostDTO } from './dtos/update-post.dto';
import { User } from 'src/user/entities/user.entity';
import { RoleEnum } from 'src/common/enums/role.enum';
import { PostPagination } from './types/post-pagination.type';
import { Like } from '../entities/like.entity';
import { Notification } from 'src/notification/entities/notification.entity';
import { NotificationEnum } from 'src/common/enums/notification.enum';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { PostSearchService } from './post-search.service';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    @InjectRepository(ForumPost)
    private readonly postRepository: Repository<ForumPost>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly postSearchService: PostSearchService,
    private readonly notificationGateway: NotificationGateway,
    private readonly dataSource: DataSource,
  ) {}

  // Lấy danh sách bài đăng
  async findAllPagination(options: PostPagination, userId: string) {
    const postIds = await this.postSearchService.searchPostIds(options);

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoin('post.author', 'author')
      .leftJoin('post.topic', 'topic')
      .leftJoin(
        'post.likes',
        'like',
        'like.postId = post.id AND like.userId = :id',
        { id: userId },
      )
      .whereInIds(postIds)
      .select([
        'post.id',
        'post.content',
        'post.commentCount',
        'post.likeCount',
        'post.createdAt',

        'author.id',
        'author.fullName',
        'author.avatarUrl',
        'author.role',

        'topic.id',
        'topic.nameVn',
        'topic.nameEng',
      ])
      .addSelect('like.postId IS NOT NULL', 'liked')
      .orderBy(`ARRAY_POSITION(ARRAY[:...postIds]::uuid[], post.id)`) // Giữ đúng thứ tự elastic trả về
      .setParameter('postIds', postIds);

    const posts = await queryBuilder.getRawMany();

    return posts.map((post) => ({
      id: post.post_id,
      content: post.post_content,
      commentCount: post.post_comment_count,
      likeCount: post.post_like_count,
      createdAt: post.post_created_at,
      author: {
        id: post.author_id,
        fullName: post.author_full_name,
        avatarUrl: post.author_avatar_url,
        role: post.author_role,
      },
      topic: {
        id: post.topic_id,
        nameVn: post.topic_name_vn,
        nameEng: post.topic_name_eng,
      },
      liked: post.liked,
    }));
  }

  // Like bài đăng
  async likePost(postId: string, userId: string) {
    const result = await this.dataSource.transaction(async (manager) => {
      const likeRepo = manager.getRepository(Like);
      const postRepo = manager.getRepository(ForumPost);

      const like = new Like();
      like.userId = userId;
      like.postId = postId;

      const [_, post, user] = await Promise.all([
        likeRepo.save(like),
        postRepo.findOne({
          where: { id: postId },
          select: ['id', 'authorId'],
        }),
        manager.getRepository(User).findOne({
          where: { id: userId },
          select: ['id', 'fullName', 'avatarUrl'],
        }),
      ]);

      if (!post) throw new NotFoundException('Không tìm thấy post');

      await postRepo.increment({ id: post.id }, 'likeCount', 1);

      return {
        postId: post.id,
        authorId: post.authorId,
        likeCount: post.likeCount + 1,
        liked: true,
        userName: user?.fullName,
        avatarUrl: user?.avatarUrl,
      };
    });

    // Gửi thông báo đến người đăng post (không tự like chính mình)
    if (result.authorId && result.authorId !== userId) {
      try {
        const notification = this.notificationRepository.create({
          recipientId: result.authorId,
          type: NotificationEnum.LIKE,
          target: {
            postId: result.postId,
            userId,
            userName: result.userName,
            avatarUrl: result.avatarUrl,
          },
        });
        const saved = await this.notificationRepository.save(notification);
        this.notificationGateway.sendNotification(saved.recipientId, saved);
      } catch (error) {
        this.logger.error(error.message, error.stack);
      }
    }

    return {
      postId: result.postId,
      likeCount: result.likeCount,
      liked: result.liked,
    };
  }

  // Xoá like bài đăng
  async removeLikePost(postId: string, userId: string) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Xoá like
      const likeRepo = manager.getRepository(Like);
      const result = await likeRepo.delete({ postId: postId, userId: userId });

      if (result.affected === 0)
        throw new NotFoundException('Không tìm thấy bài đăng');

      // 2. Cập nhật lượt like bên post
      const postRepo = manager.getRepository(ForumPost);
      const post = await postRepo.findOne({ where: { id: postId } });

      if (post) {
        await postRepo.decrement({ id: postId }, 'likeCount', 1);

        return {
          postId: post.id,
          likeCount: post.likeCount - 1,
          liked: false,
        };
      }
    });
  }

  // Tạo mới bài đăng
  async createPost(createDTO: CreatePostDTO, author: User) {
    const post = this.postRepository.create(createDTO);
    post.authorId = author.id;

    const savedPost = await this.postRepository.save(post);

    const postDoc = {
      ...savedPost,
      authorName: author.fullName,
      avatarUrl: author.avatarUrl,
    };

    await this.postSearchService.createPost(postDoc);

    return savedPost;
  }

  // Chỉnh sửa bài đăng
  async updatePost(updateDTO: UpdatePostDTO, id: string) {
    const post = await this.postRepository.findOne({ where: { id: id } });

    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    Object.assign(post, updateDTO);
    await this.postRepository.save(post);

    await this.postSearchService.updatePost(updateDTO, id);
  }

  // Xoá bài đăng
  async deletePost(id: string, user: User) {
    const post = await this.postRepository.findOne({ where: { id: id } });

    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    if (post.authorId === user.id || user.role === RoleEnum.ADMIN)
      await this.postRepository.delete({ id: id });
    else throw new ForbiddenException('Bạn không có quyền xoá bài viết này');
  }
}
