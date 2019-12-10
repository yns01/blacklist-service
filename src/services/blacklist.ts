import axios from 'axios'
import { Readable } from 'stream'
import { parseProviderBlacklistData } from './blacklist-parser'
import * as blacklistRepository from '../storage/blacklist'
import { BlacklistedIP } from '../domain/entities/BlacklistedIP'
import { BlacklistProvider } from '../domain/requests/BlacklistProvider'

export async function getBlacklistSources(ip: string): Promise<BlacklistedIP[]> {
  return blacklistRepository.getMatchingIPsAndSources(ip)
}

export async function updateBlacklistFromSource(source: string) {
  const githubAPI = `https://api.github.com/repos/firehol/blocklist-ipsets/contents/`

  const providerFileRes = await axios.get(`${githubAPI}${source}`, {
    headers: {
      'User-Agent': 'yns01',
    },
  })

  const bufferStream = new Readable()
  bufferStream.push(Buffer.from(providerFileRes.data.content, 'base64'))
  bufferStream.push(null)

  const blacklistProvider: BlacklistProvider = {
    source: source,
    url: `${githubAPI}${source}`,
    entries: await parseProviderBlacklistData(bufferStream),
  }

  await blacklistRepository.storeBlacklist(blacklistProvider)
}
