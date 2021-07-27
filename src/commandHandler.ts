import { appendFileSync } from "fs";
import { AbilitiesIndex } from "../../bdsx/bds/abilities";
import { AttributeId } from "../../bdsx/bds/attribute";
import { CommandCheatFlag, CommandFlag, CommandParameterDataType, CommandPermissionLevel, CommandVisibilityFlag } from "../../bdsx/bds/command";
import { MinecraftPacketIds } from "../../bdsx/bds/packetids";
import { CraftingEventPacket } from "../../bdsx/bds/packets";
import { Player, PlayerPermission, ServerPlayer } from "../../bdsx/bds/player";
import { serverInstance } from "../../bdsx/bds/server";
import { CANCEL } from "../../bdsx/common";
import { events } from "../../bdsx/event";
import { nethook } from "../../bdsx/nethook";
import { CommandRegistry_getAliases } from "./functions";
import { getPermission } from "./permission";

export let commandPermissions = new Map<string, string>();

export function setCommandPermission(command: string, permissionName: string) {
    commandPermissions.set(command, permissionName);
}

export function getPlayerCommandPermission(player: Player, command: string) {
    let commandPermission = commandPermissions.get(command);
    if (commandPermission === undefined) {
        return false;
    }
    return getPermission(commandPermission, player);
}



events.packetSend(MinecraftPacketIds.AvailableCommands).on((p, ni) => {
    let player = ni.getActor();
    if (player) {
        for (let i = 0; i < p.commands.size(); i++) {
            let command = p.commands.get(i);
            let hasPermission = getPlayerCommandPermission(player, command.name);
            if (!hasPermission) {
                p.commands.splice(i, 1);
                i--;
                continue;
            }
        }
    }
});

events.packetSend(MinecraftPacketIds.AdventureSettings).on((p) => {
    p.commandPermission = CommandPermissionLevel.Admin;
});

events.playerJoin.on((e) => {
    let player = e.player;
    let abilities = player.abilities;
    abilities.setAbility(AbilitiesIndex.Teleport, true);
    abilities.setAbility(AbilitiesIndex.OperatorCommands, true);
});

events.command.on((c, o, ct) => {
    let commandName;
    if (c.includes(" ")) {
        commandName = c.slice(1, c.indexOf(" "));
    } else {
        commandName = c.slice(1);
    }
    let commands = serverInstance.minecraft.getCommands();
    let registry = commands.getRegistry();
    let command = registry.findCommand(commandName);
    if (command === null) {
        return 1;
    }
    let player = ct.origin.getEntity() as ServerPlayer;
    if (!player || !player.isPlayer()) {
        return;
    }
    let hasPermission = getPlayerCommandPermission(player, command.command);
    if (!hasPermission) {
        player.sendMessage(`§cUnknown Command: ${command.command}. Please check that the command exists and that you have permission to use it.`);
        return 0;
    }
    return;
});