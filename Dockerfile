FROM node:10-slim AS builder

RUN set -x \
    && addgroup --gid 10001 app \
    && adduser --disabled-password \
        --gecos '' \
        --gid 10001 \
        --home /build \
        --uid 10001 \
        app
RUN apt-get update && apt-get install -y \
    git-core \
    graphicsmagick \
    python-setuptools \
    python-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY --chown=app:app . /build
USER app
WORKDIR /build
RUN _scripts/build-prod.sh

FROM node:10-slim
RUN set -x \
    # Add user
    && addgroup --gid 10001 app \
    && adduser --disabled-password \
        --gecos '' \
        --gid 10001 \
        --home /app \
        --uid 10001 \
        app
RUN apt-get update && apt-get install -y \
    graphicsmagick \
    && rm -rf /var/lib/apt/lists/*

USER app
WORKDIR /app
COPY --chown=app:app --from=builder build .
# RUN npx lerna exec --no-bail -- npm ci
