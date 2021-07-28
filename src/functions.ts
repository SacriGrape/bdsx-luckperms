import { CommandRegistry } from "bdsx/bds/command";
import { Certificate } from "bdsx/bds/connreq";
import { Player } from "bdsx/bds/player";
import { pdb } from "bdsx/core";
import { CxxVector } from "bdsx/cxxvector";
import { UNDNAME_NAME_ONLY } from "bdsx/dbghelp";
import { CxxString, int32_t } from "bdsx/nativetype";
import { ProcHacker } from "bdsx/prochacker";

const hacker = ProcHacker.load("../pdb.ini", ["Player::getCertificate", "Player::getCommandPermissionLevel", "CommandRegistry::getAliases"], UNDNAME_NAME_ONLY);
pdb.close();

export const CommandRegistry_getAliases = hacker.js("CommandRegistry::getAliases", CxxVector.make(CxxString), {structureReturn: true, this: CommandRegistry}, CxxString);

hacker.hooking("Player::getCommandPermissionLevel", int32_t, null, Player)(onGetCommandPermissionLevel);
const Player_getCertificate = hacker.js("Player::getCertificate", Certificate, null, Player);

export function getXuid(player: Player): string {
    let cert = Player_getCertificate(player);
    return cert.getXuid();
}

function onGetCommandPermissionLevel(player: Player): int32_t {
    return 4;
}