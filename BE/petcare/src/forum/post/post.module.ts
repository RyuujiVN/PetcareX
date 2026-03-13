import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumPost } from '../entities/forum_post.entity';
import { Like } from '../entities/like.entity';
import { CommentModule } from '../comment/comment.module';

@Module({
  imports: [TypeOrmModule.forFeature([ForumPost, Like]), CommentModule],
  providers: [PostService],
  controllers: [PostController],
})
export class PostModule {}
