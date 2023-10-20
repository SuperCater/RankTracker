import axios from 'axios'

export type Data = {
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

export type diffData = {
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

export type roles = {
	groupId: number,
	roles: Array<{
		id: number,
		name: string,
		rank: number,
		memberCount: number
	}>
}

const get = async (url: string) => {
	try {
		return await axios.get(url).then(res => res.data)
	} catch (e) {
		console.log(e)
		return null
	}
}

export type RankTrackerType = {
	index: (groupID: string, options?: Object) => Promise<Data | null>;
	diff: (first: Data, second: Data, options?: Object) => Promise<diffData>;
}

export type Options = {
	// Nothing here yet
	ranks?: Array<number>
}

const groupURL = "https://groups.roblox.com/v1/groups/"

const RankTracker: RankTrackerType = {
	index: async (groupID: string, options?: Options) => {
		let group
		try {
			group = await get(groupURL + groupID)
		} catch (e) {
			console.log(e)
			return null
		}
		// Get the group roles
		const roles : roles = await get(groupURL + groupID + "/roles")
		let data : Data = {
			name: group.name,
			id: group.id,
			ranks: [15, 25, 30, 32, 35, 45, 50], // Set this to the ranks to track
			roles: []
		}
		for (const role of roles.roles) {
			if (!data.ranks.includes(role.rank) && data.ranks.length !== 0) continue
			data.roles.push({
				id: role.id,
				name: role.name,
				rank: role.rank,
				members: []
		})
		let next
		const roleInfo = data.roles.find(r => r.id === role.id)
		while (true) {
			let link = groupURL + group.id + "/roles/" + role.id + "/users?limit=100"
			if (next) link += "&cursor=" + next
			const data = await get(link)
			for (const member of data.data) {
				roleInfo?.members.push({
					id: member.userId,
					username: member.username,
				})
			}
			next = data.nextPageCursor
			if (next === null) break;
		}
	}
	return data
	},
	diff : async (first: Data, second : Data, Options: Object = {}) => {
		const diffData : diffData = {
			changes : []
		}

		for (const role1 of first.roles) { // Loop through all roles
			const role2 = second.roles.find(r => r.id === role1.id) // Get the second role
			if (!role2) continue // skip if the role doesn't exist
			// Validate each member
			for (const member of role1.members) { // Got through all members in the first role
				if (!role2.members.find(m => m.id === member.id)) { // Check if the member is in the second role
					// try to find their old rank
					let newRoleInfo
					let newRole = second.roles.find(r => r.members.find(m => m.id === member.id)) // If they are not in the second role, try to find their new role from the new index
					if (newRole === undefined) { // If they are not in the new index, try and fetch it from the api
						const usersRoles = await get(`https://groups.roblox.com/v2/users/${member.id}/groups/roles`)
						const groupInfo = usersRoles.data.find((r: any) => r.group.id === second.id)
						if (!groupInfo) {
							newRoleInfo = {
								name: "Guest",
								rank: 0
							}
						} else { // If they are in the api, set them to their new role
							newRoleInfo = {
								name: groupInfo.role.name,
								rank: groupInfo.role.rank
							}
						}
					} else {
						newRoleInfo = {
							name: newRole.name,
							rank: newRole.rank
						}
						newRole.members.splice(newRole.members.findIndex(m => m.id === member.id), 1)
					}
					diffData.changes.push({
						user: {
							id: member.id,
							username: member.username,
						},
						oldRole: {
							name: role1.name,
							rank: role1.rank,
						},
						newRole: {
							name: newRoleInfo.name,
							rank: newRoleInfo.rank,
						}
					})
					console.log(`${member.username} (${member.id}) was changed to ${newRoleInfo.name} from ${role1.name}`)
				} else {
					role2.members.splice(role2.members.findIndex(m => m.id === member.id), 1)
				}
			}
		}

		for (const role2 of second.roles) {
			for (const member of role2.members) {
				console.log(`${member.username} (${member.id}) was added to ${role2.name}`)
				diffData.changes.push({
					user: {
						id: member.id,
						username: member.username,
					},
					oldRole: {
						name: "Unkown",
						rank: 0,
					},
					newRole: {
						name: role2.name,
						rank: role2.rank,
					}
				})
			}
		}

		return diffData
	}
}


module.exports = RankTracker