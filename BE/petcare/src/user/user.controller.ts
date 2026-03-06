import { UserService } from './user.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from 'src/common/pipes/file-validate.pipe';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { UpdateUserDTO } from './dtos/update-user.dto';

@Controller('user')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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

  @Post('upload')
  @ApiOperation({ summary: 'Tải ảnh avatar người dùng' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(new FileValidationPipe())
    file: Express.Multer.File,
  ) {
    const fileUrl = await this.cloudinaryService.uploadFile(file);

    return {
      file: fileUrl.secure_url,
    };
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
