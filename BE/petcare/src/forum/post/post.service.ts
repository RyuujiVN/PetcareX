import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDTO } from './dtos/create-post.dto';
import { ForumPost } from '../entities/forum_post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdatePostDTO } from './dtos/update-post.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(ForumPost)
    private readonly postRepository: Repository<ForumPost>,
  ) {}

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

  async deletePost(id: string) {
    const result = await this.postRepository.delete({ id: id });

    if (result.affected === 0)
      throw new NotFoundException('Không tìm thấy bài viết');
  }
}
