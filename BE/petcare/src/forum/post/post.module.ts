import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumPost } from '../entities/forum_post.entity';
import { Like } from '../entities/like.entity';
import { CommentModule } from '../comment/comment.module';
import { Notification } from 'src/notification/entities/notification.entity';
import { NotificationModule } from 'src/notification/notification.module';
import { ElasticSearchModule } from 'src/elastic-search/elastic-search.module';
import { PostSearchService } from './post-search.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ForumPost, Like, Notification]),
    CommentModule,
    NotificationModule,
    ElasticSearchModule,
  ],
  providers: [PostService, PostSearchService],
  controllers: [PostController],
})
export class PostModule {}
