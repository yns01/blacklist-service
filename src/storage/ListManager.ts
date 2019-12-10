// ListManager is using to keep track of the version of each list
// It is first loaded at startup time from Redis and then kept in sync through pub/sub
// We could also avoid this sync by fetching all the lists from Redis before processing each request
export class ListManager {
  private listPrefix = 'blacklisted-ip-ranges'
  private blacklistVersions: Map<string, string>
  private static instance: ListManager

  private constructor() {
    this.blacklistVersions = new Map<string, string>()
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new ListManager()
    }

    return this.instance
  }

  loadLists(listToVersions: { string: string }): void {
    for (const [list, version] of Object.entries(listToVersions)) {
      this.blacklistVersions.set(list, version)
    }
  }

  getAllLists(): string[] {
    const lists: string[] = []
    for (const [registeredListName, registeredListVersion] of this.blacklistVersions) {
      lists.push(`${registeredListName}:${registeredListVersion}`)
    }

    return lists
  }

  generateNewVersion(blacklistName: string) {
    const existingVersion = this.blacklistVersions.get(`${this.listPrefix}-${blacklistName}`)
    if (!existingVersion) {
      return `${this.listPrefix}-${blacklistName}:1`
    }

    const bumped = parseInt(existingVersion) + 1
    return `${this.listPrefix}-${blacklistName}:${bumped}`
  }
}
