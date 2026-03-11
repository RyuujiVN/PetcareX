import { PartialType } from '@nestjs/swagger';
import { CreateTopicDTO } from './create-topic.dto';

export class UpdateTopicDTO extends PartialType(CreateTopicDTO) {}
