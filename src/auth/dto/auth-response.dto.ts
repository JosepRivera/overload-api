export interface AuthResponseDto {
	accessToken: string;
	refreshToken: string;
	user: {
		id: string;
		email: string;
		name: string;
		emailVerified: boolean;
		isActive: boolean;
	};
}
