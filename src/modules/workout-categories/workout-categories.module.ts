import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutCategory } from '../../database/schemas/workout-category.entity';
import { WorkoutCategoriesController } from './workout-categories.controller';
import { WorkoutCategoriesService } from './workout-categories.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkoutCategory])],
  controllers: [WorkoutCategoriesController],
  providers: [WorkoutCategoriesService],
  exports: [WorkoutCategoriesService],
})
export class WorkoutCategoriesModule {}
