import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateQuizInput } from './dto/create-quiz.input';
import { UpdateQuizInput } from './dto/update-quiz.input';
import { QuizzesService } from './quizzes.service';

@ApiTags('quizzes')
@Controller('v1/quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @ApiOperation({ summary: 'Create quiz' })
  create(@Body() createQuizInput: CreateQuizInput) {
    return this.quizzesService.create(createQuizInput);
  }

  @Get()
  @ApiOperation({ summary: 'List quizzes for organization' })
  findAll(@Query('organizationId') organizationId: string) {
    return this.quizzesService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quiz by id' })
  findOne(@Param('id') id: string) {
    return this.quizzesService.findOne(id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update quiz' })
  update(@Body() updateQuizInput: UpdateQuizInput) {
    return this.quizzesService.update(updateQuizInput.id, updateQuizInput);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete quiz' })
  remove(@Param('id') id: string) {
    return this.quizzesService.remove(id);
  }
}
