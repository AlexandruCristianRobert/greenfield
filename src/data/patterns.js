// Permanent architecture Patterns, bought with Blueprints (spent, single-purchase).
// Patterns with effects flow through combineMods; behavioral ones ([] effects)
// are checked via prestige.hasPattern(id) at their integration seams.
export const PATTERNS = [
  { id: 'pat-di',                 name: 'Dependency Injection', icon: '💉', cost: 1, desc: 'Auto-buys the cheapest affordable Contributor every 10s', effects: [] },
  { id: 'pat-cqrs',               name: 'CQRS',                 icon: '⚖️', cost: 2, desc: 'Click power +75% · all Contributors +25% LoC/s',           effects: [{ type: 'clickMult', value: 1.75 }, { type: 'lpsMult', value: 1.25 }] },
  { id: 'pat-event-sourcing',     name: 'Event Sourcing',       icon: '📜', cost: 2, desc: 'Offline earnings ×2',                                      effects: [] },
  { id: 'pat-caching',            name: 'Caching',              icon: '⚡', cost: 3, desc: 'Combo decays half as fast, grace period doubled',          effects: [] },
  { id: 'pat-clean-architecture', name: 'Clean Architecture',   icon: '🏛️', cost: 4, desc: 'All Contributors ×2 LoC/s',                                effects: [{ type: 'lpsMult', value: 2.0 }] },
]
