// New additions default to challenge-only; roster order never controls rewards.
export const starterPool=roster=>roster.filter(p=>p.acquisition==='starter');
// Home cats (acquisition "home") are only met in Guess who? and never battle.
export const canAcquire=(pokemon,mode)=>!!pokemon&&(pokemon.acquisition==='home'?mode==='guess':mode==='battle'||(['guess','arm'].includes(mode)&&pokemon.acquisition==='starter'));
