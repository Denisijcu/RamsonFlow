import {
  Controller, Get, Post, Body, Param, Headers, HttpException, HttpStatus
} from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('workflows')
@Controller('api/v1')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  // Public endpoint — list available workflows
  @Get('flows')
  @ApiOperation({ summary: 'List all public workflows' })
  listFlows() {
    return this.workflowsService.getPublicFlows();
  }

  @Get('flows/public')
  @ApiOperation({ summary: 'Get public workflow catalog' })
  getPublicFlows() {
    return this.workflowsService.getPublicFlows();
  }

  // HTB VULN: No auth, input passed to eval() — CVE-2025-3248 inspired
  // Attacker can inject: {"flow_id":"ransom_generator","input":"<malicious>"}
  @Post('process')
  @ApiOperation({ summary: 'Process a workflow with AI input' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        flow_id: { type: 'string', example: 'ransom_generator' },
        input: { type: 'string', example: 'Generate ransom note for file://data' },
      },
    },
  })
  async processWorkflow(@Body() body: { flow_id: string; input: string }) {
    if (!body.flow_id || !body.input) {
      throw new HttpException('flow_id and input required', HttpStatus.BAD_REQUEST);
    }
    // HTB VULN: input is passed unsanitized to LLM which executes tool calls
    return this.workflowsService.processFlow(body.flow_id, body.input);
  }

  // SSRF vector — fetches internal config URL
  @Get('config')
  @ApiOperation({ summary: 'Get platform configuration' })
  async getConfig(@Headers('x-internal-token') token: string) {
    // HTB VULN: weak token check + returns internal service URLs
    return this.workflowsService.getConfig(token);
  }

  @Get('flows/:id')
  @ApiOperation({ summary: 'Get workflow details' })
  getFlow(@Param('id') id: string) {
    return this.workflowsService.getFlowById(id);
  }
}
