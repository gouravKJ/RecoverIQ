import { Router } from 'express';
import { aiStatusService } from '../../ai/AIStatusService';
import { aiOrchestrator } from '../../ai/AIOrchestrator';

export const aiRouter = Router();

// GET /api/v1/ai/status
aiRouter.get('/status', (_req, res) => {
  const status = aiStatusService.getStatus();
  res.json({ data: status });
});

// GET /api/v1/ai/transactions/:id
aiRouter.get('/transactions/:id', async (req, res) => {
  try {
    const analysis = await aiOrchestrator.getTransactionAnalysis(req.params.id);
    res.json({ data: analysis });
  } catch (err) {
    res.status(500).json({ error: { message: err instanceof Error ? err.message : 'AI analysis failed' } });
  }
});

// POST /api/v1/ai/transactions/:id/analyze
aiRouter.post('/transactions/:id/analyze', async (req, res) => {
  try {
    await aiOrchestrator.runPreDecisionPipeline(req.params.id);
    await aiOrchestrator.runPostDecisionExplanation(req.params.id);
    const analysis = await aiOrchestrator.getTransactionAnalysis(req.params.id);
    res.json({ data: analysis });
  } catch (err) {
    res.status(500).json({ error: { message: err instanceof Error ? err.message : 'AI re-analysis failed' } });
  }
});

// GET /api/v1/ai/batch/patterns
aiRouter.get('/batch/patterns', async (_req, res) => {
  try {
    const patterns = await aiOrchestrator.getBatchPatternInsights();
    res.json({ data: patterns });
  } catch (err) {
    res.status(500).json({ error: { message: err instanceof Error ? err.message : 'Pattern detection failed' } });
  }
});
