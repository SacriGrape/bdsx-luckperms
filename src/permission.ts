import { existsSync } from "fs";
import { join } from "path";
import { fsutil } from "bdsx/fsutil";
import { Player } from "bdsx/bds/player";
import { getXuid } from "./functions";
import { config, luckPermStorage } from "./storage";

export function registerPermission(name: string) {
    return new PermissionBuilder(name)
}

class PermissionBuilder {
    private chosenName: string;
    private chosenDefault: boolean;
    private chosenDescription: string;
    private chosenChildren: {name: string, value: boolean}[];

    constructor(name: string) {
        this.chosenName = name;
        this.chosenDefault = false;
        this.chosenDescription = '';
        this.chosenChildren = [];


        return this;
    }

    default(value: boolean) {
        this.chosenDefault = value;
        return this;
    }

    description(desc: string) {
        this.chosenDescription = desc;
        return this;
    }

    child(name: string, value: boolean) {
        this.chosenChildren.push({name, value: value});
        return this;
    }

    register() {
        updatePermissionStorage(this.chosenName, { default: this.chosenDefault, description: this.chosenDescription, children: this.chosenChildren });
        return this;
    }
}

function updatePermissionStorage(id: string, data: { default: boolean, description: string, children: {name: string, value: boolean}[] }) {
    luckPermStorage.permissions[id] = data;
    fsutil.writeJsonSync(config.permissionStorageName, luckPermStorage);
}

function updateUserStorage(xuid: string, node: string, value: boolean) {
    if (!luckPermStorage.holders.users[xuid]) {
        luckPermStorage.holders.users[xuid] = {};
    }
    luckPermStorage.holders.users[xuid][node] = value;
    fsutil.writeJsonSync(config.permissionStorageName, luckPermStorage);
}

export function updateUserNode(player: Player, node: string, value: boolean) {
    let xuid = getXuid(player);
    updateUserStorage(xuid, node, value);
}
