import {
  randomBytes,
  randomInt,
} from "node:crypto";

import type {
  RandomSource,
} from "../ports/random-source.js";

type RandomBytesProvider = (
  size: number
) => Buffer;

type RandomIntProvider = (
  minimum: number,
  maximumExclusive: number
) => number;

const RANDOM_FLOAT_DIVISOR =
  2 ** 53;

const MAXIMUM_CRYPTO_INTEGER_RANGE =
  2 ** 48 - 1;

export class CryptoRandomSource
  implements RandomSource {
  public constructor(
    private readonly randomBytesProvider:
      RandomBytesProvider = randomBytes,
    private readonly randomIntProvider:
      RandomIntProvider = randomInt
  ) {}

  public nextFloat(): number {
    const bytes =
      this.randomBytesProvider(8);

    if (
      !Buffer.isBuffer(bytes) ||
      bytes.length !== 8
    ) {
      throw new Error(
        "Crypto random byte provider must return exactly eight bytes."
      );
    }

    const value =
      Number(bytes.readBigUInt64BE(0) >> 11n);

    return value / RANDOM_FLOAT_DIVISOR;
  }

  public nextBigInt(
    minimum: bigint,
    maximum: bigint
  ): bigint {
    if (minimum > maximum) {
      throw new RangeError(
        "Random bigint minimum cannot exceed maximum."
      );
    }

    if (minimum === maximum) {
      return minimum;
    }

    const range =
      maximum - minimum + 1n;

    const bitLength =
      range.toString(2).length;

    const byteLength =
      Math.ceil(bitLength / 8);

    const excessBits =
      byteLength * 8 - bitLength;

    while (true) {
      const bytes =
        this.randomBytesProvider(
          byteLength
        );

      if (
        !Buffer.isBuffer(bytes) ||
        bytes.length !== byteLength
      ) {
        throw new Error(
          "Crypto random byte provider returned an invalid bigint buffer."
        );
      }

      const candidateBytes =
        Buffer.from(bytes);

      if (excessBits > 0) {
        const mask =
          0xff >>> excessBits;

        candidateBytes[0] =
          (candidateBytes[0] ?? 0) &
          mask;
      }

      let candidate = 0n;

      for (const byte of candidateBytes) {
        candidate =
          candidate * 256n +
          BigInt(byte);
      }

      if (candidate < range) {
        return minimum + candidate;
      }
    }
  }

  public nextInt(
    minimum: number,
    maximum: number
  ): number {
    if (
      !Number.isSafeInteger(minimum) ||
      !Number.isSafeInteger(maximum)
    ) {
      throw new RangeError(
        "Random integer bounds must be safe integers."
      );
    }

    if (minimum > maximum) {
      throw new RangeError(
        "Random integer minimum cannot exceed maximum."
      );
    }

    if (minimum === maximum) {
      return minimum;
    }

    if (
      maximum === Number.MAX_SAFE_INTEGER
    ) {
      throw new RangeError(
        "The inclusive maximum is unsupported by the crypto random integer provider."
      );
    }

    const range =
      maximum - minimum + 1;

    if (
      !Number.isSafeInteger(range) ||
      range > MAXIMUM_CRYPTO_INTEGER_RANGE
    ) {
      throw new RangeError(
        "The requested random integer range is too large."
      );
    }

    return this.randomIntProvider(
      minimum,
      maximum + 1
    );
  }
}

