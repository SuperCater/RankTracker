interface diffData {
	changes: Array<{
		user: {
			id: number,
			username: string,
		},
		oldRole: {
			name: string,
			rank: number,
		},
		newRole: {
			name: string,
			rank: number,
		}
	}>
}