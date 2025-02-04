import type Server from 'server';
import { treaty } from '@elysiajs/eden';

const server = treaty<typeof Server>('localhost:3000');

const connection = server.ws.subscribe({
    query: {
        id: '1',
        key: 'meow'
    }
});

connection.subscribe(() => {
    console.log('meow');
});
connection.on('open', () => {
    console.log('connected to server');
});