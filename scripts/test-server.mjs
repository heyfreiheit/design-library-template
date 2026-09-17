import {PGlite} from '@electric-sql/pglite';
import {PGLiteSocketServer} from '@electric-sql/pglite-socket';
const db=await PGlite.create();
const server=new PGLiteSocketServer({db,port:55439,host:'127.0.0.1',maxConnections:100});
await server.start();
console.log('Isolated test database ready on 55439');

import {spawn} from 'node:child_process';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--webpack','-H','127.0.0.1','-p','3187'],{stdio:'inherit',env:{...process.env,DATABASE_URL:'postgresql://test:test@127.0.0.1:55439/test',BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_test_only_not_a_real_token',VAULT_ENCRYPTION_KEY:Buffer.alloc(32,7).toString('base64'),SETUP_TOKEN:'test-only-setup-token-never-for-production',APP_ORIGIN:'http://127.0.0.1:3187'}});
process.on('SIGTERM',async()=>{child.kill();await server.stop();await db.close();process.exit(0)});
