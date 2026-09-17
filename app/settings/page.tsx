import {pageUser} from '@/lib/auth-page';
import {AccountShell} from '@/components/vault/account-shell';
import {SettingsPanel} from '@/components/vault/settings-panel';
export const dynamic='force-dynamic';
export default async function SettingsPage(){const user=await pageUser({admin:true});return <AccountShell user={user} title="Einstellungen" subtitle="Verbinde eure Werkzeuge. Gib deinem Team Zugang."><SettingsPanel user={user}/></AccountShell>;}
