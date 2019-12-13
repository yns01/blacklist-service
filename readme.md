# Blacklist service


This is the MVP of a service to check if an IP is un-trusted.
As a source for the un-trusted IP address, we will use Firehol’s public list hosted on [GitHub](https://github.com/firehol/blocklist-ipsets). The service will update itself at a defined frequency to fetch the latest data from Firehol’s.


## Requirements

- [Node.js](https://yarnpkg.com/en/docs/install)
- [Yarn](https://yarnpkg.com/en/docs/install)
- [NPM](https://docs.npmjs.com/getting-started/installing-node)
- [Redis](https://redis.io/download)

## Getting Started


## Using Docker

Just run
```bash
docker-compose up
```

If you to run the app on you local machine, but still have Redis running on Docker, you can
```bash
docker:redis:start
```

## Locally
Clone the repository, install the dependencies.

You first need to install Redis, or pull it docker.

```bash
$ git clone git@github.com:yns01/blacklist-service.git

$ cd blacklist-service

$ cp .env.default.example .env # Update env variables

$ yarn && yarn dev
```

## Endpoints

To fetch or update the content of a list:

```bash
curl -X POST \
  http://localhost:3001/api/v1/blacklist/update \
  -H 'Content-Type: application/json' \
  -H 'cache-control: no-cache' \
  -d '{
    "source": "iblocklist_isp_cablevision.netset"
}'
```
You can use any of the lists from here https://github.com/firehol/blocklist-ipsets.

To check if an IP is present in one of the lists:
```bash
curl -X GET \
  'http://localhost:3001/api/v1/blacklist/?ip=69.74.0.5'
```

## Self update
Just create a cron job to call the update endpoint


## How does it work?

Since Redis has no support for network lookups, we will make use of sorted sets. Each entry from the black list file will be added as a member of a Redis sorted set and assigned a score set to the highest IP range.
Using the instruction `ZRANGEBYSCORE`, we can find if the IP is present in the set

Given the network `1.1.1.0/30`, namely from firehol_level1 list
The first IP is 1.1.1.0 and the last is `1.1.1.3`. Converting them to integers yields `16843008` and `16843011`.

```bash
# Add range 1.1.1.0 to 1.1.1.3
zadd ip-blacklist-ranges 16843011 "ip-16843008-16843011-firehol_level1"
```

```bash
# Add range 1.1.2.0 to 1.1.2.3
zadd ip-blacklist-ranges 16843267 "ip-16843264-16843267-firehol_level1"
```

```bash
# Check if 1.1.1.1 is present in one of the ranges (it is)
ZRANGEBYSCORE ip-blacklist-ranges 16843009 +inf limit 0 1
> 1) "ip-16843008-16843011-firehol_level1"
```

```bash
# Check if 9.9.9.9 is present (it is not)
ZRANGEBYSCORE ip-blacklist-ranges 151587081 +inf
> (empty list or set)
```

```bash
# Check if 1.1.0.255 is present in one of the ranges  (it is not)
ZRANGEBYSCORE ip-blacklist-ranges 16843007 +inf limit 0 1
1) "ip-16843008-16843011-firehol_level1"
```
Now, since the start of the range is strictly higher than our IP, we can say that it is not included

**NB:** This approach will work only if we don’t have overlapping range. In our case, it is true within one list but it is not the case across many lists.

To solve this, we can use one set per list. The performance overhead will depend on how many lists we have to checks. Looking up one list is O(log n), looking up x lists will be x * O(log n)

