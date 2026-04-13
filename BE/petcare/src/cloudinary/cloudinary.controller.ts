import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileValidationPipe } from 'src/common/pipes/file-validate.pipe';
import { CloudinaryService } from './cloudinary.service';

@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload/one-file')
  @ApiOperation({ summary: 'Tải một ảnh' })
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

  @Post('upload/file-resize')
  @ApiOperation({ summary: 'Nén ảnh' })
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
  async uploadImageResize(
    @UploadedFile(new FileValidationPipe())
    file: Express.Multer.File,
  ) {
    const fileUrl = await this.cloudinaryService.uploadFileConvertWebp(file);

    return {
      file: fileUrl.secure_url,
    };
  }

  @Post('upload/multi-file')
  @ApiOperation({ summary: 'Tải nhiều ảnh' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['files'],
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiFiles(
    @UploadedFiles(new FileValidationPipe())
    files: Express.Multer.File[],
  ) {
    const fileUrls = await this.cloudinaryService.uploadFiles(files);

    return fileUrls.map((res) => ({
      file: res.secure_url,
    }));
  }
}
