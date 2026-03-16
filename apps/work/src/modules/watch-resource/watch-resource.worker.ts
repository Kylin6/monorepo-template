import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import axios, { type AxiosInstance } from "axios";
import {
  getAuthorizedWalletRepository,
  getSysCfgRepository,
  type AuthorizedWallet,
} from "@database/index";
import {
  getSetting,
  setSetting,
  getStakeExchange,
} from "@database/helper/sys-cfg.helper";
import { TronHelper } from "@database/helper/tron.helper";
import { AUTHORIZED_WALLET_STATUS } from "@database/constants/authorized-wallet";
type TronHttpMethod = "GET" | "POST";

@Injectable()
export class WatchResourceWorker implements OnModuleInit {
  private readonly logger = new Logger(WatchResourceWorker.name);

  private tronApi: AxiosInstance;
  private tronScanApi: AxiosInstance;

  private running = {
    updateResourcePrice: false,
    updateExchangeRate: false,
    updateWalletAccountInfo: false,
    updateWalletResources: false,
    updateWalletCanDelegate: false,
  };

  constructor() {
    const tronNode = process.env.TRON_NODE_URL || "https://api.trongrid.io";
    this.tronApi = axios.create({
      baseURL: tronNode,
      timeout: 20_000,
    });

    this.tronScanApi = axios.create({
      baseURL: "https://apilist.tronscanapi.com",
      timeout: 20_000,
    });
  }

  async onModuleInit() {
    // 启动时先执行一次资源价格更新（对标 PHP onWorkerStart 中的 getResourcePrice）
    void this.updateResourcePrice();
  }

  // ====== 定时任务实现 ======

  /**
   * 对标 PHP:
   * new Crontab('0 0 * * * *', ...)
   * 每小时第 0 分钟第 0 秒执行
   */
  @Cron("0 0 * * * *")
  async updateResourcePrice() {
    if (this.running.updateResourcePrice) return;
    this.running.updateResourcePrice = true;
    try {
      const sysRepo = await getSysCfgRepository();
      const energy = await this.fetchTron("/wallet/getenergyprices", "GET");
      const bandwidth = await this.fetchTron(
        "/wallet/getbandwidthprices",
        "GET"
      );

      const energyPrice = this.parseTronPrices(energy?.prices);
      const bandwidthPrice = this.parseTronPrices(bandwidth?.prices);

      if (Number.isFinite(energyPrice)) {
        await setSetting(sysRepo, "energyPrice", String(energyPrice));
      }
      if (Number.isFinite(bandwidthPrice)) {
        await setSetting(sysRepo, "bandwidthPrice", String(bandwidthPrice));
      }
    } catch (err) {
      this.logger.error("updateResourcePrice error", err as any);
    } finally {
      this.running.updateResourcePrice = false;
    }
  }

  /**
   * 每分钟第 0 秒执行
   * 获取 TRX 价格，并更新汇率
   */
  @Cron("0 * * * * *")
  async updateExchangeRate() {
    if (this.running.updateExchangeRate) return;
    this.running.updateExchangeRate = true;
    try {
      const secret =
        "OTljMjUxZGEzOGI5OTcyMDc4ZjlmZGRiNTBjZDg2NmIwMDIwYzgyNTI5ZmY0YzBmNGM3YWQzZjJmNGFhNGJiZA==";

      const res = await this.tronScanApi.get("/api/token/price", {
        params: { token: "trx" },
        headers: { Secret: secret },
      });
      const priceInUsd = Number(res?.data?.price_in_usd);
      if (!Number.isFinite(priceInUsd) || priceInUsd <= 0) {
        return;
      }

      const sysRepo = await getSysCfgRepository();
      const baseExchangeStr = await getSetting(sysRepo, "baseExchange").catch(
        () => "0"
      );
      const baseExchange = Number(baseExchangeStr);

      const rate = this.round(1 / priceInUsd, 2);
      if (!Number.isFinite(rate)) return;

      if (!Number.isFinite(baseExchange) || rate !== baseExchange) {
        await setSetting(sysRepo, "baseExchange", String(rate));
        const feeStr = await getSetting(sysRepo, "rechargeFee").catch(
          () => "0"
        );
        const fee = Number(feeStr);
        const uRechargeExchange = this.round(
          1 / priceInUsd + (Number.isFinite(fee) ? fee : 0),
          2
        );
        await setSetting(
          sysRepo,
          "uRechargeExchange",
          String(uRechargeExchange)
        );
      }
    } catch (err) {
      this.logger.error("updateExchangeRate error", err as any);
    } finally {
      this.running.updateExchangeRate = false;
    }
  }

