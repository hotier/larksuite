/**
 * 日历事件节点插件
 *
 * 创建飞书日历日程并邀请参会人，支持会议室预定和提醒。
 */

import { Calendar } from 'lucide-react';
import type { WorkflowNode, CalendarEventConfig } from '@/types';
import type { NodePlugin } from '../node-registry';
import CalendarEventNode from '@/app/components/workflow-editor/nodes/CalendarEventNode';

export const calendarEventPlugin: NodePlugin = {
  kind: 'calendar_event',
  rfType: 'calendarEventNode',
  displayName: '日历事件',
  description: '创建飞书日历日程并邀请参会人',
  icon: Calendar,
  color: 'text-green-600',
  bg: 'bg-green-50',
  border: 'border-green-200',
  miniMapColor: '#16a34a',
  category: 'lark_ecosystem',

  defaults: () => ({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    timeSource: 'manual' as const,
    attendees: '[]',
    roomId: '',
    needReminder: true,
    reminderMinutes: 15,
  }),

  component: CalendarEventNode,

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.calendarEventConfig as CalendarEventConfig | undefined;
    return {
      label: wfNode.title,
      title: cfg?.title || '',
      description: cfg?.description || '',
      startTime: cfg?.startTime || '',
      endTime: cfg?.endTime || '',
      timeSource: cfg?.timeSource || 'manual',
      attendees: cfg?.attendees || '[]',
      roomId: cfg?.roomId || '',
      needReminder: cfg?.needReminder ?? true,
      reminderMinutes: cfg?.reminderMinutes ?? 15,
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    calendarEventConfig: {
      title: (data.title as string) || '',
      description: (data.description as string) || '',
      startTime: (data.startTime as string) || '',
      endTime: (data.endTime as string) || '',
      timeSource: (data.timeSource as string) || 'manual',
      attendees: (data.attendees as string) || '[]',
      roomId: (data.roomId as string) || '',
      needReminder: (data.needReminder as boolean) ?? true,
      reminderMinutes: (data.reminderMinutes as number) ?? 15,
    },
  }),
};
