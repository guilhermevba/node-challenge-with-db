run: startdb
  npm run dev^:server

startdb:
  docker start go-stack-postgres
