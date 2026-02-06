import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiSecurity,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UsersService } from "./users.service"; 

@ApiTags("用户")
@ApiSecurity("X-Access-Token")
@ApiBearerAuth("Bearer")    
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: "用户列表" })
  async list() {
    return this.usersService.listAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "根据 ID 获取用户详情" })
  async findById(@Param("id", ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }
}
