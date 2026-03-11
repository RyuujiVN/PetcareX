import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { CreateTopicDTO } from './dtos/create-topic.dto';
import { ForumTopic } from '../entities/forum_topic.entity';
import { TopicService } from './topic.service';

@Controller('topic')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Post('')
  @ApiOperation({ summary: 'Tạo mới chủ đề' })
  @ApiBody({
    type: CreateTopicDTO,
  })
  createTopic(@Body() createDTO: CreateTopicDTO): Promise<ForumTopic> {
    return this.topicService.createTopic(createDTO);
  }
}
