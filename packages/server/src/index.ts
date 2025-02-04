import { Elysia, t } from 'elysia';

const port = Bun.env.PORT || 3000;

const query = t.Object({
    id: t.String(),
    key: t.String()
});

const server = new Elysia()
    .get('/health', 200)
    .ws('/ws', {
        query,
        open(ws) {
            console.log(ws.data.query.id, ws.data.query.key);
            ws.send('meow');
        }
    })
    .listen(port);

export type Server = typeof server;