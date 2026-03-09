export interface AuthResponseDto {
	accessToken: string;
	refreshToken: string;
	user: {
		id: string;
		email: string;
		name: string;
		email_verified: boolean;
		is_active: boolean;
	};
}
