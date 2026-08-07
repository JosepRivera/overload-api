export interface ExercisePrs {
	weightPr: number | null;
	volumePr: number | null;
}

export interface SessionProgression {
	workoutId: string;
	date: Date;
	totalVolume: number;
	avgWeight: number;
	avgReps: number;
}

export interface WorkoutVolume {
	workoutId: string;
	totalVolume: number;
}

export interface Exercise1RM {
	exerciseId: string;
	estimated1rm: number | null;
	basedOn: { weight: number; reps: number } | null;
}
