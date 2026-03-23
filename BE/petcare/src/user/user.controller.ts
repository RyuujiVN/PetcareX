import { UserService } from './user.service';
import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { UpdateUserDTO } from './dtos/update-user.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { User } from './entities/user.entity';

@Controller('user')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Phân trang người dùng' })
  @ApiQuery({ name: 'page', required: true, type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: true, type: Number, default: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Tìm kiếm theo tên hoặc email',
  })
  findAllPagination(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ): Promise<Pagination<User>> {
    return this.userService.findAllUserPagination({
      page,
      limit,
      search,
    });
  }

  @Get('profile')
  @ApiOperation({ summary: 'Lấy thông tin tài khoản đang đăng nhập' })
  getMyAcountInfo(@Req() req) {
    return this.userService.findOneByid(req?.user?.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin tài khoản người dùng' })
  getUser(@Param('id') id: string) {
    return this.userService.findOneByid(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin tài khoản' })
  @ApiBody({
    type: UpdateUserDTO,
  })
  async updateUser(@Param('id') id: string, @Body() updateDTO: UpdateUserDTO) {
    await this.userService.updateUser(id, updateDTO);

    return {
      message: 'Cập nhật thông tin thành công',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá tài khoản' })
  async deleteUser(@Param('id') id: string) {
    await this.userService.softDeleteUser(id);

    return {
      message: 'Xoá thành công',
    };
  }
}
