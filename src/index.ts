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
	index: (groupID: string, options?: Object) => any;
	diff: (first: Object, second: Object, options: Object) => any
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
			ranks: [1],
			roles: []
		}
		for (const role of roles.roles) {
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
	diff : async (first: Object, second: Object, options: Object = {}) => {

	}
}

exports.default = RankTracker