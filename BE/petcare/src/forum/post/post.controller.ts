import {
  Body,
  Controller,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { CreatePostDTO } from './dtos/create-post.dto';
import { PostService } from './post.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpdatePostDTO } from './dtos/update-post.dto';

@Controller('post')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('')
  @ApiOperation({ summary: 'Tạo mới bài viết' })
  @ApiBody({
    type: CreatePostDTO,
  })
  createPost(@Body() createDTO: CreatePostDTO, @Req() req) {
    return this.postService.createPost(createDTO, req?.user?.id);
  }

  @Put(':id')
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
}
