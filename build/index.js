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
            ranks: [1],
            roles: []
        };
        for (const role of roles.roles) {
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
    })
};
exports.default = RankTracker;
//# sourceMappingURL=index.js.map