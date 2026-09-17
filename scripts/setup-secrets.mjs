import {randomBytes} from 'node:crypto';
console.log('VAULT_ENCRYPTION_KEY='+randomBytes(32).toString('base64'));
console.log('SETUP_TOKEN='+randomBytes(32).toString('base64url'));
