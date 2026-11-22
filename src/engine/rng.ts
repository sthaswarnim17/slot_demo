/** Random source returning a float in [0, 1). */
export interface Rng {
  next(): number;
}

/**
 * Cryptographically secure RNG (Web Crypto). Used by the live game and the server.
 * Draws 32-bit values in batches for speed.
 */
export class SecureRng implements Rng {
  private buf = new Uint32Array(512);
  private i = 512;
  next(): number {
    if (this.i >= this.buf.length) {
      globalThis.crypto.getRandomValues(this.buf);
      this.i = 0;
    }
    return this.buf[this.i++] / 4294967296;
  }
}

/** Fast seeded PRNG (xoshiro128**) for the simulator only. Never used for live play. */
export class SeededRng implements Rng {
  private a: number; private b: number; private c: number; private d: number;
  constructor(seed: number) {
    // splitmix32 to spread the seed
    const sm = () => {
      seed |= 0; seed = (seed + 0x9e3779b9) | 0;
      let t = seed ^ (seed >>> 16); t = Math.imul(t, 0x21f0aaad);
      t = t ^ (t >>> 15); t = Math.imul(t, 0x735a2d97);
      return (t ^ (t >>> 15)) >>> 0;
    };
    this.a = sm(); this.b = sm(); this.c = sm(); this.d = sm();
  }
  next(): number {
    const r = Math.imul(rotl(Math.imul(this.b, 5), 7), 9);
    const t = this.b << 9;
    this.c ^= this.a; this.d ^= this.b; this.b ^= this.c; this.a ^= this.d;
    this.c ^= t; this.d = rotl(this.d, 11);
    return (r >>> 0) / 4294967296;
  }
}

function rotl(x: number, k: number) {
  return (x << k) | (x >>> (32 - k));
}
