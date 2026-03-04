import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { PetService } from './pet.service';
import {
  Body,
  Controller,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreatePetDTO } from './dtos/create-pet.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpdatePetDTO } from './dtos/update-pet.dto.';

@Controller('pet')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Post()
  @ApiOperation({ description: 'Tạo mới thú cưng' })
  @ApiBody({
    type: CreatePetDTO,
  })
  createPet(@Body() createDTO: CreatePetDTO, @Req() req) {
    return this.petService.createPet(createDTO, req?.user?.id);
  }

  @Put(':id')
  @ApiOperation({ description: 'Chỉnh sửa thông tin thú cưng' })
  @ApiBody({
    type: UpdatePetDTO,
  })
  async updatePet(@Body() updateDTO: UpdatePetDTO, @Param('id') id: string) {
    await this.petService.updatePet(updateDTO, id);

    return {
      message: 'Cập nhật thành công',
    };
  }
}
