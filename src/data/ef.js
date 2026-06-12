// The EF ladder: each tier is a one-time LoC purchase, gated by reaching an
// era. baseThroughput is Data/sec persisted before EF-card multipliers.
export const EF_TIERS = [
  { id: 'ef6',     name: 'Entity Framework 6', requiresEra: 'cs5',  cost: 5e5,    baseThroughput: 30 },
  { id: 'efcore1', name: 'EF Core 1',          requiresEra: 'cs7',  cost: 2e7,    baseThroughput: 300 },
  { id: 'efcore3', name: 'EF Core 3.1',        requiresEra: 'cs8',  cost: 4e8,    baseThroughput: 2_500 },
  { id: 'efcore6', name: 'EF Core 6',          requiresEra: 'cs10', cost: 9e9,    baseThroughput: 2e4 },
  { id: 'ef7',     name: 'EF Core 7',          requiresEra: 'cs11', cost: 2e11,   baseThroughput: 1.6e5 },
  { id: 'ef8',     name: 'EF Core 8',          requiresEra: 'cs12', cost: 5e12,   baseThroughput: 1.3e6 },
  { id: 'ef9',     name: 'EF Core 9',          requiresEra: 'cs13', cost: 1.2e14, baseThroughput: 1e7 },
  { id: 'ef10',    name: 'EF Core 10',         requiresEra: 'cs14', cost: 3e15,   baseThroughput: 8e7 },
  { id: 'ef11',    name: 'EF 11 (preview)',    requiresEra: 'cs14', cost: 8e16,   baseThroughput: 6e8 },
]
