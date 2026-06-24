import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutCategory } from '../../database/schemas/workout-category.entity';
import { WorkoutExercise } from '../../database/schemas/workout-exercise.entity';
import { Workout } from '../../database/schemas/workout.entity';
import { Exercise } from '../../database/schemas/exercise.entity';
import { WorkoutsController } from './workouts.controller';
import { WorkoutsService } from './workouts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workout,
      WorkoutExercise,
      WorkoutCategory,
      Exercise,
    ]),
  ],
  controllers: [WorkoutsController],
  providers: [WorkoutsService],
  exports: [WorkoutsService],
})
export class WorkoutsModule {}
