export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function normalizePokemonAnswer(value){
 return String(value).normalize('NFKC').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[\s\-_'’·.]/g,'');
}
export function matchesPokemonAnswer(pokemon,answer){
 const normalized=normalizePokemonAnswer(answer);
 return !!normalized && [pokemon.name,pokemon.zh,...(pokemon.aliases||[])].filter(Boolean).some(n=>normalizePokemonAnswer(n)===normalized);
}
