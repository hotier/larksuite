/**
 * CalendarEvent 日历事件执行器（服务端专用）
 */
import type { WorkflowNode, ExecutionStep } from '@/types';
import type { ExecutionContext, NodeExecutor } from '../node-registry';

export const calendarEventExecutor: NodeExecutor = async (node, ctx) => {
  const cfg = node.calendarEventConfig;
  if (!cfg) {
    return { title: node.title, action: 'calendar_event', success: false, message: '未配置日历事件' };
  }

  let startTime = cfg.startTime;
  let endTime = cfg.endTime;

  if (cfg.timeSource === 'webhook') {
    startTime = String(ctx.webhookContent[cfg.startTime] ?? startTime);
    endTime = String(ctx.webhookContent[cfg.endTime] ?? endTime);
  }

  try {
    const { bitableService } = await import('@/services/feishu-bitable');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svc = bitableService as any;
    if (typeof svc.createCalendarEvent === 'function') {
      const attendeesList = cfg.attendees ? JSON.parse(cfg.attendees) as string[] : [];
      const result = await svc.createCalendarEvent({
        title: cfg.title, description: cfg.description, startTime, endTime,
        attendees: attendeesList, roomId: cfg.roomId,
        needReminder: cfg.needReminder ?? false,
        reminderMinutes: cfg.reminderMinutes ?? 15,
      });
      return {
        title: node.title, action: 'calendar_event', success: true,
        message: `日程已创建: ${cfg.title}`,
        output: result as unknown as Record<string, unknown>,
      };
    }
    return {
      title: node.title, action: 'calendar_event', success: false,
      message: `日历事件功能尚未实现。标题: ${cfg.title}, ${startTime} → ${endTime}`,
      output: { title: cfg.title, startTime, endTime, status: 'not_implemented' },
    };
  } catch (err: unknown) {
    return {
      title: node.title, action: 'calendar_event', success: false,
      message: `创建失败: ${err instanceof Error ? err.message : String(err)}`,
      output: { title: cfg.title, startTime, endTime },
    };
  }
};
