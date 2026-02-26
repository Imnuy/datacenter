bun install
bun run build
bun start
 pm2 start bun --name "f43" -- run start --port 80
pm2 stop f43
pm2 start f43
pm2 save