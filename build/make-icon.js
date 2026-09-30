// node build/make-icon.js — renders build/icon.png (1024², electron-builder turns it into .icns/.ico)
const zlib = require('zlib'), fs = require('fs')
const S = 1024, px = Buffer.alloc(S * (S * 4 + 1))
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)
const lens = (x, y, r, d) => Math.hypot(x - 512, y - 512 + d) < r && Math.hypot(x - 512, y - 512 - d) < r
for (let y = 0; y < S; y++) {
  px[y * (S * 4 + 1)] = 0
  for (let x = 0; x < S; x++) {
    let acc = [0, 0, 0, 0]
    for (let i = 0; i < 4; i++) {
      const u = x + (i % 2 + 0.5) / 2, v = y + ((i >> 1) + 0.5) / 2
      const q = Math.max(Math.abs(u - 512) - 232, 0) ** 5 + Math.max(Math.abs(v - 512) - 232, 0) ** 5
      if (Math.abs(u - 512) > 412 || Math.abs(v - 512) > 412 || q > 180 ** 5) continue // squircle, 100px margin
      let c = mix([124, 92, 255], [58, 36, 150], (u + v) / 2048) // violet gradient
      const eye = lens(u, v, 470, 300) && !lens(u, v, 426, 300)
      const pupil = Math.hypot(u - 512, v - 512) < 92
      if (eye || pupil) c = [255, 255, 255]
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
