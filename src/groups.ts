import { Player } from "../../bdsx/bds/player";
import { getXuid } from "./functions";

const groups = new Map<string, Group>();

class GroupBuilder {
    protected name: string;
    protected desc: string;
    protected permissions: {permission: string, value: boolean}[];
    protected wight: number;
    protected prnt: string[];

    constructor(name: string) {
        this.name = name;
        this.desc = "";
        this.permissions = [];
        this.wight = 0;
        return this;
    }


    description(desc: string): GroupBuilder {
        this.desc = desc;
        return this;
    }

    permission(permission: string, value: boolean): GroupBuilder {
        this.permissions.push({permission: permission, value: value});
        return this;
    }

    weight(weight: number): GroupBuilder {
        this.wight = weight;
        return this;
    }

    parent(parent: string[]): GroupBuilder {
        this.prnt = parent;
        return this;
    }

    buildAndRegister() {
        let group = new Group(this.name, this.desc, this.permissions, this.wight, this.prnt);
        groups.set(this.name, group);
        return group;
    }

}

class Group {
    name: string;
    desc: string;
    permissions: {permission: string, value: boolean}[];
    weight: number;
    parent: string[]

    constructor(name: string, desc: string, permissions: {permission: string, value: boolean}[], wight: number, parent: string[]) {
        this.name = name;
        this.desc = desc;
        this.permissions = permissions;
        this.weight = wight;
        this.parent = [];
    }
}

export function registerGroup(name: string) {
    return new GroupBuilder(name);
}

export function giveGroup(name: string, player: Player) {
    let xuid = getXuid(player);
    let group = groups.get(name);
    if (!group) {
        throw new Error(`Group does not exist: ${name}`);
    }
};

