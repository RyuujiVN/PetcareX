import { Module } from '@nestjs/common';
import { PostModule } from './post/post.module';
import { TopicModule } from './topic/topic.module';
import { CommentModule } from './comment/comment.module';

@Module({
  imports: [PostModule, TopicModule, CommentModule],
})
export class ForumModule {}
