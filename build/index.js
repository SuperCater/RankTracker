"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const get = (url) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield axios_1.default.get(url).then(res => res.data);
    }
    catch (e) {
        console.log(e);
        return null;
    }
});
const groupURL = "https://groups.roblox.com/v1/groups/";
const RankTracker = {
    index: (groupID, options) => __awaiter(void 0, void 0, void 0, function* () {
        let group;
        try {
            group = yield get(groupURL + groupID);
        }
        catch (e) {
            console.log(e);
            return null;
        }
        // Get the group roles
        const roles = yield get(groupURL + groupID + "/roles");
        let data = {
            name: group.name,
            id: group.id,
            ranks: [15, 25, 30, 32, 35, 45, 50],
            roles: []
        };
        for (const role of roles.roles) {
            if (!data.ranks.includes(role.rank))
                continue;
            data.roles.push({
                id: role.id,
                name: role.name,
                rank: role.rank,
                members: []
            });
            let next;
            const roleInfo = data.roles.find(r => r.id === role.id);
            while (true) {
                let link = groupURL + group.id + "/roles/" + role.id + "/users?limit=100";
                if (next)
                    link += "&cursor=" + next;
                const data = yield get(link);
                for (const member of data.data) {
                    roleInfo === null || roleInfo === void 0 ? void 0 : roleInfo.members.push({
                        id: member.userId,
                        username: member.username,
                    });
                }
                next = data.nextPageCursor;
                if (next === null)
                    break;
            }
        }
        return data;
    }),
    diff: (first, second, options = {}) => __awaiter(void 0, void 0, void 0, function* () {
        const diffData = {
            changes: []
        };
        for (const role1 of first.roles) {
            const role2 = second.roles.find(r => r.id === role1.id);
            if (!role2)
                continue;
            // Validate each member
            for (const member of role1.members) {
                if (!role2.members.find(m => m.id === member.id)) {
                    // try to find their old rank
                    let newRole = second.roles.find(r => r.members.find(m => m.id === member.id));
                    if (newRole === undefined) {
                        const usersRoles = yield get(`https://groups.roblox.com/v2/users/${member.id}/groups/roles`);
                        const groupInfo = usersRoles.data.find((r) => r.group.id === second.id);
                        if (!groupInfo) {
                            newRole = {
                                name: "Guest",
                                rank: 0
                            };
                        }
                        else {
                            newRole = {
                                name: groupInfo.role.name,
                                rank: groupInfo.role.rank
                            };
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
                    });
                    console.log(`${member.username} (${member.id}) was changed to ${newRole.name} from ${role1.name}`);
                }
            }
        }
        return diffData;
    })
};
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Print the current directory
        let old = require("./../data/indexes/data.json");
        if (!old) {
            console.log("No data.json file found. Creating one now.");
            const data = yield RankTracker.index("645836");
            fs_1.default.writeFileSync("./data/indexes/data.json", JSON.stringify(data));
            old = data;
        }
        const second = yield RankTracker.index("645836");
        fs_1.default.writeFileSync("./data/indexes/data.json", JSON.stringify(second, null, 2));
        const diff = yield RankTracker.diff(old, second);
        const date = new Date().toLocaleDateString().replace(/\//g, "-") + " " + new Date().toLocaleTimeString().replace(/:/g, "-");
        let name = date + ".json";
        if (!fs_1.default.existsSync("./data/diffs"))
            fs_1.default.mkdirSync("./data/diffs");
        fs_1.default.writeFileSync("./data/diffs/" + name, JSON.stringify(diff, null, 2));
    });
}
main();
//# sourceMappingURL=index.js.map