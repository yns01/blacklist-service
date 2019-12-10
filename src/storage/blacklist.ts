import { redis, redisSubClient, REDIS_TYPES, SetMembers } from '../storage/'
import { BlacklistedIP } from '../domain/entities/BlacklistedIP'
import { ip2int } from '../lib/ip'
import { DataIntegrityError } from './errors/DataIntegrityError'
import { BlacklistProvider } from '../domain/requests/BlacklistProvider'
import { ListManager } from './ListManager'
import { logger } from '../lib/logger'
import { BLACKLIST_VERSIONS_REDIS_KEY, BLACKLIST_UPDATES_REDIS_CHANNEL } from './constants'

export async function getMatchingIPsAndSources(ip: string): Promise<BlacklistedIP[]> {
  const decimalIp = ip2int(ip)

  const setMembers: SetMembers[] = []
  for (const list of ListManager.getInstance().getAllLists()) {
    const setMember = await redis.zrangebyscore(
      list,
      decimalIp,
      REDIS_TYPES.PLUS_INFINITY,
      REDIS_TYPES.WITHSCORES,
      REDIS_TYPES.LIMIT,
      '0', // offset
      '1' // limit
    )

    // If we found at least one member if the current set, we add to the final result set
    if (setMember.length) {
      setMembers.push(setMember)
    }
  }

  const blacklistedIPs: BlacklistedIP[] = []

  // If no members were found, we can stop here
  if (!setMembers.length) {
    return blacklistedIPs
  }

  // Data retrieved from Redis is an array of SetMembers:
  // [SetMembers: [ 'ip-1.1.1.0/30-16843008-16843011-firehol_level1', '16843011' ]]
  // Each SetMember is made of the actual member and its score

  // For each set from which we had a result, we now check the lower boundary
  for (const setMember of setMembers) {
    const [, sourceIP, minRangeStr, maxRangeStr, listName] = setMember[0].split('-')
    const [, score] = setMembers

    const minRange = parseInt(minRangeStr)
    const maxRange = parseInt(maxRangeStr)

    if (isNaN(minRange) || isNaN(maxRange)) {
      throw new DataIntegrityError(
        `data in set ip-blacklist-ranges with score ${score} and IP ${sourceIP} is incorrect`
      )
    }

    if (decimalIp >= minRange && decimalIp <= maxRange) {
      blacklistedIPs.push({ ip: sourceIP, source: listName })
    }
  }

  return blacklistedIPs
}

export async function storeBlacklist(blacklistProvider: BlacklistProvider) {
  // Data will be stored with the following format
  // zadd blacklisted-ip-ranges-firehol_level1.netset:1 16843267 "ip-1.1.2.0/30-16843264-16843267-firehol_level1"

  const listManager = ListManager.getInstance()
  const list = listManager.generateNewVersion(blacklistProvider.source)

  // TODO: Implement batches of 10k max
  const pipeline = redis.pipeline()
  blacklistProvider.entries.forEach(entry => {
    pipeline.zadd(
      list,
      ip2int(entry.rangeEnd).toString(),
      `ip-${entry.rawAddress}-${ip2int(entry.rangeStart)}-${ip2int(entry.rangeEnd)}-${
        blacklistProvider.source
      }`
    )
  })

  const results = await pipeline.exec()
  if (results.length <= 0.9 * blacklistProvider.entries.length) {
    throw new DataIntegrityError('at least 10% of the blacklist were not inserted properly')
  }

  // Once we have stored the updated data, we update the hash versions
  const [name, version] = list.split(':')
  try {
    await redis.hset(BLACKLIST_VERSIONS_REDIS_KEY, name, version)
  } catch (error) {
    logger.error('could not store blacklist update', error)
    throw new Error('could not store blacklist update')
  }

  // And we notify all other instances
  const listUpdate = {
    [name]: version,
  }
  redis.publish(BLACKLIST_UPDATES_REDIS_CHANNEL, JSON.stringify(listUpdate))
}

export async function init() {
  const listToVersions: { string: string } = await redis.hgetall(BLACKLIST_VERSIONS_REDIS_KEY)

  const listManager = ListManager.getInstance()
  listManager.loadLists(listToVersions)

  redisSubClient.subscribe(BLACKLIST_UPDATES_REDIS_CHANNEL)
  redisSubClient.on('message', (_, message) => {
    logger.info('received blacklist update request', { message })
    try {
      const listUpdate = JSON.parse(message)
      listManager.loadLists(listUpdate)
    } catch (error) {
      logger.warn('could not procces update request', error)
    }
  })
}

redis.on('ready', init)
