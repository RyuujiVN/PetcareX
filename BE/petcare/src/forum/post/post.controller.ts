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
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { CreatePostDTO } from './dtos/create-post.dto';
import { PostService } from './post.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpdatePostDTO } from './dtos/update-post.dto';
import { OptionJwtAuthGuard } from 'src/common/guards/option-jwt-auth.guard';

@Controller('post')
@ApiBearerAuth('JWT-auth')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('')
  @UseGuards(OptionJwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách bài viết' })
  @ApiQuery({ name: 'limit', required: true, type: Number, default: 20 })
  @ApiQuery({
    name: 'lastPostTime',
    required: false,
    type: Date,
    description: 'Phân trang dựa vào thời gian bài viết cuối',
  })
  getAllPost(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('lastPostTime') lastPostTime: Date,
  ) {
    return this.postService.findAllPagination({
      limit,
      lastPostTime,
    });
  }

  @Post('')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tạo mới bài viết' })
  @ApiBody({
    type: CreatePostDTO,
  })
  createPost(@Body() createDTO: CreatePostDTO, @Req() req) {
    return this.postService.createPost(createDTO, req?.user?.id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Like bài viết' })
  async createLikePost(@Param('id') id: string, @Req() req) {
    await this.postService.likePost(id, req?.user?.id);

    return {
      message: 'Like thành công',
    };
  }

  @Delete(':id/remove-like')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Xoá like bài viết' })
  async removeLikePost(@Param('id') id: string, @Req() req) {
    await this.postService.removeLikePost(id, req?.user?.id);

    return {
      message: 'Xoá like thành công',
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Chỉnh sửa bài viết' })
  @ApiBody({
    type: UpdatePostDTO,
  })
  async updatePostDTO(
    @Body() updateDTO: UpdatePostDTO,
    @Param('id') id: string,
  ) {
    await this.postService.updatePost(updateDTO, id);

    return {
      message: 'Cập nhật bài viết thành công',
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Xoá bài viết' })
  async deletePostDTO(@Param('id') id: string, @Req() req) {
    await this.postService.deletePost(id, req?.user);

    return {
      message: 'Xoá bài viết thành công',
    };
  }
}
