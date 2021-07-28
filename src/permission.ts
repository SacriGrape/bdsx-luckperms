import { Player } from "bdsx/bds/player";
import { appendFileSync, existsSync, writeFileSync } from "fs";
import { serverInstance } from "bdsx/bds/server";
import { getXuid } from "./functions";
import { groups } from "./groups";

export let permissionStorage: any = {permission: {}};

export let permissions = new Map<string, Permission>();

export function registerPermission(name: string): PermissionBuilder {
    return new PermissionBuilder(name);
}

class PermissionBuilder {
    protected name: string;
    protected desc: string;
    protected defaultValue: boolean;
    protected children: Map<string, boolean> = new Map();

    constructor(name: string) {
        this.name = name;
        this.desc = "";
        this.defaultValue = false;
    }

    description(description: string): PermissionBuilder {
        this.desc = description;
        return this;
    }

    default(defaultValue: boolean): PermissionBuilder {
        this.defaultValue = defaultValue;
        return this;
    }

    child(child: string, value: boolean): PermissionBuilder {
        this.children.set(child, value);
        return this;
    }

    buildAndRegister(): Permission {
        let permission = new Permission(this.name, this.desc, this.defaultValue, this.children);
        permissions.set(permission.name, permission);
        return permission;
    }
}

class Permission {
    name: string;
    description: string;
    defaultValue: boolean;
    children:Map<string, boolean>;

    constructor(name: string, desc: string, defaultValue: boolean, children: Map<string, boolean>) {
        this.name = name;
        this.description = desc;
        this.defaultValue = defaultValue;
        this.children = children;
    }
}

export function givePermission(permissionName: string, player: Player) {
    updatePermissionByPlayer(player, permissionName, true);
}

export function getPermissionDefault(permissionName: string): boolean {
    let permission = permissions.get(permissionName);
    if (permission) {
        return permission.defaultValue;
    }
    return false;
}

export function addPlayerToStorage(xuid: string) {
    if (permissionStorage[xuid] === undefined) {
        permissionStorage[xuid] = {};
    }
    if (permissionStorage[xuid].permissions === undefined) {
        permissionStorage[xuid].permissions = {};
    }
    if (permissionStorage[xuid].groups === undefined) {
        permissionStorage[xuid].groups = {};
    }
}

export function getPermission(permissionName: string, player: Player): boolean  {
    let xuid = getXuid(player);
    addPlayerToStorage(xuid);

    let topLevel = permissionStorage[xuid].permissions[permissionName];
    if (topLevel !== undefined) {
        return topLevel;
    }

    for (let topLevelPermissionName of Object.keys(permissionStorage[xuid].permissions)) {
        let checkedPermissions: string[] = [];
        let value = checkChildPermissions(topLevelPermissionName, permissionName, checkedPermissions, player);
        if (value !== undefined) {
            return value;
        }
    }
    for(let groupName of Object.keys(permissionStorage[xuid].groups)) {
        let group = groups.get(groupName);
        if (!group) continue;
        for (let permission of group.permissions) {
            console.log(permission.permission)
            if (permission.permission === permissionName) {
                return permission.value;
            }
        }
        for (let permission of group.permissions) {
            let checkedPermission: string[] = []
            if (permission.value) {
                let value = checkChildPermissions(permission.permission, permissionName, checkedPermission, player);
                if (value !== undefined) {
                    return value;
                }
            }
        }
    }
    return getPermissionDefault(permissionName);
}

function checkChildPermissions(permissionName: string, searchFor: string, checkedPermissions: string[], player: Player): boolean | undefined {
    if (checkedPermissions.includes(permissionName)) {
        throw new Error("Circular permission dependency detected: " + permissionName);
    }
    if (permissionName.endsWith(".*")) {
        let value = checkWildcardPermission(permissionName, searchFor);
        if (value !== undefined) {
            return value;
        }
    }
    let permission = permissions.get(permissionName);
    if (!permission) {
        return undefined;
    }

    let child = permission.children.get(searchFor);
    if (child !== undefined) {
        return child;
    }
    for (let child of permission.children) {
        checkedPermissions.push(permissionName);
        if (child[1] === false) {
            continue;
        }
        try {
            let perm = checkChildPermissions(child[0], searchFor, checkedPermissions, player);
            if (perm === undefined) {
                continue;
            }
        } catch (e) {
            console.log(e);
            continue;
        }
    }
}

function checkWildcardPermission(permissionName: string, searchFor: string) {
    let trimmedPermission = permissionName.slice(0, permissionName.indexOf(".*"));
    if (searchFor.startsWith(trimmedPermission)) {
        return true;
    }
    return undefined;
}

export function updatePermissionByPlayer(player: Player, permissionName: string, value: boolean) {
    let xuid = getXuid(player);
    updatePermission(xuid, permissionName, value);
}

export function updatePermission(xuid: string, permissionName: string, value: boolean) {
    addPlayerToStorage(xuid);

    permissionStorage[xuid].permissions[permissionName] = value;

    if (!existsSync("../permissions.json")) {
        appendFileSync("../permissions.json", JSON.stringify(permissionStorage, null, 4));
    } else {
        writeFileSync("../permissions.json", JSON.stringify(permissionStorage, null, 4));
    }
    serverInstance.updateCommandList();
}