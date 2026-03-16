/**
 * 能量记录状态，与 energy_records.status 对应
 */
export const ENERGY_STATUS = {
  PENDING: 0,
  PROCESSED: 10,
  IGNORE: 20,
} as const;

export type EnergyStatusValue =
  (typeof ENERGY_STATUS)[keyof typeof ENERGY_STATUS];
