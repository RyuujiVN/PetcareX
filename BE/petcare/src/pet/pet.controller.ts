import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { PetService } from './pet.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreatePetDTO } from './dtos/create-pet.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpdatePetDTO } from './dtos/update-pet.dto.';
import { PetSpeciesEnum } from 'src/common/enums/pet-species.enum';

@Controller('pet')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thú cưng của riêng mình' })
  getMyPets(@Req() req) {
    return this.petService.findPetsByOwnerId(req?.user?.id);
  }

  @Get('species')
  @ApiOperation({ summary: 'Lấy danh sách loài' })
  getAllSpecies() {
    return this.petService.findAllSpecies();
  }

  @Get('species/:species/breed')
  @ApiOperation({ summary: 'Lấy danh sách giống theo loài' })
  getAllBreed(@Param('species') species: PetSpeciesEnum) {
    return this.petService.findAllBreed(species);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mới thú cưng' })
  @ApiBody({
    type: CreatePetDTO,
  })
  createPet(@Body() createDTO: CreatePetDTO, @Req() req) {
    return this.petService.createPet(createDTO, req?.user?.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Chỉnh sửa thông tin thú cưng' })
  @ApiBody({
    type: UpdatePetDTO,
  })
  async updatePet(@Body() updateDTO: UpdatePetDTO, @Param('id') id: string) {
    await this.petService.updatePet(updateDTO, id);

    return {
      message: 'Cập nhật thành công',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá thú cưng' })
  async deletePet(@Param('id') id: string) {
    await this.petService.deletePet(id);

    return {
      message: 'Xoá thành công',
    };
  }
}
