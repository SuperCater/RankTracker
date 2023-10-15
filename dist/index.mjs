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
import axios from "axios";
var get = (url) => __async(void 0, null, function* () {
  try {
    return yield axios.get(url).then((res) => res.data);
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
      if (!data.ranks.includes(role.rank))
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
  diff: (_0, _1, ..._2) => __async(void 0, [_0, _1, ..._2], function* (first, second, options = {}) {
    const diffData = {
      changes: []
    };
    for (const role1 of first.roles) {
      const role2 = second.roles.find((r) => r.id === role1.id);
      if (!role2)
        continue;
      for (const member of role1.members) {
        if (!role2.members.find((m) => m.id === member.id)) {
          let newRole = second.roles.find((r) => r.members.find((m) => m.id === member.id));
          if (newRole === void 0) {
            const usersRoles = yield get(`https://groups.roblox.com/v2/users/${member.id}/groups/roles`);
            const groupInfo = usersRoles.data.find((r) => r.group.id === second.id);
            if (!groupInfo) {
              newRole = {
                name: "Guest",
                rank: 0
              };
            } else {
              newRole = {
                name: groupInfo.role.name,
                rank: groupInfo.role.rank
              };
            }
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
              name: newRole.name,
              rank: newRole.rank
            }
          });
          console.log(`${member.username} (${member.id}) was changed to ${newRole.name} from ${role1.name}`);
        }
      }
    }
    return diffData;
  })
};
module.exports = RankTracker;
//# sourceMappingURL=index.mjs.map