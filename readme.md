# Blacklist service


The service provides the possibility to check if an IP is un-trusted.
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

## Limitations / Missing / ToDos
- For now, the service allows to update only one list at a time.
- List names containing a dash (-) will not work.
- Since we create a new Redis set per update, it would be a good idea to add a TTL to the sets to avoid having useless keys.
- Some of the lists are quite big, so I used the pipeline option. However, we should still have batches of 10k.
- The member of the sets contains the original list name which is redundant with the set name itself.
- Many tests are missing. The more critical ones being the services and the data fetching logic. End to end would be nice.
- We are not using any API key to call GitHub, that might be a problem.
