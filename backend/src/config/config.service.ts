import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ConfigService {
  getPlatformConfig() {
    return {
      name: 'RansomFlow',
      version: '1.0.3',
      description: 'AI-powered workflow automation for security simulations',
      features: ['ransom_generation', 'file_encryption', 'threat_analysis'],
      llm_engine: 'LM Studio Local',
      // HTB HINT: internal service mentioned in public config
      storage: 'Internal NFS service (contact admin)',
      docs: '/docs',
    };
  }

  // HTB VULN: SSRF — blindly fetches provided URL
  async fetchUrl(url: string): Promise<any> {
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: { 'X-Internal-Request': 'true' },
      });
      return response.data;
    } catch (err) {
      throw new HttpException(
        { error: 'Failed to fetch config', details: err.message, attempted_url: url },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
