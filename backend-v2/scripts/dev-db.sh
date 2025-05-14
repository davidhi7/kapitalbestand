#!/usr/bin/env bash
docker run --detach --name "kapitalbestand-dev" --publish "5432:5432" --mount type=tmpfs,destination=/var/lib/postgresql/data --env POSTGRES_DB=kapitalbestand-dev --env POSTGRES_USER=test --env POSTGRES_PASSWORD=test postgres:latest
