// New additions default to challenge-only; roster order never controls rewards.
export const starterPool=roster=>roster.filter(p=>p.acquisition==='starter');
export const canAcquire=(pokemon,mode)=>!!pokemon&&(mode==='battle'||(['guess','arm'].includes(mode)&&pokemon.acquisition==='starter'));
