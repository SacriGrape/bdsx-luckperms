import { http, https } from "follow-redirects";
import { command } from "bdsx/command";
import { events } from "bdsx/event";
import { addPlayerToStorage, permissions, permissionStorage, updatePermission } from "./permission";
import axios from "axios";
import { ServerPlayer } from "bdsx/bds/player";
import { setCommandPermission } from "./commandHandler";
import { CxxString } from "bdsx/nativetype";
import { groups } from "./groups";
import { group } from "console";

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
    for (let xuid of Object.keys(permissionStorage)) {
        addPlayerToStorage(xuid);
        let permissions: { type: "permission", key: string, value: boolean }[] = [];
        for (let permission of Object.keys(permissionStorage[xuid].permissions)) {
            permissions.push({ type: "permission", key: permission, value: permissionStorage[xuid].permissions[permission] });
        }
        permissionHolders.push(createHolder("user", xuid, permissions, xuid));
    }
    for (let group of groups) {
        let permissions: { type: "permission", key: string, value: boolean }[] = [];
        for (let permission of group[1].permissions) {
            permissions.push({ type: "permission", key: permission.permission, value: permission.value });
        }
        permissionHolders.push(createHolder("group", group[0], permissions));
    }
    return permissionHolders;
}

function createHolder(type: "group" | "user", name: string, permissions: { type: "permission" | "group", key: string, value: boolean }[] = [], xuid: string = name) {
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
    command.register("lpeditor", "Creates a link for allowing you to edit permissions!").overload((p, o) => {
        let player = o.getEntity() as ServerPlayer;
        let message = "Please wait while the editor link is generated...";
        if (!player || !player.isPlayer()) {
            console.log(message);
        } else {
            player.sendMessage(message)
        }
        axios.post("https://bytebin.lucko.me/post", createCompleteEditorJson(), { headers: { 'User-Agent': '@bdsx/luckperms/v1.0.0' } }).then((r) => {
            let url = `https://luckperms.net/editor/${r.data.key}`
            let message = `Editor URL: ${url}`;
            if (!player || !player.isPlayer()) {
                console.log(message);
            } else {
                player.sendMessage(message)
            }
        });
    }, {});

    command.register("lpapplyedits", "Applys the edits to permissons!").overload((p, o) => {
        let player = o.getEntity() as ServerPlayer;
        let message = "Applying Changes...";
        if (!player || !player.isPlayer()) {
            console.log(message);
        } else {
            player.sendMessage(message)
        }
        axios.get(`https://bytebin.lucko.me/${p.key}`, { headers: { 'User-Agent': '@bdsx/luckperms/v1.0.0' } }).then((r) => {
            handleChanges(r.data.changes);

            let message = "Permissions updated!";
            if (!player || !player.isPlayer()) {
                console.log(message);
            } else {
                player.sendMessage(message)
            }
        });
    }, {
        key: CxxString
    });

    setCommandPermission("lpeditor", "luckperms.command.lpeditor");
    setCommandPermission("lpapplyedits", "luckperms.command.lpapplyedits");
});

function handleChanges(changes: { type: string, id: string, nodes: { key: string, value: boolean }[] }[]) {
    for (let change of changes) {
        let xuid = change.id;
        let nodeChanges = change.nodes;
        for (let nodeChange of nodeChanges) {
            updatePermission(xuid, nodeChange.key, nodeChange.value);
        }
    }
}

function handleGroupDeletions(changes: any) {

}

function handleTrackDeletions(changes: any) {

}

function handlesUserDeletions(changes: any) {

}