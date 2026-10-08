import type {
  RandomSource,
} from "../../combat/ports/random-source.js";
import {
  POSTGRES_BIGINT_MAX,
} from "./progression.js";

export function rollBigIntInclusive(
  minimum: bigint,
  maximum: bigint,
  randomSource: RandomSource
): bigint {
  if (
    minimum < 0n ||
    maximum < 0n ||
    minimum > POSTGRES_BIGINT_MAX ||
    maximum > POSTGRES_BIGINT_MAX
  ) {
    throw new RangeError(
      "Gold bounds must fit non-negative PostgreSQL BIGINT."
    );
  }

  if (minimum > maximum) {
    throw new RangeError(
      "Gold minimum cannot exceed maximum."
    );
  }

  if (minimum === maximum) {
    return minimum;
  }

  if (randomSource.nextBigInt) {
    const result =
      randomSource.nextBigInt(
        minimum,
        maximum
      );

    if (
      result < minimum ||
      result > maximum
    ) {
      throw new RangeError(
        "Random bigint result is outside the requested range."
      );
    }

    return result;
  }

  if (
    minimum >
      BigInt(Number.MAX_SAFE_INTEGER) ||
    maximum >
      BigInt(Number.MAX_SAFE_INTEGER)
  ) {
    throw new RangeError(
      "RandomSource without nextBigInt cannot roll this Gold range."
    );
  }

  const numericMinimum =
    Number(minimum);

  const numericMaximum =
    Number(maximum);

  const result =
    randomSource.nextInt(
      numericMinimum,
      numericMaximum
    );

  if (
    !Number.isSafeInteger(result) ||
    result < numericMinimum ||
    result > numericMaximum
  ) {
    throw new RangeError(
      "Random integer result is outside the requested range."
    );
  }

  return BigInt(result);
}
