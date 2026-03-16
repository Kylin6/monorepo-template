import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UnauthorizedException,
  BadRequestException,
  Optional,
  Inject,
} from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { SysCfgService } from "./sysCfg.service";
import { AuthService } from "../auth/auth.service";
import { SysCfg } from "@database/index";
import { SaveCfgDto } from "./dto/save-cfg.dto";
import {
  BaseController,
  CurrentUserInfo,
  OPERATION_LOGGER,
  IOperationLogger,
} from "@common/index";

interface RequestWithAdminUser extends Request {
  adminUser?: {
    id: number;
    username: string;
  };
}

@ApiTags("系统配置管理")
@ApiBearerAuth("Bearer")
@Controller("settings")
export class SysCfgController extends BaseController {
  constructor(
    @Optional()
    @Inject(REQUEST)
    request: (Request & { adminUser?: CurrentUserInfo }) | undefined,
    @Optional()
    @Inject(OPERATION_LOGGER)
    operationLogger: IOperationLogger | undefined,
    private readonly sysCfgService: SysCfgService,
    private readonly authService: AuthService
  ) {
    super(request, operationLogger);
  }

  @Get()
  @ApiOperation({
    summary: "获取所有系统配置",
    description: "获取所有系统配置信息，不分页",
  })
  async findAll(): Promise<SysCfg[]> {
    return await this.sysCfgService.findAll();
  }

  @Post("save-cfg")
  @ApiOperation({
    summary: "添加或编辑系统配置",
    description:
      "添加或编辑系统配置，需要谷歌二次认证。\n\n" +
      "**添加配置**：不提供 id 和 key 参数\n" +
      "**编辑配置**：提供 id 和 key 参数（如：?id=1&key=singleAmount）",
  })
  async saveCfg(
    @Req() req: RequestWithAdminUser,
    @Body() saveCfgDto: SaveCfgDto,
    @Query("id") id?: string,
    @Query("key") key?: string
  ): Promise<SysCfg> {
    // 验证当前用户
    if (!req.adminUser) {
      throw new UnauthorizedException("未授权");
    }

    const userId = req.adminUser.id;

    // 验证谷歌验证码
    const adminUser = await this.authService.findAdminUserById(userId);

    if (!adminUser) {
      throw new UnauthorizedException("用户不存在");
    }

    // const googleSecret = adminUser.googleSecret;
    // if (!googleSecret) {
    //   throw new BadRequestException('该账号未配置二次认证密钥');
    // }

    // const isCodeValid = this.authService.verifyGoogleAuthCode(
    //   googleSecret,
    //   saveCfgDto.gcode,
    // );

    // if (!isCodeValid) {
    //   throw new UnauthorizedException('动态验证码错误');
    // }

    const formData = saveCfgDto.SysCfgForm;

    // 如果有 id 和 key 参数，则是编辑；否则是添加
    if (id && key) {
      const configId = parseInt(id, 10);
      if (isNaN(configId)) {
        throw new BadRequestException("无效的配置ID");
      }
      // 更新配置
      return await this.sysCfgService.update(configId, key, {
        name: formData.name,
        group: formData.group,
        value: formData.value,
        rule: formData.rule,
        desc: formData.desc,
      });
    } else {
      // 创建配置
      return await this.sysCfgService.create({
        name: formData.name,
        group: formData.group,
        key: formData.key,
        value: formData.value,
        rule: formData.rule,
        desc: formData.desc,
      });
    }
  }

  @Get("kv-list")
  @ApiOperation({
    summary: "获取系统配置键值对列表",
    description:
      "获取系统配置键值对列表，返回对象格式 {key: value, key: value}",
  })
  async getKvList(): Promise<Record<string, string>> {
    return await this.sysCfgService.getKvList();
  }

  // 重置T转出地址
  @Post("reset-trx-out-addr")
  @ApiOperation({
    summary: "重置T转出地址（重新生成）",
    description: "重置T转出地址（重新生成）",
  })
  async resetTrxOutAddr() {
    await this.sysCfgService.resetTrxOutAddr();
    return this.success();
  }
}
