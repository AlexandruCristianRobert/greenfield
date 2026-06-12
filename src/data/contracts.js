// Client contracts — each Rewrite run rolls one (variety per design). Run 0 is balanced.
export const CONTRACTS = [
  { id: 'ct-balanced',   name: 'Balanced Backlog',    desc: 'No modifiers — a calm client.',                          effects: [] },
  { id: 'ct-startup',    name: 'Startup Sprint',      desc: 'Click power +50%, Contributors −25% LoC/s',              effects: [{ type: 'clickMult', value: 1.5 }, { type: 'lpsMult', value: 0.75 }] },
  { id: 'ct-enterprise', name: 'Enterprise Retainer', desc: 'Contributors +50% LoC/s, click power −25%',              effects: [{ type: 'lpsMult', value: 1.5 }, { type: 'clickMult', value: 0.75 }] },
  { id: 'ct-agency',     name: 'Agency Hustle',       desc: 'Contributor costs −20%, Releases +25% dearer',           effects: [{ type: 'costMult', value: 0.8 }, { type: 'releaseMult', value: 1.25 }] },
  { id: 'ct-fintech',    name: 'Fintech Compliance',  desc: 'Persistence throughput +50%, Contributor costs +15%',    effects: [{ type: 'tpMult', value: 1.5 }, { type: 'costMult', value: 1.15 }] },
]

const ROLLABLE = CONTRACTS.filter((c) => c.id !== 'ct-balanced')

export function rollContract(rand = Math.random) {
  return ROLLABLE[Math.min(Math.floor(rand() * ROLLABLE.length), ROLLABLE.length - 1)]
}
