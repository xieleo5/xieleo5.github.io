import {createServer} from 'node:http';
import {createPool,initialize,createStore} from './store.mjs';
import {createApp} from './app.mjs';
const pool=createPool();pool.on('error',()=>console.error('Database connection unavailable'));
await initialize(pool);
const server=createServer(createApp(createStore(pool),{origin:process.env.ALLOWED_ORIGIN}));
server.requestTimeout=15000;server.headersTimeout=10000;server.keepAliveTimeout=5000;
server.listen(Number(process.env.PORT||4010),'0.0.0.0',()=>console.log('Homepage API ready'));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(async()=>{await pool.end();process.exit(0);}));