  /**
   * 对标 PHP:
   * new Crontab('10,25,40,55 * * * * *', ...)
   * 每分钟的 10/25/40/55 秒执行
   * 更新钱包账户信息
   * 包括能量使用、带宽使用、质押能量、质押带宽、可用余额、总余额、授权信息等
   */
  @Cron("10,25,40,55 * * * * *")
  async updateWalletAccountInfo() {
    if (this.running.updateWalletAccountInfo) return;
    this.running.updateWalletAccountInfo = true;
    try {
      const walletRepo = await getAuthorizedWalletRepository();
      const wallets = await walletRepo.find();
      if (!wallets.length) return;

      const now = Math.floor(Date.now() / 1000);

      for (const wallet of wallets) {
        try {
          const data = await this.fetchTron("/wallet/getaccount", "POST", {
            address: wallet.addr,
            visible: true,
          });

          // 更新总能量、带宽使用等（对标 PHP 65-74）
          wallet.energyUsage = Number(
            data?.account_resource?.energy_usage ?? 0
          );
          wallet.bandwidthUsage = Number(data?.net_usage ?? 0);

          wallet.delegatedFrozenV2BalanceForEnergy = Math.floor(
            this.fromSun(
              data?.account_resource?.delegated_frozenV2_balance_for_energy ?? 0
            )
          );
          wallet.acquiredDelegatedFrozenV2BalanceForEnergy = Math.floor(
            this.fromSun(
              data?.account_resource
                ?.acquired_delegated_frozenV2_balance_for_energy ?? 0
            )
          );
          wallet.acquiredDelegatedFrozenV2BalanceForBandwidth = Math.floor(
            this.fromSun(
              data?.acquired_delegated_frozenV2_balance_for_bandwidth ?? 0
            )
          );

          wallet.stakeForBandwidth = Math.floor(
            this.getStakedTrx(data, "BANDWIDTH")
          );
          wallet.stakeForEnergy = Math.floor(this.getStakedTrx(data, "ENERGY"));
          wallet.available = Math.floor(this.fromSun(data?.balance ?? 0));
          wallet.total = Math.floor(
            (wallet.stakeForBandwidth ?? 0) +
              (wallet.stakeForEnergy ?? 0) +
              (wallet.available ?? 0)
          );

          // 卖家钱包：检查授权，对标 TronHelper::parseAccountPermissionInfo
          if (wallet.delegateAddr) {
            const info = TronHelper.parseAccountPermissionInfo(
              wallet.delegateAddr,
              data
            );
            wallet.authorizedCount = info.authorizedCount;
            wallet.activePermissions = info.authorized.join(",");
            wallet.permissionId = info.permissionId;
            if (info.permissionId === null) {
              // 未检测到授权信息：置为不活跃
              wallet.status = AUTHORIZED_WALLET_STATUS.INACTIVE;
              wallet.remark = this.addRemark(
                wallet.remark,
                "Authorization information was not detected."
              );
            }
          }

          wallet.updatedAt = now;
          await walletRepo.save(wallet);
        } catch (e) {
          // 单个钱包失败不影响整体
          this.logger.warn(
            `updateWalletAccountInfo wallet=${wallet.addr} error: ${
              e instanceof Error ? e.message : String(e)
            }`
          );
        }
      }
    } catch (err) {
      this.logger.error("updateWalletAccountInfo error", err as any);
    } finally {
      this.running.updateWalletAccountInfo = false;
    }
  }

