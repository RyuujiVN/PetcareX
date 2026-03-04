import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateVeterinarianDTO } from './dtos/create-veterinarian.dto';
import { VeterinarianService } from './veterinarian.service';
import { UpdateVeterinarianDTO } from './dtos/update-veterinarian.dto';

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

  @Put(':id')
  @ApiOperation({ summary: 'Chỉnh sửa hồ sơ bác sĩ' })
  @ApiBody({
    type: UpdateVeterinarianDTO,
  })
  async updateVeterinarian(
    @Param('id') id: string,
    @Body() updateDTO: UpdateVeterinarianDTO,
  ) {
    await this.veterinarianService.updateVeterinarian(id, updateDTO);

    return {
      message: 'Cập nhật thành công',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá bác sĩ' })
  async deleteVeterinarian(@Param('id') id: string) {
    await this.veterinarianService.deleteVeterinarian(id);

    return {
      message: 'Xoá bác sĩ thành công',
    };
  }
}
