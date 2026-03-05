import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
} from '@nestjs/swagger';
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreatePetDTO } from './dtos/create-pet.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpdatePetDTO } from './dtos/update-pet.dto.';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from 'src/common/pipes/file-validate.pipe';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Controller('pet')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class PetController {
  constructor(
    private readonly petService: PetService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

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

  @Get('species/:speciesId/breed')
  @ApiOperation({ summary: 'Lấy danh sách giống theo loài' })
  getAllBreed(@Param('speciesId') speciesId: string) {
    return this.petService.findAllBreed(speciesId);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Tải ảnh avatar thú cưng' })
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

  @Delete(':id')
  @ApiOperation({ description: 'Xoá thú cưng' })
  async deletePet(@Param('id') id: string) {
    await this.petService.deletePet(id);

    return {
      message: 'Xoá thành công',
    };
  }
}
