import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface TronBlock {
  block_header: {
    raw_data: {
      number: number;
      timestamp: number;
      txTrieRoot: string;
      parentHash: string;
      version: number;
      witness_address: string;
    };
  };
  transactions?: TronTransaction[];
}

export interface TronContractValue {
  owner_address?: string;
  to_address?: string;
  receiver_address?: string;
  contract_address?: string;
  amount?: number;
  data?: string;
  resource?: string;
  balance?: string;
  [key: string]: any;
}

export interface TronTransaction {
  txID: string;
  ret: Array<{
    contractRet: string;
  }>;
  raw_data: {
    contract: Array<{
      type: string;
      parameter: {
        value: TronContractValue;
      };
    }>;
    ref_block_bytes: string;
    ref_block_hash: string;
    expiration: number;
    timestamp: number;
  };
}

export interface TronApiResponse<T = any> {
  Error?: string;
  [key: string]: any;
}

export interface TronAccountResource {
  EnergyLimit?: number;
  EnergyUsed?: number;
  NetLimit?: number;
  NetUsed?: number;
  freeNetLimit?: number;
  freeNetUsed?: number;
  [key: string]: any;
}

export interface TronFrozenV2 {
  type?: string;
  amount?: number;
  [key: string]: any;
}

export interface TronAccount {
  frozenV2?: TronFrozenV2[];
  frozen?: Array<{
    type?: string;
    frozen_balance?: number;
    [key: string]: any;
  }>;
/*  permissions?: Array<{
    name?: string;
    operations?: string;
    keys?: Array<{
      address?: string;
      weight?: number;
    }>;
    [key: string]: any;
  }>;*/
  [key: string]: any;
}

export interface PermissionItem {
  name: string;
  operations: string[];
  keys: PermissionKey[];
}
export interface PermissionKey {
  address: string;
  weight: number;
}

@Injectable()
export class TronApiClient {
  private readonly logger = new Logger(TronApiClient.name);
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    // 从环境变量读取 Tron 节点地址
    this.baseUrl =
      this.configService.get<string>('TRON_NODE_URL') ||
      'https://api.trongrid.io';
    this.logger.log(`使用 Tron 节点: ${this.baseUrl}`);
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 获取最新区块
   */
  async getNowBlock(): Promise<TronBlock> {
    try {
      const response = await this.httpClient.post<TronApiResponse<TronBlock>>(
        '/wallet/getnowblock',
      );
      if (response.data.Error) {
        throw new Error(response.data.Error);
      }
      return response.data as TronBlock;
    } catch (error) {
      this.logger.error(
        `获取最新区块失败: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * 根据区块号获取区块
   */
  async getBlockByNum(blockNum: number): Promise<TronBlock> {
    try {
      const response = await this.httpClient.post<TronApiResponse<TronBlock>>(
        '/wallet/getblock',
        {
          id_or_num: blockNum.toString(),
          detail: true,
        },
      );
      if (response.data.Error) {
        throw new Error(response.data.Error);
      }
      return response.data as TronBlock;
    } catch (error) {
      this.logger.error(
        `获取区块 ${blockNum} 失败: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
  // 获取地址的账户信息
  async getAccount(address: string): Promise<TronAccount> {
    try {
      const response = await this.httpClient.post<TronApiResponse<any>>(
        '/wallet/getaccount',
        {
          address,
          visible: true,
        },
      );
      if (response.data.Error) {
        throw new Error(response.data.Error);
      }
      return response.data;
    } catch (error) {
      this.logger.error(
        `获取账户信息失败: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
  // 获取地址的账号资源
  async getAccountResource(address: string): Promise<TronAccountResource> {
    try {
      const response = await this.httpClient.post<TronApiResponse<any>>(
        '/wallet/getaccountresource',
        {
          address,
          visible: true,
        },
      );
      if (response.data.Error) {
        throw new Error(response.data.Error);
      }
      return response.data;
    } catch (error) {
      this.logger.error(
        `获取账户资源失败: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
