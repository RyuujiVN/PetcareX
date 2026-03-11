import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ForumTopic } from '../entities/forum_topic.entity';
import { Repository } from 'typeorm';
import { CreateTopicDTO } from './dtos/create-topic.dto';

@Injectable()
export class TopicService {
  constructor(
    @InjectRepository(ForumTopic)
    private readonly topicRepository: Repository<ForumTopic>,
  ) {}

  async createTopic(createDTO: CreateTopicDTO): Promise<ForumTopic> {
    return await this.topicRepository.save(createDTO);
  }
}
