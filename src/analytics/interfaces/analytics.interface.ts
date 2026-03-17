export interface ExercisePrs {
	weight_pr: number | null;
	volume_pr: number | null;
}

export interface SessionProgression {
	workout_id: string;
	date: Date;
	total_volume: number;
	avg_weight: number;
	avg_reps: number;
}

export interface WorkoutVolume {
	workout_id: string;
	total_volume: number;
}

export interface Exercise1RM {
	exercise_id: string;
	estimated_1rm: number | null;
	based_on: { weight: number; reps: number } | null;
}
