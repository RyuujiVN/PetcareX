import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ForumTopic } from '../entities/forum_topic.entity';
import { Repository } from 'typeorm';
import { CreateTopicDTO } from './dtos/create-topic.dto';
import { UpdateTopicDTO } from './dtos/update-topic.dto';
import { paginate, Pagination } from 'nestjs-typeorm-paginate';
import { FilterPagination } from 'src/common/types/pagination.type';

@Injectable()
export class TopicService {
  constructor(
    @InjectRepository(ForumTopic)
    private readonly topicRepository: Repository<ForumTopic>,
  ) {}

  findAllPagination(
    options: FilterPagination,
  ): Promise<Pagination<ForumTopic>> {
    const queryBuilder = this.topicRepository
      .createQueryBuilder('topic')
      .orderBy('topic.createdAt', 'DESC');

    if (options.search)
      queryBuilder.andWhere('topic.name ILIKE :name', {
        name: `%${options.search}%`,
      });

    return paginate<ForumTopic>(queryBuilder, options);
  }

  async findAll(): Promise<ForumTopic[]> {
    return await this.topicRepository.find({});
  }

  async createTopic(createDTO: CreateTopicDTO): Promise<ForumTopic> {
    return await this.topicRepository.save(createDTO);
  }

  async updateTopic(updateDTO: UpdateTopicDTO, id: string) {
    const topic = await this.topicRepository.findOne({ where: { id: id } });

    if (!topic) throw new NotFoundException('Không tìm thấy chủ đề');

    Object.assign(topic, updateDTO);

    await this.topicRepository.save(topic);
  }

  async deleteTopic(id: string) {
    const result = await this.topicRepository.delete({ id: id });

    if (result.affected === 0)
      throw new NotFoundException('Không tìm thấy chủ đề');
  }
}
