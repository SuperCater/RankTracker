interface roles {
	groupId: number,
	roles: Array<{
		id: number,
		name: string,
		rank: number,
		memberCount: number
	}>
}

export default roles