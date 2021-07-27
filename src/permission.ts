import { Player } from "bdsx/bds/player";
import { appendFileSync, existsSync, writeFileSync } from "fs";
import { serverInstance } from "../../bdsx/bds/server";
import { getXuid } from "./functions";

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
    updatePermission(player, permissionName, true);
    serverInstance.updateCommandList();
}

export function getPermissionDefault(permissionName: string): boolean {
    let permission = permissions.get(permissionName);
    if (permission) {
        return permission.defaultValue;
    }
    return false;
}

export function getPermission(permissionName: string, player: Player): boolean  {
    let xuid = getXuid(player);
    if (!permissionStorage.permission[xuid]) {
        return getPermissionDefault(permissionName);
    }
    let topLevel = permissionStorage.permission[xuid][permissionName];
    if (topLevel !== undefined) {
        return topLevel;
    }

    for (let topLevelPermissionName of Object.keys(permissionStorage.permission[xuid])) {
        if (topLevelPermissionName.endsWith(".*")) {
            let value = checkWildcardPermission(topLevelPermissionName, permissionName);
            if (value !== undefined) {
                return value;
            }
        }
        let checkedPermissions: string[] = [];
        let value = checkChildPermissions(topLevelPermissionName, permissionName, checkedPermissions, player);
        if (value !== undefined) {
            return value;
        }
    }
    return getPermissionDefault(permissionName);
}

function checkChildPermissions(permissionName: string, searchFor: string, checkedPermissions: string[], player: Player): boolean | undefined {
    if (checkedPermissions.includes(permissionName)) {
        throw new Error("Circular permission dependency detected: " + permissionName);
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

function updatePermission(player: Player, permissionName: string, value: boolean) {
    let xuid = getXuid(player);
    if (permissionStorage.permission[xuid] === undefined) {
        permissionStorage.permission[xuid] = {};
    }
    permissionStorage.permission[xuid][permissionName] = value;

    if (!existsSync("../permissions.json")) {
        appendFileSync("../permissions.json", JSON.stringify(permissionStorage, null, 4));
    } else {
        writeFileSync("../permissions.json", JSON.stringify(permissionStorage, null, 4));
    }
}
