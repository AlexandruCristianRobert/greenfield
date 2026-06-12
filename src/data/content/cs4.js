// C# 4 (2010) — content authored against learn.microsoft.com in Task 5; sources listed there.
export const ERA_CONTENT = {
  features: [
    { id: 'cs4-dynamic',             era: 'cs4', name: 'dynamic',                  cost: 7e3,   effect: { type: 'clickMult', value: 1.25 }, effectText: 'Click power +25%',            blurb: '', snippet: '' },
    { id: 'cs4-named-arguments',     era: 'cs4', name: 'Named Arguments',          cost: 9e3,   effect: { type: 'clickMult', value: 1.15 }, effectText: 'Click power +15%',            blurb: '', snippet: '' },
    { id: 'cs4-optional-parameters', era: 'cs4', name: 'Optional Parameters',      cost: 1.2e4, effect: { type: 'costMult',  value: 0.93 }, effectText: 'Contributor costs −7%',       blurb: '', snippet: '' },
    { id: 'cs4-generic-variance',    era: 'cs4', name: 'Generic Variance',         cost: 1.6e4, effect: { type: 'lpsMult',   value: 1.20 }, effectText: 'All Contributors +20% LoC/s', blurb: '', snippet: '' },
    { id: 'cs4-tpl',                 era: 'cs4', name: 'Task Parallel Library',    cost: 2.2e4, effect: { type: 'lpsMult',   value: 1.35 }, effectText: 'All Contributors +35% LoC/s', blurb: '', snippet: '' },
    { id: 'cs4-tuple-class',         era: 'cs4', name: 'Tuple<T> Classes',         cost: 3e4,   effect: { type: 'lpsMult',   value: 1.10 }, effectText: 'All Contributors +10% LoC/s', blurb: '', snippet: '' },
  ],
  questions: [],
}
