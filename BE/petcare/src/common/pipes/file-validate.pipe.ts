import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import { extname } from 'path';

// Custome lại file validate
export class FileValidationPipe implements PipeTransform {
  private readonly allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];

  transform(value: any, metadata: ArgumentMetadata) {
    const files: Express.Multer.File[] = Array.isArray(value) ? value : [value];

    if (!files?.length) {
      throw new BadRequestException('Không có file nào được upload');
    }

    const maxSize = 5 * 1024 * 1024; // Chấp nhận dung lượng dưới 5Mb

    for (const file of files) {
      if (!file) {
        throw new BadRequestException('Không có file nào được upload');
      }

      const fileName = extname(file.originalname);

      if (!this.allowedExtensions.includes(fileName)) {
        throw new BadRequestException(
          'Định danh file không hợp lệ (Chỉ chấp nhận .jpg, .jpeg, .png)',
        );
      }

      if (file.size > maxSize) {
        throw new BadRequestException(
          'File vượt quá dung lượng tối đa cho phép (tối đa 5MB)',
        );
      }
    }

    return value;
  }
}
