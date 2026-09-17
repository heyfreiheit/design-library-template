import {pageUser} from '@/lib/auth-page';
import {AccountShell} from '@/components/vault/account-shell';
import {AccountForm} from '@/components/vault/account-form';
export const dynamic='force-dynamic';
export default async function AccountPage(){const user=await pageUser({allowPasswordChange:true});return <AccountShell user={user} title="Mein Konto" subtitle="Dein Profil und dein persönlicher Zugang."><AccountForm user={user}/></AccountShell>;}
