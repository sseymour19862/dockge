import { DockgeServer } from "./dockge-server";
import { DockgeSocket } from "./util-server";
import { Stack } from "./stack";
import { Terminal } from "./terminal";
import { getContainerTerminalName } from "../common/util-common";

export class Container {

    id: string;
    name: string;
    serviceName: string;
    stack: Stack;
    protected server: DockgeServer;

    constructor(server : DockgeServer, id : string, name : string, serviceName : string, stack : Stack) {
        this.id = id;
        this.name = name;
        this.serviceName = serviceName;
        this.server = server;
        this.stack = stack;
    }

    static async getContainerByStack(server: DockgeServer, stackName: string, serviceName: string, skipFSOperations = false): Promise<Container> {
        const stack = await Stack.getStack(server, stackName, skipFSOperations);

        const containers: object = await stack.ps();
        if (!Array.isArray(containers)) {
            throw new Error("Invalid container result object");
        }

        for (const container of containers) {
            if (!container?.ID || !container?.Name || container?.Service !== serviceName) {
                continue;
            }

            return new Container(server, container.ID, container.Name, container.Service, stack);
        }

        throw new Error("Container with that name not found!");
    }

    private async verb(socket: DockgeSocket, verb: string) : Promise<number> {
        const terminalName = getContainerTerminalName(socket.endpoint, this.name);
        let exitCode = await Terminal.exec(this.server, socket, terminalName, "docker", [ "compose", verb, this.serviceName ], this.stack.path);
        if (exitCode !== 0) {
            throw new Error("Failed to restart, please check the terminal output for more information.");
        }
        return exitCode;
    }

    async pause(socket: DockgeSocket) : Promise<number> {
        return await this.verb(socket, "pause");
    }

    async unpause(socket: DockgeSocket) : Promise<number> {
        return await this.verb(socket, "unpause");
    }

    async restart(socket: DockgeSocket) : Promise<number> {
        return await this.verb(socket, "restart");
    }

    async start(socket: DockgeSocket) : Promise<number> {
        return await this.verb(socket, "start");
    }

    async stop(socket: DockgeSocket) : Promise<number> {
        return await this.verb(socket, "stop");
    }

    async kill(socket: DockgeSocket) : Promise<number> {
        return await this.verb(socket, "kill");
    }
}
