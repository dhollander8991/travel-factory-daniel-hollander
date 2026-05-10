import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { VacationRequest } from '../entities/VacationRequest';
import { User } from '../entities/User';
import { UserRole } from '@org/shared';
import { AppError } from '../middleware/errorHandler';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const chat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messages, userId, language } = req.body as {
      messages: ChatMessage[];
      userId: string;
      language: string;
    };

    if (!process.env.ANTHROPIC_KEY) {
      throw new AppError(500, 'AI service not configured', 'MISSING_API_KEY');
    }

    const userRepo = AppDataSource.getRepository(User);
    const requestRepo = AppDataSource.getRepository(VacationRequest);

    const user = await userRepo.findOne({ where: { id: userId } });
    const isValidator = req.user?.role === UserRole.VALIDATOR;
    const today = new Date().toISOString().split('T')[0];
    const langInstruction = language === 'fr' ? 'Respond in French.' : 'Respond in English.';

    let requests: VacationRequest[];

    if (isValidator) {
      requests = await requestRepo.find({
        relations: { user: true },
        order: { createdAt: 'DESC' },
        take: 50,
      });
    } else {
      requests = await requestRepo.find({
        where: { user: { id: userId } },
        relations: { user: true },
        order: { createdAt: 'DESC' },
      });
    }

    const requestsSummary = requests.map((r) => ({
      id: r.id,
      ...(isValidator ? { employee: r.user?.name } : {}),
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
      reason: r.reason,
      comments: r.comments,
      submittedAt: r.createdAt,
    }));

    const systemPrompt = isValidator
      ? `You are a helpful HR assistant for a vacation management platform. You are assisting ${user?.name ?? 'a manager'}, who is a team manager responsible for reviewing and approving vacation requests.

Today's date: ${today}
${langInstruction}

Team vacation requests (most recent first):
${JSON.stringify(requestsSummary, null, 2)}

Help the manager understand team availability, identify pending approvals, and answer vacation policy questions. Be concise and professional.`
      : `You are a helpful HR assistant for a vacation management platform. You are assisting ${user?.name ?? 'an employee'}, who submits and tracks their own vacation requests.

Today's date: ${today}
${langInstruction}

${user?.name ?? 'Employee'}'s vacation requests:
${JSON.stringify(requestsSummary, null, 2)}

Help this employee check request statuses, plan upcoming time off, and understand vacation policy. Be concise and friendly.`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    });

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.json().catch(() => ({}));
      throw new AppError(502, `AI service error: ${(errBody as any)?.error?.message ?? anthropicRes.statusText}`, 'AI_ERROR');
    }

    const data = await anthropicRes.json() as { content: Array<{ type: string; text: string }> };
    const reply = data.content.find((b) => b.type === 'text')?.text ?? '';

    res.status(200).json({ reply });
  } catch (error) {
    next(error);
  }
};
