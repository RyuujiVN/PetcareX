import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { CreateTopicDTO } from './dtos/create-topic.dto';
import { ForumTopic } from '../entities/forum_topic.entity';
import { TopicService } from './topic.service';
import { UpdateTopicDTO } from './dtos/update-topic.dto';

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

  @Put(':id')
  @ApiOperation({ summary: 'Chỉnh sửa chủ đề' })
  @ApiBody({
    type: UpdateTopicDTO,
  })
  async updateTopic(
    @Param('id') id: string,
    @Body() updateDTO: UpdateTopicDTO,
  ) {
    await this.topicService.updateTopic(updateDTO, id);

    return {
      message: 'Cập nhật chủ đề thành công',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá chủ đề' })
  async deleteTopic(@Param('id') id: string) {
    await this.topicService.deleteTopic(id);

    return {
      message: 'Xoá chủ đề thành công',
    };
  }
}
