// Skill Tree: Knowledge is ALLOCATED here, never consumed (CONTEXT.md).
// Allocation resets at every Rewrite (M4); the budget never does.
export const MAX_SKILL_NODES = 5
export function skillNodeCost(nodeIndex) {
  return nodeIndex + 1 // 1+2+3+4+5 = 15 per full branch, 60 for the tree
}
export const SKILL_BRANCHES = [
  { id: 'language',    name: 'Language',    icon: '{ }', effectType: 'clickMult',   perNode: 1.12, blurb: '+12% click power per point' },
  { id: 'data',        name: 'Data',        icon: '🗄️',  effectType: 'lpsMult',     perNode: 1.10, blurb: '+10% LoC/s per point' },
  { id: 'performance', name: 'Performance', icon: '⏱️',  effectType: 'costMult',    perNode: 0.96, blurb: '−4% Contributor costs per point' },
  { id: 'tooling',     name: 'Tooling',     icon: '🔧',  effectType: 'releaseMult', perNode: 0.94, blurb: '−6% Release funding cost · +2h offline cap per point' },
]
