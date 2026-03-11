import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { CreateCommentDTO } from './dtos/create-comment.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('comment')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post('')
  @ApiOperation({ summary: 'Tạo mới bình luận' })
  @ApiBody({
    type: CreateCommentDTO,
  })
  createComment(@Body() createDTO: CreateCommentDTO, @Req() req) {
    return this.commentService.createComment(createDTO, req?.user);
  }
}
