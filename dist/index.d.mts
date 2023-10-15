interface Data {
	name: string,
	id: number,
	ranks: Array<number>,
	roles: Array<{
		id: number,
		name: string,
		rank: number,
		members: Array<{
			id: number,
			username: string,
		}>
	}>
}

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

type RankTrackerType = {
    index: (groupID: string, options?: Object) => Promise<Data | null>;
    diff: (first: Data, second: Data, options?: Object) => Promise<diffData>;
};

export { RankTrackerType };
