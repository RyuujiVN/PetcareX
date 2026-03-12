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
import { CommentService } from './comment.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateCommentDTO } from './dtos/create-comment.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpdateCommentDTO } from './dtos/update-comment.dto';

@Controller('comment')
@ApiBearerAuth('JWT-auth')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bình luận' })
  @ApiQuery({ name: 'limit', required: true, type: Number, default: 10 })
  @ApiQuery({ name: 'createdAt', required: false, type: Date })
  getAllComment(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('createdAt') createdAt: Date,
  ) {
    return this.commentService.findAllPagination({
      limit,
      createdAt,
    });
  }

  @Get('replies')
  @ApiOperation({ summary: 'Lấy danh sách bình luận reply' })
  @ApiQuery({ name: 'limit', required: true, type: Number, default: 10 })
  @ApiQuery({ name: 'parentId', required: true, type: String })
  @ApiQuery({ name: 'createdAt', required: false, type: Date })
  getAllCommentReply(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('parentId') parentId: string,
    @Query('createdAt') createdAt: Date,
  ) {
    return this.commentService.findAllReplyPagination({
      limit,
      parentId,
      createdAt,
    });
  }

  @Post('')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tạo mới bình luận' })
  @ApiBody({
    type: CreateCommentDTO,
  })
  createComment(@Body() createDTO: CreateCommentDTO, @Req() req) {
    return this.commentService.createComment(createDTO, req?.user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Xoá bình luận' })
  async deleteComment(@Param('id') id: string, @Req() req) {
    await this.commentService.deleteComment(id, req?.user);

    return {
      message: 'Xoá bình luận thành công',
    };
  }
}
