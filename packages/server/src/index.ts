import { Elysia, t } from 'elysia';

const query = t.Object({
    id: t.String(),
    key: t.String()
});


const server = new Elysia()
    .ws('/ws', {
        query,
        open(ws) {
            console.log(ws.data.query.id, ws.data.query.key);
            ws.send('meow');
        }
    })
    .listen(3000);

export default server;