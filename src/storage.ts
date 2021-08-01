import { join } from "path";
import { fsutil } from "bdsx/fsutil";
import { existsSync, readFileSync } from "fs";

export let luckPermStorage: any = {
    holders: {
        groups: {},
        users: {}
    },
    permissions: {}
};

// TODO: Create a a proper config file system
export const config = {
    permissionStorageName: join(fsutil.projectPath, "luckperms.json"),
}

if (existsSync(config.permissionStorageName)) {
    let storageString = readFileSync(config.permissionStorageName, "utf8");
    luckPermStorage = JSON.parse(storageString);
}