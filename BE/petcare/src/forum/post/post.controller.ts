import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { CreatePostDTO } from './dtos/create-post.dto';
import { PostService } from './post.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

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
}
