/*import { appendFileSync, existsSync, readFileSync, writeFileSync } from "fs";
import { permissionStorage } from "./permission";

export function writePermissionsToFile() {
    if (!existsSync("../permissions.json")) {
        appendFileSync("../permissions.json", JSON.stringify(permissionStorage, null, 4));
    } else {
        writeFileSync("../permissions.json", JSON.stringify(permissionStorage, null, 4));
    }
}*/