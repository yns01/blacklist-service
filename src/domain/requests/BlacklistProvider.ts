export interface BlacklistEntry {
  rawAddress: string
  rangeStart: string
  rangeEnd: string
  // rangeEndDecimal: number
}

export interface BlacklistProvider {
  source: string
  url: string
  entries: BlacklistEntry[]
}
