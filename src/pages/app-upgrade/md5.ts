// 增量 MD5 计算（v2 未引入 spark-md5 依赖，此处实现等价的 SparkMD5.ArrayBuffer 用法，算法已经 node crypto 验证）
const SHIFT_AMOUNTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const SIN_CONSTANTS = new Uint32Array(64);
for (let i = 0; i < 64; i++) {
  SIN_CONSTANTS[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32);
}

const HEX_CHARS = '0123456789abcdef';

export class Md5ArrayBuffer {
  private state = new Uint32Array([0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476]);
  private buffer = new Uint8Array(64);
  private bufferLength = 0;
  private bytesLength = 0;

  append(arrayBuffer: ArrayBuffer): void {
    const bytes = new Uint8Array(arrayBuffer);
    this.bytesLength += bytes.length;
    let offset = 0;
    if (this.bufferLength > 0) {
      const take = Math.min(64 - this.bufferLength, bytes.length);
      this.buffer.set(bytes.subarray(0, take), this.bufferLength);
      this.bufferLength += take;
      offset = take;
      if (this.bufferLength === 64) {
        this.processBlock(this.buffer);
        this.bufferLength = 0;
      }
    }
    while (offset + 64 <= bytes.length) {
      this.processBlock(bytes.subarray(offset, offset + 64));
      offset += 64;
    }
    if (offset < bytes.length) {
      this.buffer.set(bytes.subarray(offset), 0);
      this.bufferLength = bytes.length - offset;
    }
  }

  end(): string {
    const bitLength = this.bytesLength * 8;
    const low = bitLength % 0x100000000;
    const high = Math.floor(bitLength / 0x100000000);

    this.buffer[this.bufferLength] = 0x80;
    this.bufferLength += 1;
    if (this.bufferLength > 56) {
      this.buffer.fill(0, this.bufferLength);
      this.processBlock(this.buffer);
      this.bufferLength = 0;
    }
    this.buffer.fill(0, this.bufferLength, 56);
    this.buffer[56] = low & 0xff;
    this.buffer[57] = (low >>> 8) & 0xff;
    this.buffer[58] = (low >>> 16) & 0xff;
    this.buffer[59] = (low >>> 24) & 0xff;
    this.buffer[60] = high & 0xff;
    this.buffer[61] = (high >>> 8) & 0xff;
    this.buffer[62] = (high >>> 16) & 0xff;
    this.buffer[63] = (high >>> 24) & 0xff;
    this.processBlock(this.buffer);

    let result = '';
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const byte = (this.state[i] >>> (j * 8)) & 0xff;
        result += HEX_CHARS[byte >> 4] + HEX_CHARS[byte & 0xf];
      }
    }
    return result;
  }

  private processBlock(block: Uint8Array): void {
    const m = new Uint32Array(16);
    for (let i = 0; i < 16; i++) {
      m[i] =
        (block[i * 4] |
          (block[i * 4 + 1] << 8) |
          (block[i * 4 + 2] << 16) |
          (block[i * 4 + 3] << 24)) >>>
        0;
    }
    let a = this.state[0];
    let b = this.state[1];
    let c = this.state[2];
    let d = this.state[3];
    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }
      const sum = (a + f + SIN_CONSTANTS[i] + m[g]) >>> 0;
      const tmp = d;
      d = c;
      c = b;
      b = (b + ((sum << SHIFT_AMOUNTS[i]) | (sum >>> (32 - SHIFT_AMOUNTS[i])))) >>> 0;
      a = tmp;
    }
    this.state[0] = (this.state[0] + a) >>> 0;
    this.state[1] = (this.state[1] + b) >>> 0;
    this.state[2] = (this.state[2] + c) >>> 0;
    this.state[3] = (this.state[3] + d) >>> 0;
  }
}
