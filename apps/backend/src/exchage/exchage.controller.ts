import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { PaginationResponseDto } from "../common";
import { ExchangeService } from "./exchage.service";
import { Exchange } from "@database/index";
import { ExchangeSearchDto } from "./dto/exchage-search.dto";

@ApiTags("U换T交易管理")
@ApiBearerAuth("Bearer")
@Controller("exchange")
export class ExchangeController {
  constructor(private readonly exchangeService: ExchangeService) {}

  @Get("records")
  @ApiOperation({
    summary: "获取U换T交易列表（分页）",
    description:
      "获取U换T交易列表\n\n" +
      "**搜索字段**：\n" +
      "- txID: 交易hash（支持 transferInTxId 或 transferOutTxId）\n" +
      "- fromAddr: 发送地址（模糊搜索）\n" +
      "- toAddr: 接收地址（模糊搜索）\n" +
      "- startAt: 开始时间（Unix时间戳）\n" +
      "- endAt: 结束时间（Unix时间戳）\n",
  })
  async findAll(
    @Query() query: ExchangeSearchDto
  ): Promise<PaginationResponseDto<Exchange>> {
    const page = Number(query.page ?? 1);
    const pageSize = Number(query.pageSize ?? 10);

    const { list, total } = await this.exchangeService.findAll(
      page,
      pageSize,
      query
    );

    return new PaginationResponseDto(list, page, pageSize, total);
  }
}
