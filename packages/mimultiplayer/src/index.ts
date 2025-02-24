import type { Server, Player } from 'server';
import { treaty } from '@elysiajs/eden';

class MiMulti {
    worldId: string;
    key: string;
    serverUrl: string;
    username: string;
    server;
    players = new Map<string, Player>();
    playerSprites = new Map<string, any>();
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
    updatePlayer = (playerObj: Player) => {
        if (!this.players.has(playerObj.id)) {
            const player = miml.runtime._GetLocalRuntime()._iRuntime.objects.Player.createInstance(0, 0, 0, true, 5);
            player.isVisible = true;
            this.playerSprites.set(playerObj.id, player);
        }
        this.players.set(playerObj.id, playerObj);
        const player = this.playerSprites.get(playerObj.id);
        console.log(player);
        // Object.assign(player.instVars, playerObj.instVars);
    };
    playerSyncLoop = (socket: this['rawWs']) => {
        const waitForPlayerInst = setInterval(() => {
            // @ts-ignore;
            const player = miml.runtime._GetLocalRuntime()._iRuntime.objects.Player.getFirstInstance();
            if (!player) return;
            clearInterval(waitForPlayerInst);
            return tickPlayer(player);
        }, 500);

        const tickPlayer = (player: any) => {
            setInterval(() => {
                socket.send({ channel: 'syncPlayer', data: player.instVars });
            }, 20);
        };
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
    close = () => {
        console.warn('not connected');
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
            this.close = () => {
                socket.close();
                overlay.disconnected();
            };
        });
        socket.on('error', (err) => {
            console.log(err);
        });
        socket.on('close', (event) => {
            console.warn(`Connection closed: ${event.code}, ${event.reason}`);
            socket.close();
        });
        socket.on('message', ({ data: { data, channel } }) => {
            switch (channel) {
                case 'syncPlayer': {
                    const player = data as Player;
                    this.updatePlayer(player);
                    const playerSprite = this.playerSprites.get(player.id);
                    // miml.runtime._GetLocalRuntime()._iRuntime.objects.Player.getFirstInstance().x = player.instVars?.lastX;
                    // miml.runtime._GetLocalRuntime()._iRuntime.objects.Player.getFirstInstance().y = player.instVars?.lastY;

                    playerSprite.x = player.instVars?.lastX;
                    playerSprite.y = player.instVars?.lastY;
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
    private iFrameElem = document.createElement('iframe');
    get visible(): boolean {
        return this._visible;
    }
    constructor() {
        this.overlayContainerElem.id = 'overlayContainer';
        this.overlayElem.id = 'overlay';
        this.overlayElem.style.display = 'none';

        this.overlayContainerElem.style.display = 'grid';
        this.overlayContainerElem.style.placeItems = 'center';
        this.overlayContainerElem.style.height = '100vh';
        this.overlayContainerElem.style.width = '100vw';
        this.overlayContainerElem.style.zIndex = '10000';
        this.overlayContainerElem.style.position = 'absolute';
        this.overlayContainerElem.style.top = '0';
        this.overlayContainerElem.style.left = '0';

        this.iFrameElem.src = 'http://localhost:5131/mods/mimultiplayer/assets/index.html';
        this.iFrameElem.style.width = '50vw';
        this.iFrameElem.style.height = '50vh';
        this.iFrameElem.style.padding = '0';
        this.iFrameElem.style.margin = '0';
        this.iFrameElem.style.border = 'none';
        this.iFrameElem.style.borderRadius = '8px';
        this.iFrameElem.style.outlineColor = '#bd745d';
        this.iFrameElem.style.outlineWidth = '6px';
        this.iFrameElem.style.outlineStyle = 'solid';

        this.messages.handleMessages();
        this.overlayElem.appendChild(this.iFrameElem);
        this.overlayContainerElem.appendChild(this.overlayElem);
        document.body.appendChild(this.overlayContainerElem);

    }
    private messages = {
        handleMessages: async () => {
            const ping = setInterval(() => {
                this.messages.sendMessage(
                    'ping',
                    // @ts-ignore
                    nw.require('./greenworks').getSteamId().screenName
                );
            }, 1000);
            window.addEventListener('message', (event) => {
                if (event.data.channel === 'pong') return clearInterval(ping);
                if (event.data.channel === 'close') return this.toggle();
                if (event.data.channel === 'connect') {
                    console.log(event.data.data);
                    const connectInfo = JSON.parse(event.data.data);
                    console.log(connectInfo);
                    return this.joinWorld(connectInfo.address, connectInfo.worldId, connectInfo.key, connectInfo.username);
                }
            });

        },
        sendMessage: async (channel: string, data: string) => {
            this.iFrameElem.contentWindow?.postMessage({ channel, data }, 'http://localhost:5131');
        }
    };
    disconnected = () => {
        this.messages.sendMessage('disconnected', '');
    };
    private joinWorld = async (address: string, worldId: string, key: string, username: string) => {
        const multi = new MiMulti(address,
            worldId,
            key,
            username
        );
        multi.connect().catch((err) => {
            console.log(err);
            this.messages.sendMessage('connect', 'failed');
            window.confirm(`Cant connect: ${err}`);
        }).then(() => {
            multi.socket();
            this.messages.sendMessage('connect', 'success');
            window.addEventListener('message', (event) => {
                if (event.data.channel === 'disconnect') return multi.close();
                this.messages.sendMessage('disconnected', '');
            });
        });
    };
    toggle = () => {
        if (this.visible) {
            this._visible = false;
            this.overlayElem.style.display = 'none';
            window.focus();
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

// @ts-ignore
nw.require('./greenworks').init();
const overlay = new Overlay()
    .bindToKey('\\');
