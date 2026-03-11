import { Module } from '@nestjs/common';
import { TopicController } from './topic.controller';
import { TopicService } from './topic.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumTopic } from '../entities/forum_topic.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ForumTopic])],
  controllers: [TopicController],
  providers: [TopicService],
})
export class TopicModule {}
