import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateTopicDTO } from './dtos/create-topic.dto';
import { ForumTopic } from '../entities/forum_topic.entity';
import { TopicService } from './topic.service';
import { UpdateTopicDTO } from './dtos/update-topic.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('topic')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách chủ đề có phân trang' })
  @ApiQuery({ name: 'page', required: true, type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: true, type: Number, default: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm kiếm theo tên chủ đề',
  })
  getAllPagination(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ): Promise<Pagination<ForumTopic>> {
    return this.topicService.findAllPagination({
      page,
      limit,
      search,
    });
  }

  @Get('get-all')
  @ApiOperation({ summary: 'Lấy danh sách chủ đề không phân trang' })
  getAll(): Promise<ForumTopic[]> {
    return this.topicService.findAll();
  }

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
