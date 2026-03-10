#
# Copyright Cyrus Ho. All Rights Reserved.
# Copyright Broadcom, Inc. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0
#
FROM oven/bun:1

LABEL org.opencontainers.image.authors="https://bitnami.com/contact" \
      org.opencontainers.image.description="Readme Generator For Helm" \
      org.opencontainers.image.source="https://github.com/bitnami/readme-generator-for-helm" \
      org.opencontainers.image.title="readme-generator-for-helm" \
      org.opencontainers.image.vendor="Broadcom, Inc. All Rights Reserved."

COPY . /app
WORKDIR /app
RUN bun install --frozen-lockfile
RUN bun run build
RUN ln -s /app/dist/bin/index.js /app/dist/bin/readme-generator

ENV PATH="/app/dist/bin:$PATH"

CMD ["readme-generator"]
