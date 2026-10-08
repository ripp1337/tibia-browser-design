export interface RandomSource {
  nextFloat(): number;

  nextInt(
    minimum: number,
    maximum: number
  ): number;

  nextBigInt?(
    minimum: bigint,
    maximum: bigint
  ): bigint;
}
