import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePostDTO } from './dtos/create-post.dto';
import { ForumPost } from '../entities/forum_post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdatePostDTO } from './dtos/update-post.dto';
import { User } from 'src/user/entities/user.entity';
import { RoleEnum } from 'src/common/enums/role.enum';
import { PostPagination } from './types/post-pagination.type';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(ForumPost)
    private readonly postRepository: Repository<ForumPost>,
  ) {}

  async findAllPagination(options: PostPagination): Promise<ForumPost[]> {
    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoin('post.author', 'author')
      .leftJoin('post.topic', 'topic')
      .select([
        'post.id',
        'post.content',
        'post.commentCount',
        'post.likeCount',
        'post.createdAt',
        'author.id',
        'author.fullName',
        'author.avatarUrl',
        'topic.id',
        'topic.name',
      ])
      .limit(options.limit)
      .orderBy('post.createdAt', 'DESC');

    if (options.lastPostTime)
      queryBuilder.andWhere('post.createdAt < :time', {
        time: new Date(options.lastPostTime),
      });

    return await queryBuilder.getMany();
  }

  async createPost(
    createDTO: CreatePostDTO,
    authorId: string,
  ): Promise<ForumPost> {
    const post = this.postRepository.create(createDTO);
    post.authorId = authorId;

    return await this.postRepository.save(post);
  }

  async updatePost(updateDTO: UpdatePostDTO, id: string) {
    const post = await this.postRepository.findOne({ where: { id: id } });

    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    Object.assign(post, updateDTO);
    await this.postRepository.save(post);
  }

  async deletePost(id: string, user: User) {
    const post = await this.postRepository.findOne({ where: { id: id } });

    if (!post) throw new NotFoundException('Không tìm thấy bài viết');

    if (post.authorId === user.id || user.role === RoleEnum.ADMIN)
      await this.postRepository.delete({ id: id });
    else throw new ForbiddenException('Bạn không có quyền xoá bài viết này');
  }
}
