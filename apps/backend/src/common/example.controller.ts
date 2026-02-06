import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ResponseDto } from './dto/response.dto';

/**
 * 示例控制器 - 演示统一响应格式的使用
 * 此文件仅用于演示，生产环境可以删除
 */
@ApiTags('响应格式示例')
@Controller('examples')
export class ExampleController {
  /**
   * 示例1: 直接返回数据（最常用）
   * 框架会自动包装成 { errCode: 0, errMsg: '操作成功', data: ... }
   */
  @Get('simple')
  @ApiOperation({ summary: '简单返回数据示例' })
  getSimpleData() {
    return {
      id: 1,
      name: '张三',
      email: 'zhangsan@example.com',
    };
  }

  /**
   * 示例2: 返回数组数据
   */
  @Get('list')
  @ApiOperation({ summary: '返回列表数据示例' })
  getListData() {
    return [
      { id: 1, name: '张三' },
      { id: 2, name: '李四' },
      { id: 3, name: '王五' },
    ];
  }

  /**
   * 示例3: 使用 ResponseDto 自定义成功消息
   */
  @Post('custom-message')
  @ApiOperation({ summary: '自定义成功消息示例' })
  createWithCustomMessage(@Body() data: any) {
    return ResponseDto.success(data, '数据创建成功');
  }

  /**
   * 示例4: 返回空数据
   */
  @Get('empty')
  @ApiOperation({ summary: '返回空数据示例' })
  getEmptyData() {
    return null; // 返回 { errCode: 0, errMsg: '操作成功', data: null }
  }

  /**
   * 示例5: 404错误 - 资源不存在
   */
  @Get('not-found/:id')
  @ApiOperation({ summary: '404错误示例' })
  getNotFound(@Param('id') id: string) {
    throw new NotFoundException(`ID为${id}的资源不存在`);
    // 返回 { errCode: 404, errMsg: 'ID为xxx的资源不存在' }
  }

  /**
   * 示例6: 401错误 - 未授权
   */
  @Get('unauthorized')
  @ApiOperation({ summary: '401错误示例' })
  getUnauthorized() {
    throw new UnauthorizedException('访问令牌已过期，请重新登录');
    // 返回 { errCode: 401, errMsg: '访问令牌已过期，请重新登录' }
  }

  /**
   * 示例7: 400错误 - 参数验证失败
   */
  @Post('bad-request')
  @ApiOperation({ summary: '400错误示例' })
  postBadRequest(@Body() data: { age?: number }) {
    if (!data.age) {
      throw new BadRequestException('年龄参数不能为空');
    }
    if (data.age < 0 || data.age > 150) {
      throw new BadRequestException('年龄必须在0-150之间');
    }
    return ResponseDto.success(data, '验证通过');
  }

  /**
   * 示例8: 409错误 - 资源冲突
   */
  @Post('conflict')
  @ApiOperation({ summary: '409错误示例' })
  postConflict(@Body() data: { email: string }) {
    // 模拟邮箱已存在的情况
    const existingEmails = ['test@example.com', 'admin@example.com'];
    if (existingEmails.includes(data.email)) {
      throw new ConflictException('该邮箱已被注册');
    }
    return ResponseDto.success(data, '注册成功');
  }

  /**
   * 示例9: 分页数据返回
   */
  @Get('pagination')
  @ApiOperation({ summary: '分页数据示例' })
  getPaginationData() {
    return {
      list: [
        { id: 1, name: '商品1' },
        { id: 2, name: '商品2' },
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 100,
        totalPages: 10,
      },
    };
  }

  /**
   * 示例10: 只返回成功消息，不需要data
   */
  @Post('delete/:id')
  @ApiOperation({ summary: '删除操作示例' })
  deleteItem(@Param('id') id: string) {
    // 执行删除操作...
    return ResponseDto.success(null, `ID为${id}的项目已成功删除`);
  }
}
