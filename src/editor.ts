import { http, https } from "follow-redirects";
import { command } from "bdsx/command";
import { events } from "../../bdsx/event";
import { permissions, permissionStorage } from "./permission";

function createCompleteEditorJson(): any {
    let editorData: any = {};
    editorData.metadata = createMetadata();
    editorData.permissionHolders = createPermissionHolders();
    editorData.tracks = [];
    editorData.knownPermissions = createKnownPermissions();
    editorData.potentialContexts = [];
    return editorData;
}

function createMetadata() {
    let metadata: any = {};
    metadata.commandAlias = "lp";
    metadata.uploader = {
        name: "BDSX",
        uuid: "00000000-0000-0000-0000-000000000000"
    }
    metadata.time = Date.now();
    metadata.pluginVersion = "1.0.0"
    return metadata;
}

function createPermissionHolders() {
    let permissionHolders: any = [];
    if (permissionStorage.permission === undefined) {
        permissionStorage.permission = {};
    }
    for (let player of Object.keys(permissionStorage.permission)) {
        let xuid = player;
        let permissions: {type: "permission" | "group", key: string, value: boolean}[] = [];
        for (let permission of Object.keys(permissionStorage.permission[player])) {
            permissions.push({type: "permission", key: permission, value: permissionStorage.permission[player][permission]});
        }
        permissionHolders.push(createHolder("user", xuid, permissions, xuid));
    }
    return permissionHolders;
}

function createHolder(type: "group" | "user", name: string, permissions: {type: "permission" | "group", key: string, value: boolean}[] = [], xuid: string = name) {
    let holder: any = {};
    holder.type = type;
    holder.id = xuid;
    holder.displayName = name;
    holder.nodes = permissions;
    return holder;
}

function createKnownPermissions() {
    let knownPermissions: string[] = [];
    for (let permission of permissions) {
        knownPermissions.push(permission[0]);
    }
    return knownPermissions;
}

events.serverOpen.on(() => {
    command.register("test", "Prints the editor JSON to console").overload(() => {
        let test = createCompleteEditorJson();
        console.log(JSON.stringify(test, null, 4));
    }, {});
});