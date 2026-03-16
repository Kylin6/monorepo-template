import { Controller, Get } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiSecurity,
  ApiOperation,
} from "@nestjs/swagger";
import { CodeTextService } from "./codeText.service";
import type { CodeTextMappings } from "@common/index";

@ApiTags("代码文本映射")
@ApiSecurity("X-Access-Token")
@ApiBearerAuth("Bearer")
@Controller("code-texts")
export class CodeTextController {
  constructor(private readonly codeTextService: CodeTextService) {}

  @Get()
  @ApiOperation({
    summary: "获取代码文本映射",
    description:
      "获取系统中所有状态码、类型码等的文本映射关系\n\n" +
      "**包含的映射**：\n" +
      "- fundsType: 资金类型\n" +
      "- leaseSource: 订单来源\n" +
      "- leaseStatus: 订单状态\n" +
      "- walletStatus: 钱包状态\n" +
      "- walletTypes: 钱包类型\n" +
      "- sellStatus: 出售状态\n" +
      "- energyOperation: 能量操作\n" +
      "- resourceTypes: 资源类型\n" +
      "- currencyType: 币种类型\n" +
      "- withdrawStatus: 提现状态\n" +
      "- reclaimTypes: 回收类型\n" +
      "- energyRecordsStatus: 能量记录状态\n" +
      "- exchangeStatusTexts: 兑换状态\n" +
      "- transactionTypes: 交易类型\n" +
      "- transactionStatus: 交易状态\n" +
      "- withdrawType: 提现类型\n",
  })
  getCodeTexts(): CodeTextMappings {
    return this.codeTextService.getCodeTexts();
  }
}
