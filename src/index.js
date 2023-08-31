import axios from 'axios'

const get = async (url) => {
	try {
		return await axios.get(url).then(res => res.data)
	} catch (e) {
		console.log(e)
		return null
	}
}

const RankTracker = {}


const groupURL = "https://groups.roblox.com/v1/groups/"



RankTracker.index = async (groupID, options) => {
	let data;
	for (const group of options.groups) {
		if (groupID && group.id !== groupID) continue
		try {
			await axios.get(groupURL + group.id)
		} catch (e) {
			continue
		}

		data = {
			groupId: group.id,
			groupName: group.name,
			ranksToIndex: group.ranks,
			roles: [],
		}

		const roles = await axios.get(groupURL + group.id + "/roles").then(res => res.data.roles)

		for (const role of roles) {
			if (!group.ranks.includes(role.rank)) continue
			const members = []
			let next;
			const start = Date.now()
			while (true) {
				let link = groupURL + group.id + "/roles/" + role.id + "/users?limit=100"
				if (next) link += "&cursor=" + next
				const data = await get(link)
				// const data = await axios.get(link).then(res => res.data)
				for (const member of data.data) {
					members.push({
						username: member.username,
						userId: member.userId,
					})
				}
				next = data.nextPageCursor
				if (next === null) break;
			}
			data.roles.push({
				name: role.name,
				rank: role.rank,
				members,
			})
		}
	}
	return data
}


RankTracker.diff = async (first, second, options) => {
	//TODO: Rewrite all of this
}


export default RankTracker
module.exports = RankTracker