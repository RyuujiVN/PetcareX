import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateVeterinarianDTO } from './dtos/create-veterinarian.dto';
import { VeterinarianService } from './veterinarian.service';

@Controller('veterinarian')
// @ApiBearerAuth()
// @UseGuards(JwtAuthGuard)
export class VeterinarianController {
  constructor(private readonly veterinarianService: VeterinarianService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo mới bác sĩ' })
  @ApiBody({
    type: CreateVeterinarianDTO,
  })
  createVeterinarian(@Body() createDTO: CreateVeterinarianDTO) {
    return this.veterinarianService.createVeterinarian(createDTO);
  }
}
