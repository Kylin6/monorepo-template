import { Injectable } from "@nestjs/common";
import { getSysCfgRepository, type SysCfgRepository } from "@database/index";

@Injectable()
export class SysCfgService {
  private cache: { at: number; values: Record<string, string> } | null = null;

  private async repo(): Promise<SysCfgRepository> {
    return getSysCfgRepository();
  }

  async getSysCfgValues(): Promise<{
    singleAmount: number | null;
    singleBandwidthAmount: number | null;
    countAmount: number | null;
    rate: number | null;
    rechargeAddr: string | null;
    u2tRechargeAddr: string | null;
    shortcutsPrice: number | null;
    autoLeasePrice: number | null;
    countBandwidthPrice: number | null;
  }> {
    const targetKeys = [
      "singleAmount",
      "singleBandwidthAmount",
      "noUEnergyAmount",
      "uRechargeExchange",
      "rechargeAddr",
      "u2tRechargeAddr",
      "shortcutsPrice",
      "autoLeasePrice",
      "countBandwidthPrice",
    ] as const;

    try {
      const rows = await (await this.repo()).find({
        where: targetKeys.map((k) => ({ key: k })),
        select: ["key", "value"],
      });

      const kv = new Map<string, string>(
        rows.map((r) => [r.key as string, r.value as unknown as string])
      );

      const toNumber = (v: string | undefined): number | null => {
        if (v === undefined || v === null) return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };

      return {
        singleAmount: toNumber(kv.get("singleAmount")),
        singleBandwidthAmount: toNumber(kv.get("singleBandwidthAmount")),
        countAmount: toNumber(kv.get("noUEnergyAmount")),
        rate: toNumber(kv.get("uRechargeExchange")),
        rechargeAddr: kv.get("rechargeAddr") ?? null,
        u2tRechargeAddr: kv.get("u2tRechargeAddr") ?? null,
        shortcutsPrice: toNumber(kv.get("shortcutsPrice")),
        autoLeasePrice: toNumber(kv.get("autoLeasePrice")),
        countBandwidthPrice: toNumber(kv.get("countBandwidthPrice")),
      };
    } catch (error) {
      return {
        singleAmount: null,
        singleBandwidthAmount: null,
        countAmount: null,
        rate: null,
        rechargeAddr: null,
        u2tRechargeAddr: null,
        shortcutsPrice: null,
        autoLeasePrice: null,
        countBandwidthPrice: null,
      };
    }

    // const repo = await this.repo();
    // const rows = await repo.find();
    // const values: Record<string, string> = {};
    // for (const row of rows) {
    //   values[row.key] = row.value;
    // }
    // this.cache = { at: now, values };
    // return values;
  }
}
