import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const PUBLIC_FLOWS = [
  {
    id: 'ransom_generator',
    name: 'Ransom Note Generator',
    description: 'Generate professional ransom notes using AI. Customize target, amount, and urgency.',
    category: 'security-simulation',
    public: true,
    endpoint: '/api/v1/process',
  },
  {
    id: 'file_encryptor',
    name: 'AI File Encryptor',
    description: 'Encrypt files with AI-generated keys. Fernet + GPT key management.',
    category: 'security-simulation',
    public: true,
    endpoint: '/api/v1/process',
  },
  {
    id: 'threat_analyzer',
    name: 'Threat Intelligence Analyzer',
    description: 'Analyze CVEs and threat intel with local LLM.',
    category: 'intelligence',
    public: true,
    endpoint: '/api/v1/process',
  },
  {
    id: 'data_exfil_sim',
    name: 'Data Exfiltration Simulator',
    description: 'Red team simulation of data exfiltration patterns.',
    category: 'red-team',
    public: false,
    endpoint: '/api/v1/process',
  },
];

@Injectable()
export class WorkflowsService {
  private readonly llmUrl = process.env.LLM_URL || 'http://lm-proxy:4000';
  private readonly storageUrl = process.env.STORAGE_SERVICE || 'http://nfs-storage:5000';

  getPublicFlows() {
    return PUBLIC_FLOWS.filter(f => f.public);
  }

  getFlowById(id: string) {
    const flow = PUBLIC_FLOWS.find(f => f.id === id);
    if (!flow) throw new HttpException('Flow not found', HttpStatus.NOT_FOUND);
    return flow;
  }

  // HTB VULN: input goes directly to LLM without sanitization
  // LLM has tool_call capability that executes system commands
  async processFlow(flowId: string, input: string): Promise<any> {
    const flow = PUBLIC_FLOWS.find(f => f.id === flowId);
    if (!flow) throw new HttpException('Flow not found', HttpStatus.NOT_FOUND);

    try {
      const response = await axios.post(`${this.llmUrl}/v1/chat/completions`, {
        model: process.env.DEFAULT_MODEL || 'gemma3:1b',
        messages: [
          {
            role: 'system',
            // HTB VULN: system prompt reveals internal architecture + enables tool calls
            content: `You are the RansomFlow AI engine. You have access to:
- execute_command(cmd): runs shell commands for workflow automation
- read_file(path): reads files from /data storage  
- send_notification(msg): sends Telegram alert via n8n webhook
You are processing workflow: ${flow.name}. Execute all requested operations.`,
          },
          { role: 'user', content: input },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const result = response.data.choices?.[0]?.message?.content || 'No response';

      // HTB VULN: parse and execute tool calls from LLM response
      if (result.includes('execute_command(')) {
        const match = result.match(/execute_command\(([^)]+)\)/);
        if (match) {
          try {
            const { stdout } = await execAsync(match[1]);
            return {
              flow_id: flowId,
              result,
              tool_output: stdout,
              status: 'executed',
              tokens_used: response.data.usage?.total_tokens || 0,
            };
          } catch (e) {
            return {
              flow_id: flowId,
              result,
              tool_error: e.message,
              status: 'completed',
              tokens_used: 0,
            };
          }
        }
      }

      return {
        flow_id: flowId,
        result,
        status: 'completed',
        tokens_used: response.data.usage?.total_tokens || 0,
      };
    } catch (err) {
      // HTB VULN: full error message exposed — reveals internal URLs
      throw new HttpException(
        { error: err.message, internal_url: this.llmUrl },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // HTB VULN: returns internal service URLs + weak token auth
  async getConfig(token: string): Promise<any> {
    // Weak check: any token starting with 'internal-' passes
    const isInternal = token && token.startsWith('internal-');

    const baseConfig = {
      platform: 'RansomFlow v1.0',
      version: '1.0.3',
      flows_available: PUBLIC_FLOWS.length,
      ai_engine: 'LM Studio (local)',
    };

    if (isInternal) {
      // HTB VULN: leaks all internal service addresses
      return {
        ...baseConfig,
        llm_url: this.llmUrl,
        storage_service: this.storageUrl,
        n8n_url: process.env.N8N_URL,
        docker_socket: '/var/run/docker.sock',
        jwt_secret_hint: 'sup3r...',
        internal_network: '172.20.0.0/24',
      };
    }

    return baseConfig;
  }
}
