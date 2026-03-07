import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('chat')
@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // HTB VULN: Prompt injection via history manipulation
  // Injecting ATTACKER_IP in message history triggers reverse shell via tool_call
  @Post()
  @ApiOperation({ summary: 'Chat with RansomFlow AI assistant' })
  async chat(
    @Body() body: { message: string; history?: Array<{ role: string; content: string }> },
    @Headers('authorization') auth: string,
  ) {
    return this.chatService.processChat(body.message, body.history || []);
  }
}
