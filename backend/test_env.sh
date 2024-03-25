sudo docker container rm -f kapitalbestand-postgres-test
sudo ../scripts/postgres-tmpfs.sh kapitalbestand-postgres-test

export DB_HOST=localhost
export DB_DBMS=postgres
export DB_USER=test
export DB_PASSWORD=test
export DB_DATABASE=kapitalbestand
