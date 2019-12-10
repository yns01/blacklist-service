import { isIPv4 } from 'net'

export function ip2int(ip: string): number {
  if (!isIPv4(ip)) {
    throw new Error('not IPv4 valid')
  }

  return (
    ip.split('.').reduce(function(ipInt, octet) {
      return (ipInt << 8) + parseInt(octet, 10)
    }, 0) >>> 0
  )
}

export function int2ip(ip: number): string {
  return (ip >>> 24) + '.' + ((ip >> 16) & 255) + '.' + ((ip >> 8) & 255) + '.' + (ip & 255)
}

// Match single IPv4 address
export const IPv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/

// Match CIDR IPv4 ranges
export const CIDRRegex = /^\s*(?:[^#].*?\s*:\s*)?([0-9.:]+)\/([0-9]{1,2})\s*$/
