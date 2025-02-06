import type { Server, Player } from 'server';
import { treaty } from '@elysiajs/eden';

const inGameProcess = typeof window !== 'undefined';

class MiMulti {
    worldId: string;
    key: string;
    serverUrl: string;
    username: string;
    server;
    players = new Map<string, Player>();
    rawWs;
    constructor(server: string, worldId: string, key: string, username: string) {
        this.worldId = worldId;
        this.key = key;
        this.serverUrl = server;
        this.username = username;
        // @ts-ignore
        this.server = treaty<Server>(this.serverUrl);
        this.rawWs = this.server.ws({ id: '' }).subscribe();
    }
    playerSyncLoop = (socket: this['rawWs']) => {
        if (!inGameProcess) return;

        setInterval(() => {
            // @ts-ignore;
            const player = miml.runtime._GetLocalRuntime()._iRuntime.objects.Player.getFirstInstance();
            if (!player) return;
            socket.send({ channel: 'syncPlayer', data: player.instVars });
        }, 500);
    };
    connect = async () => {
        const connAttempt = await this.server.health.get();
        if (connAttempt.status !== 200) return connAttempt.error;
        return true;
    };
    ping = async () => {
        const start = new Date().getMilliseconds();
        await this.server.health.get();
        const end = new Date().getMilliseconds();
        return (end - start);
    };
    socket = async () => {
        const socket = this.server.ws({ id: this.worldId }).subscribe({
            query: {
                worldId: this.worldId,
                key: this.key,
                playerInfo: {
                    name: this.username
                }
            }
        });
        socket.on('open', () => {
            console.log('Connected to mimulti server');
        });
        socket.on('error', (err) => {
            console.log(err);
        });
        socket.on('close', (event) => {
            console.warn(`Connection closed: ${event.code}, ${event.reason}`);
            socket.close();
        });
        socket.on('message', ({ data: { channel, data } }) => {
            console.log(`[${channel}] ${data}`);
            switch (channel) {
                case 'syncPlayer': {
                    const player = data as Player;
                    console.log(player);
                    this.players.set(player.id, player);
                    break;
                }
                case 'startSyncPlayer': {
                    return this.playerSyncLoop(socket);
                }
                case 'close': {
                    console.log(`Server requested disconnect: ${data}`);
                    socket.close();
                }

            }
        });
    };
}

class Overlay {
    overlayElem = inGameProcess ? document.createElement('div') : undefined as unknown as HTMLDivElement;
    private _visible = false;
    isConnected = false;
    get visible(): boolean {
        return this._visible;
    }
    constructor() {
        if (!inGameProcess) return;
        this.overlayElem.style.zIndex = '10000';
        this.overlayElem.style.width = `${window.innerWidth / 2}px`;
        this.overlayElem.style.height = `${window.innerHeight / 2}px`;
        this.overlayElem.style.position = 'absolute';
        this.overlayElem.style.top = '0';
        this.overlayElem.style.right = '0';
        this.overlayElem.style.backgroundColor = '#000';
        this.overlayElem.style.display = 'none';

        document.body.appendChild(this.overlayElem);
    }
    connectToServerElement = () => {
        const element = document.createElement('input');
    };
    toggle = () => {
        if (this.visible) {
            this._visible = false;
            this.overlayElem.style.display = 'none';
        } else {
            this._visible = true;
            this.overlayElem.style.display = 'block';
        }
    };
    bindToKey = (key: string) => {
        document.addEventListener('keypress', (event) => {
            if (event.key !== key) return;
            this.toggle();
        });
    };
}

const overlay = new Overlay();
if (inGameProcess) {
    //@ts-ignore
    nw.require('./greenworks').init();
    overlay.bindToKey('o');
}

if (!inGameProcess) {
    const worldId = 'test';
    const key = 'password';
    const user = 'testUser';
    const multi = new MiMulti('localhost:3000',
        worldId,
        key,
        user
    );
    multi.socket();
}