  // 对标 PHP: new Crontab('*/5 * * * * *', ...) ，每 5 秒执行一次
  // 更新钱包资源信息
  // 包括能量限制、带宽限制、能量使用、带宽使用、能量总量、带宽总量等
  @Cron("*/5 * * * * *")
  async updateWalletResources() {
    if (this.running.updateWalletResources) return;
    this.running.updateWalletResources = true;
    try {
      const walletRepo = await getAuthorizedWalletRepository();
      const wallets = await walletRepo.find();
      if (!wallets.length) return;

      const sysRepo = await getSysCfgRepository();
      const now = Math.floor(Date.now() / 1000);

      for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        try {
          const data = await this.fetchTron(
            "/wallet/getaccountresource",
            "POST",
            {
              address: wallet.addr,
              visible: true,
            }
          );

          // 第一条钱包用于更新全网质押兑换系数（对标 PHP 115-121）
          if (i === 0) {
            const totalNetLimit = Number(data?.TotalNetLimit ?? 0);
            const totalNetWeight = Number(data?.TotalNetWeight ?? 0);
            const totalEnergyLimit = Number(data?.TotalEnergyLimit ?? 0);
            const totalEnergyWeight = Number(data?.TotalEnergyWeight ?? 0);
            if (totalNetLimit > 0 && totalNetWeight > 0) {
              await setSetting(
                sysRepo,
                "bandwidthStakeExchange",
                String(this.round(totalNetLimit / totalNetWeight, 2))
              );
            }
            if (totalEnergyLimit > 0 && totalEnergyWeight > 0) {
              await setSetting(
                sysRepo,
                "energyStakeExchange",
                String(this.round(totalEnergyLimit / totalEnergyWeight, 2))
              );
            }
          }

          wallet.energyLimit = Number(data?.EnergyLimit ?? 0);
          wallet.bandwidthLimit = Number(data?.BandwidthLimit ?? 0);

          const netLimit = Number(data?.NetLimit ?? 0);
          const freeNetLimit = Number(data?.freeNetLimit ?? 0);
          const netUsed = Number(data?.NetUsed ?? 0);
          wallet.bandwidthTotal = Math.max(
            0,
            netLimit + freeNetLimit - netUsed
          );

          const energyLimit = Number(data?.EnergyLimit ?? 0);
          const energyUsed = Number(data?.EnergyUsed ?? 0);
          wallet.energyTotal = Math.max(0, energyLimit - energyUsed);

          wallet.updatedAt = now;
          await walletRepo.save(wallet);
        } catch (e) {
          this.logger.warn(
            `updateWalletResources wallet=${wallet.addr} error: ${
              e instanceof Error ? e.message : String(e)
            }`
          );
        }
      }
    } catch (err) {
      this.logger.error("updateWalletResources error", err as any);
    } finally {
      this.running.updateWalletResources = false;
    }
  }

  /**
   * 对标 PHP:
   * new Crontab('5,20,35,50 * * * * *', ...)
   * 每分钟的 5/20/35/50 秒执行
   * 更新钱包可委托资源信息
   * 包括能量可委托、带宽可委托
   */
  @Cron("5,20,35,50 * * * * *")
  async updateWalletCanDelegate() {
    if (this.running.updateWalletCanDelegate) return;
    this.running.updateWalletCanDelegate = true;
    try {
      const walletRepo = await getAuthorizedWalletRepository();
      const wallets = await walletRepo.find();
      if (!wallets.length) return;

      const sysRepo = await getSysCfgRepository();
      const now = Math.floor(Date.now() / 1000);

      for (const wallet of wallets) {
        try {
          // 0=bandwidth, 1=energy（对标 PHP 148-154）
          for (const item of [
            { type: 0 as const, field: "bandwidth" as const, stakeType: "B" },
            { type: 1 as const, field: "energy" as const, stakeType: "E" },
          ]) {
            const data = await this.fetchTron(
              "/wallet/getcandelegatedmaxsize",
              "POST",
              {
                owner_address: wallet.addr,
                type: item.type,
                visible: true,
              }
            );

            const maxSizeSun = Number(data?.max_size ?? 0);
            const stakeRate = await getStakeExchange(
              sysRepo,
              item.stakeType as "E" | "B"
            );
            if (!Number.isFinite(stakeRate) || stakeRate <= 0) continue;
            const left = Math.floor(this.fromSun(maxSizeSun) * stakeRate);
            (wallet as any)[item.field] = left;
          }

          wallet.updatedAt = now;
          await walletRepo.save(wallet);
        } catch (e) {
          this.logger.warn(
            `updateWalletCanDelegate wallet=${wallet.addr} error: ${
              e instanceof Error ? e.message : String(e)
            }`
          );
        }
      }
    } catch (err) {
      this.logger.error("updateWalletCanDelegate error", err as any);
    } finally {
      this.running.updateWalletCanDelegate = false;
    }
  }

  // ====== Tron HTTP helpers ======

  private async fetchTron(path: string, method: TronHttpMethod, data?: any) {
    const url = path.startsWith("/") ? path : `/${path}`;
    if (method === "GET") {
      const res = await this.tronApi.get(url);
      return res.data;
    }
    const res = await this.tronApi.post(url, data ?? {});
    return res.data;
  }

  /**
   * 解析 getenergyprices/getbandwidthprices 返回的 prices 字段。
   * 常见格式：
   * - string: "timestamp:price,timestamp:price,..."
   * - array: [{ timestamp, price }, ...]
   */
  private parseTronPrices(prices: unknown): number {
    if (!prices) return NaN;

    if (Array.isArray(prices)) {
      const last = prices[prices.length - 1] as any;
      const n = Number(last?.price ?? last?.[1] ?? last);
      return Number.isFinite(n) ? n : NaN;
    }

    if (typeof prices === "string") {
      const parts = prices
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!parts.length) return NaN;
      const last = parts[parts.length - 1];
      const maybe = last.includes(":") ? last.split(":")[1] : last;
      const n = Number(maybe);
      return Number.isFinite(n) ? n : NaN;
    }

    const n = Number((prices as any)?.price ?? prices);
    return Number.isFinite(n) ? n : NaN;
  }

  private fromSun(sun: number | string): number {
    const n = typeof sun === "string" ? Number(sun) : sun;
    if (!Number.isFinite(n)) return 0;
    return n / 1_000_000;
  }

  private round(n: number, digits: number): number {
    const p = 10 ** digits;
    return Math.round(n * p) / p;
  }

  /**
   * 从 getaccount 返回中估算该地址质押 TRX（v1/v2 结构兼容）。
   */
  private getStakedTrx(data: any, resource: "ENERGY" | "BANDWIDTH"): number {
    // v2: frozenV2: [{type, amount}]
    const frozenV2 = data?.frozenV2;
    if (Array.isArray(frozenV2)) {
      const sumSun = frozenV2
        .filter((x: any) => String(x?.type).toUpperCase() === resource)
        .reduce((acc: number, x: any) => acc + Number(x?.amount ?? 0), 0);
      return this.fromSun(sumSun);
    }

    // v1: frozen / account_resource 冗余字段
    if (resource === "ENERGY") {
      const sun =
        data?.account_resource?.frozen_balance_for_energy?.frozen_balance ??
        data?.account_resource?.frozen_balance_for_energy ??
        0;
      return this.fromSun(sun);
    }

    const sun =
      data?.frozen?.[0]?.frozen_balance ??
      data?.account_resource?.frozen_balance_for_bandwidth ??
      0;
    return this.fromSun(sun);
  }

  private normalizeTronAddr(addr: string): string {
    return (addr || "").trim().toLowerCase();
  }

  /**
   * 简化版授权解析：
   * - 从 active_permission.keys 收集地址（可能是 hex/base58）
   * - 若任一 permission keys 含 delegateAddr，则认为该 permission 为当前授权
   */
  private parseAccountPermissionInfo(
    delegateAddr: string,
    data: any
  ): {
    permissionId: number | null;
    authorizedCount: number;
    authorized: string[];
  } {
    const target = this.normalizeTronAddr(delegateAddr);
    const active = Array.isArray(data?.active_permission)
      ? data.active_permission
      : [];

    let permissionId: number | null = null;
    const authorized: string[] = [];
    let authorizedCount = 0;

    for (const p of active) {
      const keys = Array.isArray(p?.keys) ? p.keys : [];
      authorizedCount += keys.length;
      for (const k of keys) {
        const a = String(k?.address ?? "").trim();
        if (a) authorized.push(a);
        if (
          target &&
          (this.normalizeTronAddr(a) === target ||
            this.normalizeTronAddr("41" + a.replace(/^41/i, "")) === target)
        ) {
          const idNum = Number(p?.id);
          permissionId = Number.isFinite(idNum) ? idNum : null;
        }
      }
    }

    return {
      permissionId,
      authorizedCount,
      authorized: Array.from(new Set(authorized)),
    };
  }

  private addRemark(prev: AuthorizedWallet["remark"], msg: string): string {
    const m = (msg || "").trim();
    if (!m) return prev ?? "";
    const old = (prev ?? "").trim();
    if (!old) return m;
    if (old.includes(m)) return old;
    return `${old}\n${m}`;
  }
}
