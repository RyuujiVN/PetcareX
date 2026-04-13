import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEnum } from 'src/common/enums/role.enum';
import { User } from 'src/user/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { ForumComment } from '../entities/forum_comment.entity';
import { ForumPost } from '../entities/forum_post.entity';
import { CreateCommentDTO } from './dtos/create-comment.dto';
import { UpdateCommentDTO } from './dtos/update-comment.dto';
import {
  CommentPagination,
  CommentReplyPagination,
} from './types/comment-pagination.type';
import { Notification } from 'src/notification/entities/notification.entity';
import { NotificationEnum } from 'src/common/enums/notification.enum';
import { NotificationGateway } from 'src/notification/notification.gateway';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(ForumComment)
    private readonly commentRepository: Repository<ForumComment>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationGateway: NotificationGateway,
    private readonly dataSource: DataSource,
  ) {}

  // Danh sách bình luận
  async findAllPagination(options: CommentPagination) {
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoin('comment.user', 'user')
      .addSelect(['user.id', 'user.fullName', 'user.avatarUrl', 'user.role'])
      .where('comment.parentId IS NULL')
      .andWhere('comment.postId = :id', { id: options.postId })
      .limit(options.limit)
      .orderBy('comment.createdAt', 'DESC');

    if (options.createdAt)
      queryBuilder.andWhere('comment.createdAt < :time', {
        time: new Date(options.createdAt),
      });

    return await queryBuilder.getMany();
  }

  // Danh sách bình luận là reply
  async findAllReplyPagination(options: CommentReplyPagination) {
    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoin('comment.user', 'user')
      .addSelect(['user.id', 'user.fullName', 'user.avatarUrl', 'user.role'])
      .where('comment.parentId = :id', {
        id: options.parentId,
      })
      .limit(options.limit)
      .orderBy('comment.createdAt', 'ASC');

    if (options.createdAt)
      queryBuilder.andWhere('comment.createdAt > :time', {
        time: new Date(options.createdAt),
      });

    return await queryBuilder.getMany();
  }

  async createComment(createDTO: CreateCommentDTO, user: User) {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Tạo mới bình luận
      const commentRepo = manager.getRepository(ForumComment);

      const comment = commentRepo.create(createDTO);
      comment.userId = user.id;

      const savedComment = await commentRepo.save(comment);

      // 2. Nếu bình luận này là reply thì sẽ cập nhật replyCount của bình luận cha
      if (savedComment.parentId) {
        await commentRepo.increment(
          {
            id: savedComment.parentId,
          },
          'replyCount',
          1,
        );
      }

      // 3. Cập nhật số lượng comment của post
      const postRepo = manager.getRepository(ForumPost);
      await postRepo.increment({ id: savedComment.postId }, 'commentCount', 1);

      return {
        ...savedComment,
        user: {
          id: user.id,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          role: user.role,
        },
      };
    });
  }

  async updateComment(updateDTO: UpdateCommentDTO, id: string, user: User) {
    const comment = await this.commentRepository.findOne({ where: { id: id } });

    if (!comment) throw new NotFoundException('Không tìm thấy bình luận');

    if (comment.userId !== user.id)
      throw new ForbiddenException('Không có quyền chỉnh sửa bình luận này');

    Object.assign(comment, updateDTO);
    await this.commentRepository.save(comment);
  }

  async deleteComment(id: string, user: User) {
    await this.dataSource.transaction(async (manager) => {
      // 1. Kiểm tra xem thử có quyền xoá không
      const commentRepo = manager.getRepository(ForumComment);
      const comment = await commentRepo.findOne({ where: { id: id } });

      if (!comment) throw new NotFoundException('Không tìm thấy bình luận');
      if (comment.userId !== user.id && user.role !== RoleEnum.ADMIN)
        throw new ForbiddenException('Không có quyền xoá bình luận này');

      // 2. Xoá bình luận
      await commentRepo.delete({ id: id });

      // 3. Cập nhật lại lượt bình luận ở post
      const postRepo = manager.getRepository(ForumPost);
      await postRepo.decrement(
        { id: comment.postId },
        'commentCount',
        1 + comment.replyCount,
      );
    });
  }
}
