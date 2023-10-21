type Data = {
    name: string;
    id: number;
    ranks: Array<number>;
    roles: Array<{
        id: number;
        name: string;
        rank: number;
        members: Array<{
            id: number;
            username: string;
        }>;
    }>;
};
type diffData = {
    changes: Array<{
        user: {
            id: number;
            username: string;
        };
        oldRole: {
            name: string;
            rank: number;
        };
        newRole: {
            name: string;
            rank: number;
        };
    }>;
};
type roles = {
    groupId: number;
    roles: Array<{
        id: number;
        name: string;
        rank: number;
        memberCount: number;
    }>;
};
type RankTrackerType = {
    index: (groupID: string, options?: Object) => Promise<Data | null>;
    diff: (first: Data, second: Data, options?: Object) => Promise<diffData>;
};
type Options = {
    ranks?: Array<number>;
};

export { Data, Options, RankTrackerType, diffData, roles };
