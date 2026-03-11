import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ForumComment } from '../entities/forum_comment.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateCommentDTO } from './dtos/create-comment.dto';
import { User } from 'src/user/entities/user.entity';
import { ForumPost } from '../entities/forum_post.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(ForumComment)
    private readonly commentRepository: Repository<ForumComment>,
    private readonly dataSource: DataSource,
  ) {}

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
        },
      };
    });
  }
}
