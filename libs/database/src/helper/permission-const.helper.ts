/**
 * 对标 PHP PermissionConstHelper
 * @see php-tron项目/common/helpers/PermissionConstHelper.php
 */
export const PERMISSION_CODE = {
  // 账户操作类
  PER_ACCOUNT_CREATE_CONTRACT: 0, // 创建账户
  PER_TRANSFER_CONTRACT: 1, // 转账 TRX
  PER_TRANSFER_ASSET_CONTRACT: 2, // 转账 TRC10 资产
  PER_VOTE_ASSET_CONTRACT: 3, // 资产投票
  PER_VOTE_WITNESS_CONTRACT: 4, // 对超级代表投票
  PER_WITNESS_CREATE_CONTRACT: 5, // 创建超级代表
  PER_ASSET_ISSUE_CONTRACT: 6, // 发行 TRC10 资产
  PER_WITNESS_UPDATE_CONTRACT: 8, // 更新超级代表信息
  PER_PARTICIPATE_ASSET_ISSUE_CONTRACT: 9, // 参与资产发行
  PER_ACCOUNT_UPDATE_CONTRACT: 10, // 更新账户信息
  PER_FREEZE_BALANCE_CONTRACT: 11, // 冻结余额（质押）
  PER_UNFREEZE_BALANCE_CONTRACT: 12, // 解冻余额
  PER_WITHDRAW_BALANCE_CONTRACT: 13, // 提现奖励/投票收益
  PER_UNFREEZE_ASSET_CONTRACT: 14, // 解冻资产
  PER_UPDATE_ASSET_CONTRACT: 15, // 更新资产信息
  PER_PROPOSAL_CREATE_CONTRACT: 16, // 创建治理提案
  PER_PROPOSAL_APPROVE_CONTRACT: 17, // 通过/批准治理提案
  PER_PROPOSAL_DELETE_CONTRACT: 18, // 删除治理提案
  PER_SET_ACCOUNT_ID_CONTRACT: 19, // 设置账户 ID

  // 自定义合约类
  PER_CUSTOM_CONTRACT: 20, // 自定义合约
  PER_CREATE_SMART_CONTRACT: 30, // 创建智能合约
  PER_TRIGGER_SMART_CONTRACT: 31, // 触发智能合约
  PER_GET_CONTRACT: 32, // 查询合约
  PER_UPDATE_SETTING_CONTRACT: 33, // 更新合约设置
  PER_CLEAR_ABI_CONTRACT: 48, // 清除合约 ABI

  // 交易所操作类
  PER_EXCHANGE_CREATE_CONTRACT: 41, // 创建去中心化交易所
  PER_EXCHANGE_INJECT_CONTRACT: 42, // 向交易所注入流动性
  PER_EXCHANGE_WITHDRAW_CONTRACT: 43, // 从交易所提取流动性
  PER_EXCHANGE_TRANSACTION_CONTRACT: 44, // 在交易所撮合交易

  // 能量与资源操作类
  PER_UPDATE_ENERGY_LIMIT_CONTRACT: 45, // 更新能量限制
  PER_ACCOUNT_PERMISSION_UPDATE_CONTRACT: 46, // 更新账户权限配置
  PER_UPDATE_BROKERAGE_CONTRACT: 49, // 更新手续费/佣金配置
  PER_SHIELDED_TRANSFER_CONTRACT: 51, // 隐私转账（Shielded Transfer）
  PER_MARKET_SELL_ASSET_CONTRACT: 52, // 市场挂单卖出资产
  PER_MARKET_CANCEL_ORDER_CONTRACT: 53, // 取消市场挂单
  PER_FREEZE_BALANCE_V2_CONTRACT: 54, // 冻结余额（V2 资源模型）
  PER_UNFREEZE_BALANCE_V2_CONTRACT: 55, // 解冻余额（V2 资源模型）
  PER_WITHDRAW_EXPIRE_UNFREEZE_CONTRACT: 56, // 提取已到期解冻的余额
  PER_DELEGATE_RESOURCE_CONTRACT: 57, // 委托资源（带宽/能量）
  PER_UNDELEGATE_RESOURCE_CONTRACT: 58, // 解除委托资源
  PER_CANCEL_ALL_UNFREEZE_V2_CONTRACT: 59, // 取消所有未完成的 V2 解冻操作
} as const;

export type PermissionCodeKey = keyof typeof PERMISSION_CODE;
export type PermissionCodeValue = (typeof PERMISSION_CODE)[PermissionCodeKey];

/**
 * 对标 PHP PermissionConstHelper::getCodeTexts
 * 这里只返回与业务相关的几个文案，使用英文常量描述。
 */
export function getPermissionCodeTexts(): Record<number, string> {
  return {
    [PERMISSION_CODE.PER_WITHDRAW_BALANCE_CONTRACT]: "Vote withdraw",
    [PERMISSION_CODE.PER_FREEZE_BALANCE_V2_CONTRACT]: "Freeze balance",
    [PERMISSION_CODE.PER_VOTE_WITNESS_CONTRACT]: "Vote",
    [PERMISSION_CODE.PER_DELEGATE_RESOURCE_CONTRACT]: "Delegation",
    [PERMISSION_CODE.PER_UNDELEGATE_RESOURCE_CONTRACT]: "Reclaim",
  };
}
