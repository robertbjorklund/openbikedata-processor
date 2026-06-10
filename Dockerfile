# Tippecanoe build (cached separately from app changes)
# Must match the glibc version in node:22-bookworm-slim below.
FROM debian:bookworm-slim AS tippecanoe-builder

ENV TIPPECANOE_VERSION=2.78.0

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y \
    build-essential \
    git \
    pkg-config \
    zlib1g-dev \
    libsqlite3-dev

RUN git clone --branch ${TIPPECANOE_VERSION} --single-branch --depth 1 \
    https://github.com/felt/tippecanoe.git /tmp/tippecanoe

WORKDIR /tmp/tippecanoe
RUN make -j"$(nproc)" && make install

FROM node:22-bookworm-slim

COPY --from=tippecanoe-builder /usr/local/bin/tippecanoe /usr/local/bin/tippecanoe
COPY --from=tippecanoe-builder /usr/local/bin/tile-join /usr/local/bin/tile-join

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y \
    bash \
    libsqlite3-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY . .
RUN sed -i 's/\r$//' run.sh && npm run build && chmod +x run.sh

RUN mkdir -p data

CMD ["bash", "run.sh"]
