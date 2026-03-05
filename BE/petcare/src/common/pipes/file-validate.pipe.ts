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
    if (!value) throw new BadRequestException('Không có file nào được upload');
    const fileName = extname(value.originalname);

    if (!this.allowedExtensions.includes(fileName))
      throw new BadRequestException(
        'Định danh file không hợp lệ (Chỉ chấp nhận .jpg, .jpeg, .png)',
      );

    const maxSize = 5 * 1024 * 1024; // Chấp nhận dung lượng dưới 5Mb
    if (value.size > maxSize)
      throw new BadRequestException(
        'File vượt quá dung lượng tối đa cho phép (tối đa 5MB)',
      );

    return value;
  }
}
