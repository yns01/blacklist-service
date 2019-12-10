import { Readable } from 'stream'
import readline from 'readline'
import { Netmask } from 'netmask'
import { BlacklistEntry } from '../domain/requests/BlacklistProvider'

import { IPv4Regex, CIDRRegex } from '../lib/ip'

export function parseProviderBlacklistData(providerData: Readable): Promise<BlacklistEntry[]> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: providerData,
    })

    const entries: BlacklistEntry[] = []

    rl.on('line', (blacklistEntry: string) => {
      try {
        let match = IPv4Regex.exec(blacklistEntry)
        if (match) {
          entries.push({
            rangeStart: match[0],
            rangeEnd: match[0],
            rawAddress: blacklistEntry,
          })
          return
        }

        match = CIDRRegex.exec(blacklistEntry)
        if (!match) {
          return
        }

        // zadd ip-blacklist-ranges 16843267 "ip-1.1.2.0/30-16843264-16843267-firehol_level1"
        const range = new Netmask(`${match[1]}/${match[2]}`)
        entries.push({
          rangeStart: range.first,
          rangeEnd: range.last,
          rawAddress: blacklistEntry,
        })
      } catch (error) {
        reject(error)
      }
    })

    rl.on('close', () => resolve(entries))
  })
}
