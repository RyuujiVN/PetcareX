import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumPost } from '../entities/forum_post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ForumPost])],
  providers: [PostService],
  controllers: [PostController],
})
export class PostModule {}
