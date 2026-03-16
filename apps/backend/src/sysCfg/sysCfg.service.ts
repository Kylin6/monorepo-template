import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SysCfg as SysCfgEntity } from "@database/index";
import { TronUtils } from "@common/index";

// 本地增强类型，补充实体在声明文件中缺失的字段，避免 TS 报字段不存在
type SysCfg = SysCfgEntity & {
  name: string;
  group: string | null;
  key: string;
  value: string;
  rule: string | null;
  desc: string | null;
  createdAt: number | null;
  updatedAt: number | null;
  status: number;
};

@Injectable()
export class SysCfgService {
  constructor(
    @InjectRepository(SysCfgEntity)
    private sysCfgRepository: Repository<SysCfg>
  ) {}

  /**
   * 根据规则验证值
   * @param value 要验证的值
   * @param rule 验证规则
   * @throws BadRequestException 如果验证失败
   * @returns 如果是数组，返回转换后的字符串；否则返回原值
   */
  private validateValue(
    value: string | string[],
    rule?: string | null
  ): string {
    if (!rule) {
      return Array.isArray(value) ? value.join(",") : value; // 没有规则，直接返回
    }

    const ruleStr = rule.trim();

    // readonly 规则：不允许修改（这个在 update 方法中单独处理）
    if (ruleStr === "readonly") {
      throw new BadRequestException("该配置项为只读，不允许修改");
    }

    // each/<rule> 规则（数组验证）最后将数组转化为字符串用逗号隔开
    if (ruleStr.startsWith("each/")) {
      const innerRule = ruleStr.slice(5); // 去掉 'each/' 前缀
      if (!Array.isArray(value)) {
        throw new BadRequestException("each 规则只能用于数组类型");
      }
      // 验证数组中的每个元素
      for (const item of value) {
        this.validateValue(item, innerRule);
      }
      // 返回转换后的字符串
      return value.join(",");
    }

    // 其他规则只支持字符串
    if (Array.isArray(value)) {
      throw new BadRequestException("该规则不支持数组类型，请使用 each/ 前缀");
    }

    // in/value1/value2/... 规则：值必须在指定列表中
    if (ruleStr.startsWith("in/")) {
      // 支持两种写法：
      // - in/0/10
      // - in/0,10
      const allowedValues = ruleStr
        .split("/")
        .slice(1) // 去掉 'in'
        .flatMap((part) => part.split(",")) // 进一步按逗号拆分
        .map((v) => v.trim())
        .filter((v) => v !== "");
      const strValue = String(value); // 统一转为字符串再比较，兼容 number 传参
      if (!allowedValues.includes(strValue)) {
        throw new BadRequestException(
          `值必须为以下之一: ${allowedValues.join(", ")}`
        );
      }
      return strValue;
    }

    // integer/min:0 或 integer/max:100 规则
    if (ruleStr.startsWith("integer/")) {
      const numValue = Number(value);
      if (!Number.isInteger(numValue) || isNaN(numValue)) {
        throw new BadRequestException("值必须是整数");
      }

      // 检查 min 约束
      const minMatch = ruleStr.match(/min:(\d+)/);
      if (minMatch) {
        const minValue = Number(minMatch[1]);
        if (numValue < minValue) {
          throw new BadRequestException(`值必须大于等于 ${minValue}`);
        }
      }

      // 检查 max 约束
      const maxMatch = ruleStr.match(/max:(\d+)/);
      if (maxMatch) {
        const maxValue = Number(maxMatch[1]);
        if (numValue > maxValue) {
          throw new BadRequestException(`值必须小于等于 ${maxValue}`);
        }
      }

      return value;
    }

    // number/min:0 或 number/max:100 规则（支持小数）
    if (ruleStr.startsWith("number/")) {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        throw new BadRequestException("值必须是数字");
      }

      // 检查 min 约束
      const minMatch = ruleStr.match(/min:([\d.]+)/);
      if (minMatch) {
        const minValue = Number(minMatch[1]);
        if (numValue < minValue) {
          throw new BadRequestException(`值必须大于等于 ${minValue}`);
        }
      }

      // 检查 max 约束
      const maxMatch = ruleStr.match(/max:([\d.]+)/);
      if (maxMatch) {
        const maxValue = Number(maxMatch[1]);
        if (numValue > maxValue) {
          throw new BadRequestException(`值必须小于等于 ${maxValue}`);
        }
      }

      return value;
    }

