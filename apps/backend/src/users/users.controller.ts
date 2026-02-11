import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
  Inject,
  Optional,
  Query,
} from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiSecurity,
  ApiBearerAuth,
} from "@nestjs/swagger";
import {
  BaseController,
  CurrentUserInfo,
  OPERATION_LOGGER,
  IOperationLogger,
} from "@common/index";
import { UsersService } from "./users.service";
import { UserSearchDto } from "./dto/user-search.dto";

@ApiTags("用户")
@ApiSecurity("X-Access-Token")
@ApiBearerAuth("Bearer")
@Controller("users")
export class UsersController extends BaseController {
  constructor(
    @Optional()
    @Inject(REQUEST)
    request: (Request & { adminUser?: CurrentUserInfo }) | undefined,
    @Optional()
    @Inject(OPERATION_LOGGER)
    operationLogger: IOperationLogger | undefined,
    private readonly usersService: UsersService
  ) {
    super(request, operationLogger);
  }

  @Get()
  @ApiOperation({ summary: "用户列表（分页 + 搜索）" })
  async list(@Query() query: UserSearchDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;

    this.logOperation("LIST_USERS", {
      page,
      pageSize,
      id: query.id,
      name: query.name,
      startAt: query.startAt,
      endAt: query.endAt,
      status: query.status,
    });

    const { list, total } = await this.usersService.listWithPagination(query);

    return this.success({
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "根据 ID 获取用户详情" })
  async findById(@Param("id", ParseIntPipe) id: number) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException("用户不存在");
    }
    this.logOperation("GET_USER", { id });
    return this.success(user);
  }
}
