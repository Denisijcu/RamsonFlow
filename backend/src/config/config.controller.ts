import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('config')
@Controller('api/config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get platform configuration' })
  getConfig() {
    return this.configService.getPlatformConfig();
  }

  // HTB VULN: SSRF — fetches arbitrary internal URLs
  // curl "http://10.10.10.10:3000/api/config/fetch?url=http://nfs-storage:5000/admin"
  @Get('fetch')
  @ApiOperation({ summary: 'Fetch remote config from URL (internal use)' })
  @ApiQuery({ name: 'url', description: 'Config URL to fetch', required: true })
  async fetchRemoteConfig(@Query('url') url: string) {
    if (!url) throw new HttpException('url param required', HttpStatus.BAD_REQUEST);
    // HTB VULN: no URL validation, allows fetching any internal service
    return this.configService.fetchUrl(url);
  }
}
