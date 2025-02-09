import { Elysia, t } from 'elysia';
import { version } from '../package.json' with { type: "json" };

// import { ElysiaWS } from 'elysia/ws';


const port = Bun.env.PORT || 3000;

const query = t.Object({
    worldId: t.String(),
    key: t.String(),
    playerInfo: t.Object({
        name: t.String()
    })

});

const response = t.Any();

const body = t.Object({
    channel: t.String(),
    data: t.Any()
});

class World {
    id: string | undefined;
    key: string | undefined;
    owner: string | undefined;
    players = {
        current: new Map<string, Player>(),
    };
}

export class Player {
    id: string;
    name: string;
    instVars?: {
        Direction: 'Down' | 'Up' | 'Left' | 'Right';
        isBusy: boolean;
        isVeryBusy: boolean;
        isFlying: boolean;
        currentTool: string;
        isOnDate: boolean;
        isRunning: boolean;
        isSwimming: boolean;
        hasFainted: boolean;
        lastX: number;
        lastY: number;
        isInPool: boolean;
        flyingTakingOff: boolean;
        maxSpeed: number;
    };
    constructor(id: string, name: string) {
        this.name = name;
        this.id = id;
    }
}

const server = new Elysia()
    .get('/health', 200)
    .get('/ping', 200)
    .ws('/ws/:id', {
        world: new World(),
        query,
        response,
        body,
        // biome-ignore lint/suspicious/noExplicitAny: console can log any
        log(...data: any[]) {
            console.log(`[World:${this.world.id}] ${data}`);
        },
        error(err) {
            this.log(err);
        },
        open({ data, send, id, close, subscribe }) {
            if (this.world.id === undefined) {
                this.world.id = data.query.worldId;
                this.world.key = data.query.key;
                this.world.owner = id;
                this.log(`started by ${data.query.playerInfo.name} (${id})`);
            } else {
                this.log(`${data.query.playerInfo.name} (${id}) joined`);
            }
            if (this.world.key !== data.query.key) return close(4403, 'Forbidden');

            subscribe('syncPlayer');
            subscribe('main');

            const player = new Player(id, data.query.playerInfo.name);
            this.world.players.current.set(player.id, player);
            send({ channel: 'startSyncPlayer', data: true });
        },
        close({ id, publish }) {
            const player = this.world.players.current.get(id);
            if (!player) return;
            this.log(`${player.name} (${player.id}) disconnected`);
            if (player.id === this.world.owner) {
                this.log('owner disconnected, closing');
                publish('main', { channel: 'close', data: 'Server Closed' });
            }
            this.world.players.current.delete(player.id);
            if (this.world.players.current.size === 0) {
                this.log('0 players in world, closing');
                // @ts-ignore
                this.world = new World();
            }
        },
        message({ body: { channel, data }, id, publish }) {
            const self = this.world.players.current.get(id);
            if (!self) return;
            switch (channel) {
                case 'syncPlayer': {
                    publish('syncPlayer', { channel, data });
                }
            }
        }
    })
    .listen(port, (app) => {
        console.log(`🚀 MiMultiplayer server v${version} running on ${app.port}`);
    });

export type Server = typeof server;