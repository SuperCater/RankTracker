"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/index.ts
var src_exports = {};
module.exports = __toCommonJS(src_exports);
var import_axios = __toESM(require("axios"));
var get = (url) => __async(void 0, null, function* () {
  try {
    return yield import_axios.default.get(url).then((res) => res.data);
  } catch (e) {
    console.log(e);
    return null;
  }
});
var groupURL = "https://groups.roblox.com/v1/groups/";
var RankTracker = {
  index: (groupID, options) => __async(void 0, null, function* () {
    let group;
    try {
      group = yield get(groupURL + groupID);
    } catch (e) {
      console.log(e);
      return null;
    }
    const roles = yield get(groupURL + groupID + "/roles");
    let data = {
      name: group.name,
      id: group.id,
      ranks: [15, 25, 30, 32, 35, 45, 50],
      // Set this to the ranks to track
      roles: []
    };
    for (const role of roles.roles) {
      if (!data.ranks.includes(role.rank) && data.ranks.length !== 0)
        continue;
      data.roles.push({
        id: role.id,
        name: role.name,
        rank: role.rank,
        members: []
      });
      let next;
      const roleInfo = data.roles.find((r) => r.id === role.id);
      while (true) {
        let link = groupURL + group.id + "/roles/" + role.id + "/users?limit=100";
        if (next)
          link += "&cursor=" + next;
        const data2 = yield get(link);
        for (const member of data2.data) {
          roleInfo == null ? void 0 : roleInfo.members.push({
            id: member.userId,
            username: member.username
          });
        }
        next = data2.nextPageCursor;
        if (next === null)
          break;
      }
    }
    return data;
  }),
  diff: (_0, _1, ..._2) => __async(void 0, [_0, _1, ..._2], function* (first, second, Options = {}) {
    const diffData = {
      changes: []
    };
    for (const role1 of first.roles) {
      const role2 = second.roles.find((r) => r.id === role1.id);
      if (!role2)
        continue;
      for (const member of role1.members) {
        if (!role2.members.find((m) => m.id === member.id)) {
          let newRoleInfo;
          let newRole = second.roles.find((r) => r.members.find((m) => m.id === member.id));
          if (newRole === void 0) {
            const usersRoles = yield get(`https://groups.roblox.com/v2/users/${member.id}/groups/roles`);
            const groupInfo = usersRoles.data.find((r) => r.group.id === second.id);
            if (!groupInfo) {
              newRoleInfo = {
                name: "Guest",
                rank: 0
              };
            } else {
              newRoleInfo = {
                name: groupInfo.role.name,
                rank: groupInfo.role.rank
              };
            }
          } else {
            newRoleInfo = {
              name: newRole.name,
              rank: newRole.rank
            };
            newRole.members.splice(newRole.members.findIndex((m) => m.id === member.id), 1);
          }
          diffData.changes.push({
            user: {
              id: member.id,
              username: member.username
            },
            oldRole: {
              name: role1.name,
              rank: role1.rank
            },
            newRole: {
              name: newRoleInfo.name,
              rank: newRoleInfo.rank
            }
          });
          console.log(`${member.username} (${member.id}) was changed to ${newRoleInfo.name} from ${role1.name}`);
        } else {
          role2.members.splice(role2.members.findIndex((m) => m.id === member.id), 1);
        }
      }
    }
    for (const role2 of second.roles) {
      for (const member of role2.members) {
        console.log(`${member.username} (${member.id}) was added to ${role2.name}`);
        diffData.changes.push({
          user: {
            id: member.id,
            username: member.username
          },
          oldRole: {
            name: "Unkown",
            rank: 0
          },
          newRole: {
            name: role2.name,
            rank: role2.rank
          }
        });
      }
    }
    return diffData;
  })
};
module.exports = RankTracker;
//# sourceMappingURL=index.js.map