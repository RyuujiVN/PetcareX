import { PartialType } from '@nestjs/swagger';
import { CreatePostDTO } from './create-post.dto';

export class UpdatePostDTO extends PartialType(CreatePostDTO) {}
