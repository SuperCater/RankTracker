interface Data {
	name: string,
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

export default Data