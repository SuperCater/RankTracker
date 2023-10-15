import axios from 'axios'
import roles from './types/roles'
import Data from './types/data'
import fs from 'fs'

const get = async (url: string) => {
	try {
		return await axios.get(url).then(res => res.data)
	} catch (e) {
		console.log(e)
		return null
	}
}

type RankTrackerType = {
	index: (groupID: string, options?: Object) => Promise<Data | null>;
	diff: (first: Data, second: Data, options?: Object) => Promise<diffData>;
}

const groupURL = "https://groups.roblox.com/v1/groups/"

const RankTracker: RankTrackerType = {
	index: async (groupID: string, options?: Object) => {
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
			if (!data.ranks.includes(role.rank)) continue
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
	diff : async (first: Data, second: Data, options: Object = {}) => {
		const diffData : diffData = {
			changes : []
		}
		for (const role1 of first.roles)	{
			const role2 = second.roles.find(r => r.id === role1.id)
			if (!role2) continue
			// Validate each member
			for (const member of role1.members) {
				if (!role2.members.find(m => m.id === member.id)) {
					// try to find their old rank
					let newRole : any = second.roles.find(r => r.members.find(m => m.id === member.id))
					if (newRole === undefined) {
						const usersRoles = await get(`https://groups.roblox.com/v2/users/${member.id}/groups/roles`)
						const groupInfo = usersRoles.data.find((r: any) => r.group.id === second.id)
						if (!groupInfo) {
							newRole = {
								name: "Guest",
								rank: 0
							}
						} else {
							newRole = {
								name: groupInfo.role.name,
								rank: groupInfo.role.rank
							}
						}
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
							name: newRole.name,
							rank: newRole.rank,
						}
					})
					console.log(`${member.username} (${member.id}) was changed to ${newRole.name} from ${role1.name}`)
				}
			}
		}
		return diffData
	}
}

async function main() {
	// Print the current directory
	let old = require("./../data/indexes/data.json")
	if (!old) {
		console.log("No data.json file found. Creating one now.")
		const data = await RankTracker.index("645836")
		fs.writeFileSync("./data/indexes/data.json", JSON.stringify(data))
		old = data
	}
	const second = await RankTracker.index("645836") as Data
	fs.writeFileSync("./data/indexes/data.json", JSON.stringify(second, null, 2))
	const diff = await RankTracker.diff(old, second)
	const date = new Date().toLocaleDateString().replace(/\//g, "-") + " " + new Date().toLocaleTimeString().replace(/:/g, "-")
	let name = date + ".json"
	if (!fs.existsSync("./data/diffs")) fs.mkdirSync("./data/diffs")

	fs.writeFileSync("./data/diffs/" + name, JSON.stringify(diff, null, 2))
}

main()