# SearXNG for ALD firm discovery.
#
# Runs on Railway's private network only — it is never given a public domain.
# The ALD app proxies to it through an authenticated route, because an open
# SearXNG instance on the public internet gets found and abused within days.
FROM searxng/searxng:latest

COPY settings.yml /etc/searxng/settings.yml

ENV INSTANCE_NAME="ald-discovery"
EXPOSE 8080
