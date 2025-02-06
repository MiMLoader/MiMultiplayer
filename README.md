# MiMultiplayer
MiMLoader mod for multiplayer Moonstone Island.

# Project Structure
MiMultiplayer is seperated into two part, the server and the mod. Both under the `packages` folder.

# The Mod
This part uses the [MiMLoader](https://github.com/mimloader/mimloader) to load the mod into the game so we can have the clients interact with eachother.
It uses a websocket client called eden for end to end type safety with out server. It also injects an overlay to connect and manage remote connections.

## Building the mod

You can download the repo and build the mod locally (or download the mod from the `releases` page).

*with [moon](https://moonrepo.dev/moon)*
```
moon mod:build
```

*without moon*
```
cd packages/mimultiplayer
bun run build
```

Then you can copy the whole folder into your [MiMLoader](https://github.com/mimloader/mimloader) mods folder and launch the game.

## Contibuting to the mod

Working on the mod is easy! `index.ts` is the main file that gets build so any code you write make sure to import it into the main file.
then simply using the `build` command and restating the game will load your changes.

I recommend linking your folder into the mods folder for [MiMLoader](https://github.com/mimloader/mimloader) if your on linux so you dont have to keep copying the new verison over.

# The Server
The server is an [Elysia](https://elysiajs.com) websocket that dynamically creates isolated worlds for users to connect to.
One server can host multiple world and thanks the the combination of [Bun](https://bun.sh) and [Elysia](https://elysiajs.com) the server is high speed and effiecent while being friendly on resources.

## Building the server

You can download the repo and build the server locally (or download the server binary from the `releases` page).

*with [moon](https://moonrepo.dev/moon)*
```
moon server:build
```

*without moon*
```
cd packages/server
bun run build
```

This will generate a binary named `server`, you can use the `PORT` env to set the port or it will default to `3000`.

## Contibuting to the mod
Some of the code in the server gets ugly sadly but it should be ok if you have a basic understanding of how typescript and Elysia works

*with [moon](https://moonrepo.dev/moon)*
> start:
```
moon server:start
```
> start with reload:
```
moon server:dev # start the server with reload
```

*without moon*
> start:
```
cd packages/server
bun run start
```
> start with reload:
```
cd packages/server
bun run dev
```
