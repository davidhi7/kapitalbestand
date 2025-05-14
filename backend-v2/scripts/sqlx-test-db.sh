#!/usr/bin/env bash
docker run --detach --name "kapitalbestand-test" --publish "5431:5432" --mount type=tmpfs,destination=/var/lib/postgresql/data --env POSTGRES_DB=kapitalbestand-test --env POSTGRES_USER=test --env POSTGRES_PASSWORD=test postgres:latest
