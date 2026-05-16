import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateSubjectInput } from './dto/create-subject.input';
import { UpdateSubjectInput } from './dto/update-subject.input';
import { SubjectsService } from './subjects.service';

@ApiTags('subjects')
@Controller('v1/subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create subject' })
  create(@Body() createSubjectInput: CreateSubjectInput) {
    return this.subjectsService.create(createSubjectInput);
  }

  @Get()
  @ApiOperation({ summary: 'List subjects' })
  findAll() {
    return this.subjectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subject by id' })
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update subject' })
  update(@Body() updateSubjectInput: UpdateSubjectInput) {
    return this.subjectsService.update(updateSubjectInput.id, updateSubjectInput);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete subject' })
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(id);
  }
}
