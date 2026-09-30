// node build/make-icon.js — renders build/icon.png (1024², electron-builder turns it into .icns/.ico)
const zlib = require('zlib'), fs = require('fs')
const S = 1024, px = Buffer.alloc(S * (S * 4 + 1))
const cos = Math.cos(-12 * Math.PI / 180), sin = Math.sin(-12 * Math.PI / 180)
const oval = (x, y, cx) => ((x - cx) / 3.8) ** 2 + ((y - 34) / 6) ** 2 < 1
for (let y = 0; y < S; y++) {
  px[y * (S * 4 + 1)] = 0
  for (let x = 0; x < S; x++) {
    let acc = [0, 0, 0, 0]
    for (let i = 0; i < 4; i++) {
      const u = x + (i % 2 + 0.5) / 2, v = y + ((i >> 1) + 0.5) / 2
      const q = Math.max(Math.abs(u - 512) - 232, 0) ** 5 + Math.max(Math.abs(v - 512) - 232, 0) ** 5
      if (Math.abs(u - 512) > 412 || Math.abs(v - 512) > 412 || q > 180 ** 5) continue // squircle, 100px margin
      let c = [29, 27, 22] // ink tile
      // The ghost, in the logo's 100-unit space: a capsule leaning 12°, two oval eyes
      const dx = (u - 512) / 5.6, dy = (v - 512) / 5.6
      const bx = 50 + dx * cos - dy * sin, by = 50 + dx * sin + dy * cos
      if (Math.hypot(bx - 50, by - Math.min(67, Math.max(33, by))) < 19 && !oval(bx, by, 44) && !oval(bx, by, 57)) c = [255, 206, 58]
      acc = acc.map((a, k) => a + (k < 3 ? c[k] : 255) / 4)
    }
    const o = y * (S * 4 + 1) + 1 + x * 4
    const a = acc[3] / 255
    for (let k = 0; k < 3; k++) px[o + k] = a ? acc[k] / a : 0
    px[o + 3] = acc[3]
  }
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data]), crc = Buffer.alloc(4)
  crc.writeUInt32BE(zlib.crc32(body))
  return Buffer.concat([len, body, crc])
}
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(S, 0); ihdr.writeUInt32BE(S, 4); ihdr[8] = 8; ihdr[9] = 6
fs.writeFileSync(__dirname + '/icon.png', Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(px)), chunk('IEND', Buffer.alloc(0)),
]))
