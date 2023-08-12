import axios from 'axios'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import config from './../config.json' assert { type: "json" }

const type = process.argv[2] || "index"

const log = (level, message) => {
	switch (level) {
		case "info": {
			console.log(chalk.blueBright(message))
			break;
		}
		case "warn": {
			console.log(chalk.yellowBright(message))
			break;
		}
		case "error": {
			console.log(chalk.redBright(message))
			break;
		}
		case "success": {
			console.log(chalk.greenBright(message))
			break;
		}
	}
}

const get = async (url) => {
	try {
		return await axios.get(url).then(res => res.data)
	} catch (e) {
		return null
	}
}



// Verify data folder exists
log("info", "Verifying data folder exists...")
if (!fs.existsSync("./data")) {
	log("warn", "Data folder does not exist! Creating...")
	fs.mkdirSync("./data")
	log("success", "Data folder created!")
} else {
	log("success", "Data folder exists!")
}

log("info", "Verifying indexes folder exists...")
if (!fs.existsSync("./data/indexes")) {
	log("warn", "Indexes folder does not exist! Creating...")
	fs.mkdirSync("./data/indexes")
	log("success", "Indexes folder created!")
} else {
	log("success", "Indexes folder exists!")
}

log("info", "Verifying diffs folder exists...")
if (!fs.existsSync("./data/diffs")) {
	log("warn", "Diffs folder does not exist! Creating...")
	fs.mkdirSync("./data/diffs")
	log("success", "Diffs folder created!")
} else {
	log("success", "Diffs folder exists!")
}



const groupURL = "https://groups.roblox.com/v1/groups/"



const index = async (groupID) => {
	for (const group of config.groups) {
		if (groupID && group.id !== groupID) continue
		log("info", `Indexing group ${group.name}...`)
		log("info", `Verifying group ${group.name} exists...`)
		try {
			await axios.get(groupURL + group.id)
			log("success", `Group ${group.name} exists!`)
		} catch (e) {
			log("error", `Failed to get group data for group ${group.name}!`)
			continue
		}

		log("info", `Creating file name for group ${group.name}...`)
		const name = `${group.name}-Index.json`
		const data = {
			groupId: group.id,
			groupName: group.name,
			ranksToIndex: group.ranks,
			roles: [],
		}
		/* fs.writeFileSync(`./data/indexes/${name}`, JSON.stringify({
			data,
		})) */
		
		log("success", `Created file name for group ${group.name}!`)



		log("info", `Getting group roles for group ${group.name}...`)
		const roles = await axios.get(groupURL + group.id + "/roles").then(res => res.data.roles)
		log("success", `Got group roles for group ${group.name}!`)

		for (const role of roles) {
			if (!group.ranks.includes(role.rank)) continue
			log("info", `Getting group members for role ${role.name}. This may take a minute...`)
			const members = []
			let next;
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
			log("success", `Got group members for role ${role.name}!`)
			log("info", `Adding group members for role ${role.name} to data...`)
			data.roles.push({
				name: role.name,
				rank: role.rank,
				members,
			})
			log("success", `Added rank members to data for role ${role.name}!`)
		}
		fs.writeFileSync(`./data/indexes/${name}`, JSON.stringify(data))
		log("success", `Wrote group members to file for group ${group.name}!`)
	}
	log("success", "Finished indexing groups!")
}


const diff = async () => {
	log("warn", "Diffing is in texting and not yet done!")
	for (const group of config.groups) {
		let ogIndex;
		log("info", `Diffing group ${group.name}...`)
		const indexes = fs.readdirSync("./data/indexes").filter(file => file === `${group.name}-Index.json`)
		if (indexes.length === 0) {
			log("warn", `No index found for group ${group.name}!`)
			index(group.id)
			continue
		}
		if (indexes.length > 1) {
			log("warn", `Multiple indexes found for group ${group.name}! Using the first one...`)
		}
		ogIndex = JSON.parse(fs.readFileSync(`./data/indexes/${indexes[0]}`))
		log("info", `Got index for group ${group.name}!`)
		log("info", `Getting new index for group ${group.name}...`)
		await index(group.id)
		const newIndex = JSON.parse(fs.readFileSync(`./data/indexes/${indexes[0]}`))
		const diffName = `${group.name}-Diff-${new Date().toISOString().split("T")[0]}.txt`
		fs.writeFileSync(`./data/diffs/${diffName}`, "Diffing group " + group.name + "...\n")

		log("info", `Diffing group ${group.name}...`)
		for (const role of ogIndex.roles) {
			const newRole = newIndex.roles.find(r => r.name === role.name)
			for (const member of role.members) {
				const newMember = newRole.members.find(m => m.userId === member.userId)


				if (!newMember) {
					log("info", `Member ${member.username} is no longer in role ${role.name}!`)
					// Find their new role
					const newRole = newIndex.roles.find(r => r.members.find(m => m.userId === member.userId))
					if (!newRole) {
						log("info", `Member ${member.username} is no longer in the group!`)
						fs.appendFileSync(`./data/diffs/${diffName}`, `Member ${member.username}(${member.userId}) is no longer in the group!\n`)
						continue
					}
					log("info", `Member ${member.username} is now in role ${newRole.name}!`)
					fs.appendFileSync(`./data/diffs/${diffName}`, `${role.name}: ${member.username}(${member.userId}) => ${newRole.name}\n`)
				}
			}
		}
	}
}



if (type === "index") {
	log("info", "Starting indexing...")
	index()
} else if (type === "diff") {
	log("info", "Starting diffing...")
	diff()
}