bun install
bun run build
pm2 list
 pm2 restart f43
 pm2 start bun --name "f43" -- run start --port 80
pm2 stop f43
pm2 start f43
pm2 save
เพิ่มเมนู /อัพโหลด ให้ user สามารถอัพโหลดไฟล์ด้วย .zip เท่านั้น แล้วเก็บไฟล์ไว้ที่ upload เท่านั้น