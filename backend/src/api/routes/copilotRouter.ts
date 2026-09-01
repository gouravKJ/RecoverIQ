import { Router } from 'express';
import { copilotService } from '../../modules/copilot/CopilotService';
import { z } from 'zod';

export const copilotRouter = Router();

const copilotRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  conversationId: z.string().optional(),
  context: z
    .object({
      transactionId: z.string().optional(),
    })
    .optional(),
});

copilotRouter.post('/chat', async (req, res) => {
  try {
    const parsed = copilotRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: { message: 'Invalid request body', details: parsed.error.format() } });
    }

    const response = await copilotService.handleChat(parsed.data);
    res.json({ data: response });
  } catch (err) {
    res.status(500).json({ error: { message: err instanceof Error ? err.message : 'Copilot error' } });
  }
});
