import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { PetService } from './pet.service';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CreatePetDTO } from './dtos/create-pet.dto';
import { Pet } from './entities/pet.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

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
}