    // string/minLength:5 或 string/maxLength:100 规则
    if (ruleStr.startsWith("string/")) {
      // 检查 minLength 约束
      const minLengthMatch = ruleStr.match(/minLength:(\d+)/);
      if (minLengthMatch) {
        const minLength = Number(minLengthMatch[1]);
        if (value.length < minLength) {
          throw new BadRequestException(`字符串长度必须大于等于 ${minLength}`);
        }
      }

      // 检查 maxLength 约束
      const maxLengthMatch = ruleStr.match(/maxLength:(\d+)/);
      if (maxLengthMatch) {
        const maxLength = Number(maxLengthMatch[1]);
        if (value.length > maxLength) {
          throw new BadRequestException(`字符串长度必须小于等于 ${maxLength}`);
        }
      }

      return value;
    }

    // 如果规则格式不识别，记录警告但不阻止（向后兼容）
    console.warn(`未知的验证规则格式: ${ruleStr}`);
    return value;
  }

  async findAll(): Promise<SysCfg[]> {
    return await this.sysCfgRepository.find({
      where: { status: 10 },
      order: { id: "ASC" },
    });
  }

  async create(data: {
    name?: string;
    group?: string;
    key: string;
    value: string | string[];
    rule?: string;
    desc?: string;
  }): Promise<SysCfg> {
    // 检查 key 是否已存在
    const existing = await this.sysCfgRepository.findOne({
      where: { key: data.key },
    });
    if (existing) {
      throw new BadRequestException(`配置键 ${data.key} 已存在`);
    }

    // 验证值是否符合规则，并转换为字符串
    const validatedValue = this.validateValue(data.value, data.rule);

    const now = Math.floor(Date.now() / 1000);
    const sysCfg = this.sysCfgRepository.create({
      name: data.name || data.key,
      group: data.group || null,
      key: data.key,
      value: validatedValue,
      rule: data.rule || null,
      desc: data.desc || null,
      status: 10,
      createdAt: now,
      updatedAt: now,
    });

    return await this.sysCfgRepository.save(sysCfg);
  }

  async update(
    id: number,
    key: string,
    data: {
      name?: string;
      group?: string;
      value: string | string[];
      rule?: string;
      desc?: string;
    }
  ): Promise<SysCfg> {
    const sysCfg = await this.sysCfgRepository.findOne({
      where: { id, key },
    });

    if (!sysCfg) {
      throw new NotFoundException(`配置不存在 (id: ${id}, key: ${key})`);
    }

    // 检查是否为只读配置
    if (sysCfg.rule === "readonly") {
      throw new BadRequestException("该配置项为只读，不允许修改");
    }

    // 使用现有的 rule 或新的 rule 进行验证
    const ruleToUse = data.rule !== undefined ? data.rule : sysCfg.rule;

    // 验证值是否符合规则，并转换为字符串
    const validatedValue = this.validateValue(data.value, ruleToUse);

    const now = Math.floor(Date.now() / 1000);
    const updateData: Partial<SysCfg> = {
      value: validatedValue,
      updatedAt: now,
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.group !== undefined) {
      updateData.group = data.group;
    }
    if (data.rule !== undefined) {
      updateData.rule = data.rule;
    }
    if (data.desc !== undefined) {
      updateData.desc = data.desc;
    }

    await this.sysCfgRepository.update({ id }, updateData);

    const updated = await this.sysCfgRepository.findOne({ where: { id } });
    if (!updated) {
      throw new NotFoundException(`配置不存在 (id: ${id})`);
    }
    return updated;
  }

  async getKvList(): Promise<Record<string, string>> {
    // const targetKeys = [
    //   'singleAmount',
    //   'singleBandwidthAmount',
    //   'noUEnergyAmount',
    //   'uRechargeExchange',
    //   'botDurationLeaseCfg',
    //   'botCountPlanCfg',
    //   'energyStakeExchange',
    //   'bandwidthStakeExchange',
    // ] as const;
    const rows = await this.sysCfgRepository.find({
      // where: targetKeys.map((k) => ({ key: k })),
      select: ["key", "value"],
    });

    const result: Record<string, string> = {};
    rows.forEach((row) => {
      if (row.key && row.value) {
        result[row.key] = String(row.value);
      }
    });

    return result;
  }

  /**
   * 重置 U2T 转出 T 地址（重新生成钱包地址）
   * - 生成新钱包并保存私钥文件
   * - 将 sys_cfg 中 key=u2tOutTAddr 的 value 更新为新地址
   */
  async resetTrxOutAddr(): Promise<void> {
    const address = TronUtils.createWallet();

    const row = await this.sysCfgRepository.findOne({
      where: { key: "u2tOutTAddr" },
    });

    if (!row) {
      throw new NotFoundException("配置不存在 (key: u2tOutTAddr)");
    }

    const now = Math.floor(Date.now() / 1000);
    await this.sysCfgRepository.update(
      { id: row.id },
      { value: address, updatedAt: now }
    );
  }
}
