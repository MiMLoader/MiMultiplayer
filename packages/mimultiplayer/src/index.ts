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
                    this.playerSyncLoop(socket);
                    break;
                }
                case 'close': {
                    console.log(`Server requested disconnect: ${data}`);
                    socket.close();
                    break;
                }

            }
        });
    };
}

class Overlay {
    private overlayContainerElem = document.createElement('div');
    overlayElem = document.createElement('div');
    private _visible = false;
    get visible(): boolean {
        return this._visible;
    }
    constructor() {
        this.overlayContainerElem.id = 'overlayContainer';
        this.overlayElem.id = 'overlay';

        this.overlayContainerElem.style.display = 'grid';
        this.overlayContainerElem.style.placeItems = 'center';
        this.overlayContainerElem.style.height = '100vh';
        this.overlayContainerElem.style.width = '100vw';
        this.overlayContainerElem.style.zIndex = '10000';
        this.overlayContainerElem.style.position = 'absolute';
        this.overlayContainerElem.style.top = '0';
        this.overlayContainerElem.style.left = '0';

        const iFrameElem = document.createElement('iframe');
        iFrameElem.src = 'http://localhost:5131/mods/mimultiplayer/assets/index.html';
        iFrameElem.style.width = '50vw';
        iFrameElem.style.height = '50vh';
        iFrameElem.style.padding = '0';
        iFrameElem.style.margin = '0';
        iFrameElem.style.border = 'none';
        iFrameElem.style.borderRadius = '8px';
        iFrameElem.style.outlineColor = '#bd745d';
        iFrameElem.style.outlineWidth = '6px';
        iFrameElem.style.outlineStyle = 'solid';

        this.handleMessages(iFrameElem);
        this.overlayElem.appendChild(iFrameElem);
        this.overlayContainerElem.appendChild(this.overlayElem);
        document.body.appendChild(this.overlayContainerElem);

    }
    private handleMessages = async (frame: HTMLIFrameElement) => {
        const ping = setInterval(() => {
            frame.contentWindow?.postMessage('ping', 'http://localhost:5131');
        }, 1000);
        window.addEventListener('message', (event) => {
            console.log(event.data);
            if (event.data === 'pong') return clearInterval(ping);
        });

    };
    private joinWorld = async () => {
        const multi = new MiMulti('',
            '',
            '',
            // @ts-ignore
            nw.require('./greenworks').getSteamId().screenName
        );
        multi.ping().catch((err) => {
            console.log(err);
            window.confirm(`Cant connect: ${err}`);
        }).then(() => {
            multi.connect();
        }
        );
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
        return this;
    };
}


if (inGameProcess) {
    new Overlay()
        .bindToKey('\\');
    // @ts-ignore
    nw.require('./greenworks').init();
}

if (!inGameProcess) {
    const worldId = 'test';
    const key = 'meow';
    const user = 'testUser';
    const multi = new MiMulti('localhost:3000',
        worldId,
        key,
        user
    );
    multi.socket();
}