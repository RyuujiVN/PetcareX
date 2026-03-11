import { Injectable } from '@nestjs/common';
import { CreatePostDTO } from './dtos/create-post.dto';
import { ForumPost } from '../entities/forum_post.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
}
