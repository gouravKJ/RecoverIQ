import { aiService } from '../../ai/AIService';
import { aiStatusService } from '../../ai/AIStatusService';
import { auditTrail } from '../../lib/services';
import { COPILOT_SYSTEM_INSTRUCTIONS, COPILOT_USER_PROMPT } from './CopilotPrompts';
import { copilotResponseSchema } from './CopilotResponseSchema';
import { copilotIntentClassifier } from './CopilotIntentClassifier';
import { copilotContextBuilder } from './CopilotContextBuilder';
import { copilotAnalyticsService } from './CopilotAnalyticsService';
import type { CopilotChatRequest, CopilotChatResponse, CopilotFact } from './types';

export class CopilotOrchestrator {
  async processMessage(request: CopilotChatRequest): Promise<CopilotChatResponse> {
    const conversationId = request.conversationId || 'default_session';
    const message = request.message.trim();

    // 1. Resolve transaction ID
    let contextTxnId = request.context?.transactionId;
    if (!contextTxnId) {
      contextTxnId = copilotContextBuilder.getLastTransactionIdFromMemory(conversationId);
    }

    const { intent, extractedTxnId } = copilotIntentClassifier.classify(message, contextTxnId);
    const activeTxnId = extractedTxnId || contextTxnId;

    // Log query audit event
    await auditTrail.log(
      'COPILOT_QUERY',
      {
        message,
        intent,
        transactionId: activeTxnId,
        conversationId,
      },
      activeTxnId
    );

    const status = aiStatusService.getStatus();

    // 2. Fast-Path System Status Handler
    if (intent === 'SYSTEM_STATUS') {
      const response: CopilotChatResponse = {
        message: `RecoverIQ Revenue Recovery Console is ONLINE.\n- Mode: ${status.mode}\n- LLM Provider: ${status.provider}\n- Model: ${status.model}\n- PolicyGate: Active & Authoritative`,
        intent: 'SYSTEM_STATUS',
        aiMode: status.mode,
        provider: status.provider,
        model: status.model,
        sources: ['System Status Monitor'],
        dataSource: 'System Status Monitor',
        facts: [
          { label: 'System Status', value: 'ONLINE' },
          { label: 'LLM Provider', value: status.provider },
          { label: 'Model', value: status.model },
          { label: 'PolicyGate', value: 'ACTIVE' },
        ],
        suggestedNavigation: [{ label: 'View Dashboard', url: '/dashboard' }],
      };
      copilotContextBuilder.saveMemory(conversationId, message, response.message, intent, activeTxnId, response.facts);
      await auditTrail.log('COPILOT_RESPONSE', { response: response.message, intent }, activeTxnId);
      return response;
    }

    // 3. Assemble Intent-Aware Context from Database & Analytics
    const context = await copilotContextBuilder.buildContext(message, activeTxnId, intent);
    const history = copilotContextBuilder.getMemory(conversationId);

    // 4. Invoke LLM Provider (Groq / MockLLM)
    const provider = aiService.getProvider();
    const isRealLLM = aiService.isUsingRealLLM();
    const mode = isRealLLM ? 'LLM' : 'DETERMINISTIC_FALLBACK';

    const userPrompt = COPILOT_USER_PROMPT.replace('{{{userMessage}}}', message)
      .replace('{{{conversationHistory}}}', JSON.stringify(history, null, 2))
      .replace('{{{contextJson}}}', JSON.stringify(context, null, 2));

    try {
      const llmResult = await provider.generateStructured<any>(
        COPILOT_SYSTEM_INSTRUCTIONS,
        userPrompt,
        copilotResponseSchema
      );

      const nav: { label: string; url: string }[] = llmResult.suggestedNavigation || [];
      if (activeTxnId && !nav.some((n) => n.url.includes(activeTxnId))) {
        nav.push({ label: `Inspect ${activeTxnId}`, url: `/transactions/${activeTxnId}` });
      }

      const facts: CopilotFact[] = llmResult.facts || context.analyticalFacts || [];

      const response: CopilotChatResponse = {
        message: llmResult.message,
        intent: llmResult.intent || intent,
        aiMode: mode,
        provider: provider.name,
        model: provider.model,
        sources: llmResult.sources && llmResult.sources.length > 0 ? llmResult.sources : ['Database Analytics'],
        dataSource: llmResult.dataSource || context.dataSource || 'Database Analytics',
        facts,
        data: llmResult.structuredData,
        suggestedNavigation: nav,
      };

      copilotContextBuilder.saveMemory(
        conversationId,
        message,
        response.message,
        response.intent,
        activeTxnId,
        response.facts
      );
      await auditTrail.log('COPILOT_RESPONSE', { response: response.message, intent: response.intent, mode }, activeTxnId);

      return response;
    } catch (err) {
      await auditTrail.log('COPILOT_FALLBACK', { error: String(err) }, activeTxnId);

      // Intent-Specific Deterministic Fallback Response
      let fallbackMsg = '';
      let facts: CopilotFact[] = context.analyticalFacts || [];

      if (intent === 'TOP_FAILURE_REASON') {
        const topRes = await copilotAnalyticsService.getTopFailureReasons();
        fallbackMsg = `Sabse bada revenue loss ${topRes.primaryCause.replace(/_/g, ' ')} failures ki wajah se hua. Is category mein ${topRes.facts.find(f => f.label === 'Failed Revenue')?.value || ''} ka failed transaction value hai across ${topRes.facts.find(f => f.label === 'Failed Transactions')?.value || 0} transactions (${topRes.facts.find(f => f.label === 'Share of Revenue Loss')?.value || ''}).`;
        facts = topRes.facts;
      } else if (intent === 'TOP_PAYMENT_METHOD_FAILURE') {
        const methodRes = await copilotAnalyticsService.getTopPaymentMethodFailures();
        fallbackMsg = `Sabse zyada failures ${methodRes.topMethod} payment method mein dekhe gaye hain. Total failed amount ${methodRes.facts.find(f => f.label === 'Method Loss Amount')?.value || ''} across ${methodRes.facts.find(f => f.label === 'Failure Count')?.value || 0} transactions hai.`;
        facts = methodRes.facts;
      } else if (intent === 'REVENUE_RECOVERED') {
        const recRes = await copilotAnalyticsService.getRevenueRecovered();
        fallbackMsg = `RecoverIQ ne total ${recRes.recoveredFormatted} revenue recover kiya hai across ${recRes.recoveredCount} transactions (Recovery Success Rate: ${recRes.recoveryRatePercentage}).`;
        facts = recRes.facts;
      } else if (intent === 'REVENUE_AT_RISK') {
        const riskRes = await copilotAnalyticsService.getRevenueAtRisk();
        fallbackMsg = `Total Revenue at Risk ${riskRes.atRiskFormatted} hai across ${riskRes.affectedCount} failed transactions affecting ${riskRes.affectedCustomersCount} customers.`;
        facts = riskRes.facts;
      } else if (activeTxnId) {
        fallbackMsg = `Transaction ${activeTxnId} is registered in RecoverIQ. Based on expected value engine calculations, decision execution strictly adheres to merchant PolicyGate rules.`;
      } else {
        fallbackMsg = `RecoverIQ database analytics summary: Total Revenue at Risk is ${context.analyticalFacts.find(f => f.label === 'Total Revenue at Risk')?.value || '₹6.6L'}, with ${context.analyticalFacts.find(f => f.label === 'Total Revenue Recovered')?.value || '₹5.7L'} recovered.`;
      }

      const fallbackResponse: CopilotChatResponse = {
        message: fallbackMsg,
        intent,
        aiMode: 'DETERMINISTIC_FALLBACK',
        provider: 'MockLLM',
        model: 'deterministic-fallback',
        sources: ['Database Analytics', 'Policy Center'],
        dataSource: 'Database Analytics',
        facts,
        suggestedNavigation: activeTxnId
          ? [{ label: `View ${activeTxnId}`, url: `/transactions/${activeTxnId}` }]
          : [{ label: 'View Dashboard', url: '/dashboard' }],
      };

      copilotContextBuilder.saveMemory(
        conversationId,
        message,
        fallbackResponse.message,
        intent,
        activeTxnId,
        fallbackResponse.facts
      );
      return fallbackResponse;
    }
  }
}

export const copilotOrchestrator = new CopilotOrchestrator();
