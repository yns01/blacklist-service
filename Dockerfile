
FROM node:10-jessie as builder

ADD . /app

WORKDIR /app

# First install dependencies for production (without dev dependencies)
RUN yarn install --production

# Move dependencies to make it available in the next stage
RUN mkdir /app/production
RUN cp -R node_modules /app/production/
RUN cp package.json production/package.json

# Install dev dependencies
RUN yarn install \
    && yarn cache clean \
    && rm yarn.lock

# Build  the app
RUN yarn build

# ---

FROM node:10-jessie-slim

RUN addgroup --system service \
    && adduser --system --debug --disabled-login service

COPY --chown=service:service --from=builder /app/production/node_modules /app/node_modules
COPY --chown=service:service --from=builder /app/production/package.json /app/
COPY --chown=service:service --from=builder /app/build /app/build

WORKDIR /app

EXPOSE 3001 8001

USER service

CMD [ "yarn", "start" ]
