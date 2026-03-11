import {
  Body,
  Controller,
  DefaultValuePipe,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { CreateCommentDTO } from './dtos/create-comment.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpdateCommentDTO } from './dtos/update-comment.dto';

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

  @Put(':id')
  @ApiOperation({ summary: 'Chỉnh sửa bình luận' })
  @ApiBody({
    type: UpdateCommentDTO,
  })
  async updateComment(
    @Body() updateDTO: UpdateCommentDTO,
    @Param('id') id: string,
    @Req() req,
  ) {
    await this.commentService.updateComment(updateDTO, id, req?.user);

    return {
      message: 'Cập nhật bình luận thành công',
    };
  }
}
