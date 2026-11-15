export type ProgressClock = {client_updated_at:string|Date;mutation_id:string};
export function incomingWins(current:ProgressClock|null,incoming:ProgressClock):boolean {
  if(!current) return true;
  const left=new Date(incoming.client_updated_at).getTime(),right=new Date(current.client_updated_at).getTime();
  return left>right || (left===right && incoming.mutation_id.toLowerCase()>current.mutation_id.toLowerCase());
}
