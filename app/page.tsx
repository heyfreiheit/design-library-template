import {pageUser} from '@/lib/auth-page';
import Vault from '@/components/vault/vault';
export const dynamic='force-dynamic';
export default async function Home(){const user=await pageUser();return <Vault user={user}/>;}
