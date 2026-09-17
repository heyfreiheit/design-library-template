export type User = {id:string; username:string; name:string; role:'admin'|'member'; mustChangePassword:boolean};
export type ManagedUser = User & {active:boolean; createdAt:string; lastLoginAt:string|null};
