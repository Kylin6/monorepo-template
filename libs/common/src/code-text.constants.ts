export interface CodeTextMappings {
  fundsType: Record<string, string>;
  leaseSource: Record<string, string>;
  leaseStatus: Record<string, string>;
  walletStatus: Record<string, string>;
  walletTypes: Record<string, string>;
  sellStatus: Record<string, string>;
  energyOperation: Record<string, string>;
  resourceTypes: Record<string, string>;
  currencyType: Record<string, string>;
  withdrawStatus: Record<string, string>;
  reclaimTypes: Record<string, string>;
  energyRecordsStatus: Record<string, string>;
  exchangeStatusTexts: Record<string, string>;
  transactionTypes: Record<string, string>;
  transactionStatus: Record<string, string>;
  withdrawType: Record<string, string>;
  leasePlanCate: Record<string, string>;
}

export const CODE_TEXT_MAPPINGS: CodeTextMappings = {
  fundsType: {
    "10": "充值",
    "20": "网页下单",
    "21": "Bot Quick Order",
    "22": "API下单",
    "23": "托管下单",
    "24": "机器人下单",
    "25": "频道下单",
    "27": "快捷指令下单",
    "29": "私域代理",
    "30": "提币",
    "31": "取消提币",
    "35": "托管2.0下单",
    "40": "系统调账",
    "45": "Plan Fee",
    "50": "卖家佣金",
    "51": "订单代扣",
    "52": "笔数代扣",
    "60": "推广佣金",
    "61": "代理佣金",
    "70": "Activity",
    "-10": "取消订单",
  },
  leaseSource: {
    "20": "网页下单",
    "21": "Bot Quick Order",
    "22": "API下单",
    "23": "托管下单",
    "24": "机器人下单",
    "25": "频道下单",
    "26": "赠送带宽",
    "27": "快捷指令下单",
    "29": "私域代理",
    "35": "托管2.0下单",
  },
  leaseStatus: {
    "10": "已付款",
    "15": "已提交",
    "20": "已代理",
    "25": "回收中",
    "26": "代理异常",
    "27": "回收异常",
    "30": "已回收",
    "-10": "已取消",
    "-5": "回收失败",
  },
  walletStatus: {
    "0": "锁定",
    "10": "正常",
  },
  walletTypes: {
    "0": "主钱包",
    "1": "频道闪充地址",
    "2": "TRX充值地址",
    "3": "USDT充值地址",
    "4": "兑换T转出地址",
    "5": "兑换U接收地址",
    "10": "主池钱包",
    "20": "速冲钱包",
    "30": "时长托管钱包",
    "40": "供应钱包",
    "50": "代理过桥钱包",
  },
  sellStatus: {
    "0": "禁售",
    "10": "出售",
  },
  energyOperation: {
    Reclaim: "回收",
    Delegate: "代理",
  },
  resourceTypes: {
    E: "能量",
    B: "带宽",
  },
  currencyType: {
    USDT: "USDT",
    TRX: "TRX",
  },
  withdrawStatus: {
    "0": "等待处理",
    "5": "审核完成",
    "10": "处理中",
    "15": "未知",
    "20": "已完成",
    "-10": "已取消",
    "-20": "已驳回",
  },
  reclaimTypes: {
    "0": "系统回收",
    "20": "手动回收",
    "30": "卖家回收",
  },
  energyRecordsStatus: {
    "0": "未处理",
    "10": "已处理",
    "20": "已忽略",
  },
  exchangeStatusTexts: {
    "0": "等待处理",
    "5": "处理中",
    "6": "未知状态",
    "10": "成功",
  },
  transactionTypes: {
    "0": "未知",
    "10": "充值",
    "20": "提币",
    "30": "U换T转入",
    "40": "U换T转出",
    "50": "闪充入账",
    "51": "Bot Quick Energy",
    "60": "Private Energy",
  },
  transactionStatus: {
    "0": "等待处理",
    "5": "已忽略",
    "10": "已检查",
    "20": "已完成",
  },
  withdrawType: {
    "10": "手动提币",
    "20": "自动提币",
  },
  leasePlanCate: {
    "10": "托管1",
    "20": "托管2",
    "30": "笔数套餐",
  },
};
