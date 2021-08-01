import { fsutil } from "bdsx/fsutil";
import { config, luckPermStorage } from "./storage";

export interface GroupData {
    displayName?: string;
    weight?: number;
    prefix?: { name: string, weight: number };
    suffix?: { name: string, weight: number };
    parentIds?: string[];
    nodes?: { node: string, value: boolean }[];
}

function createGroup(id: string, data: GroupData) {
    if (groupExists(id)) {
        throw new Error(`Group with id ${id} already exists!`);
    }

    convertDataToNodes(data);

    updateGroup(id, data);
}

function convertDataToNodes(data: GroupData) {
    if (data.nodes === undefined) {
        data.nodes = [];
    }

    const specialNodes: any = { // I get this
        'weight': data.weight,
        'displayname': data.displayName,
        'prefix': { check: data.prefix, node: (prefix: any) => `${prefix.weight}.${prefix.name}` },
        'suffix': { check: data.suffix, node: (suffix: any) => `${suffix.weight}.${suffix.name}` },
    };

    if (data.parentIds !== undefined) {
        for (let parent of data.parentIds) {
            specialNodes[parent] = null;
        }
    }

    for (let [key, value] of Object.entries(specialNodes)) {
        let node;
        if (value !== null) {
            const check = ('check' in Object(value)) ? (value as any)['check'] : value;
            if (check === undefined) {
                continue;
            }

            const nodeValue = ('node' in Object(value)) ? (value as any)['node'](check) : value;
            node = `${key}.${nodeValue}`;
        } else {
            node = key;
        }

        data.nodes = data.nodes.filter(element => !element.node.startsWith(`${key}.`));
        data.nodes.push({ node, value: true });
    }
}

function spliceNodeFromArray(nodeArray: { node: string, value: boolean }[], prefix: string, expectedValue: string, index: number) {
    if (nodeArray[index].node.startsWith(prefix) && index >= 0 && nodeArray[index].node !== `${prefix}${expectedValue}`) {
        nodeArray.splice(index, 1);
        return true;
    }
    return false;
}
function updateGroup(id: string, changes: GroupData | undefined) {
    let oldData = {}
    if (luckPermStorage.holders.groups[id] !== undefined) {
        oldData = luckPermStorage.holders.groups[id];
    }

    luckPermStorage.holders.groups[id] = {
        ...oldData,
        ...changes
    }

    fsutil.writeJsonSync(config.permissionStorageName, luckPermStorage);
}

export function updateGroupData(id: string, changes: GroupData) {
    convertDataToNodes(changes);
    updateGroup(id, changes);
}

function groupExists(id: string) {
    return luckPermStorage.holders.groups[id] !== undefined;
}

createGroup('default', {
    displayName: 'Default',
    weight: -1,
    nodes: [
        { node: 'weight.0', value: true },
        { node: 'displayname.different', value: true },
        { node: 'prefix.0.def', value: true },
    ]
});

console.log(luckPermStorage.holders.groups.default);

