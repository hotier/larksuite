/**
 * 节点插件注册入口
 *
 * 在此文件中导入并注册所有节点插件。
 * 添加新节点：import → nodeRegistry.register()
 *
 * 节点生态（借鉴 n8n + Zapier + Temporal）：
 * ┌─────────────────────────────────────────────────────┐
 * │ 触发器 (1)     webhook / scheduled / bitable_event  │
 * ├─────────────────────────────────────────────────────┤
 * │ 流程控制 (6)   filter delay switch loop merge trycatch│
 * ├─────────────────────────────────────────────────────┤
 * │ 数据转换 (4)   assign aggregate code template       │
 * ├─────────────────────────────────────────────────────┤
 * │ 业务动作 (3)   action(CRUD) http_request im_message  │
 * ├─────────────────────────────────────────────────────┤
 * │ 通知消息 (2)   email bot_notify                     │
 * ├─────────────────────────────────────────────────────┤
 * │ 飞书生态 (5)   create_doc task calendar upload approval│
 * ├─────────────────────────────────────────────────────┤
 * │ 核心 (2)       trigger end                          │
 * └─────────────────────────────────────────────────────┘
 */

import { nodeRegistry } from '../node-registry';

// 核心节点
import { triggerPlugin } from './trigger.plugin';
import { endPlugin } from './end.plugin';

// 流程控制
import { filterPlugin } from './filter.plugin';
import { delayPlugin } from './delay.plugin';
import { switchPlugin } from './switch.plugin';
import { loopPlugin } from './loop.plugin';
import { mergePlugin } from './merge.plugin';
import { tryCatchPlugin } from './try-catch.plugin';

// 数据转换
import { assignPlugin } from './assign.plugin';
import { aggregatePlugin } from './aggregate.plugin';
import { codePlugin } from './code.plugin';
import { templatePlugin } from './template.plugin';

// 业务动作
import { actionCreatePlugin, actionReadPlugin, actionUpdatePlugin, actionDeletePlugin } from './action.plugin';
import { httpPlugin } from './http.plugin';
import { imPlugin } from './im.plugin';

// 通知
import { emailPlugin } from './email.plugin';
import { botNotifyPlugin } from './bot-notify.plugin';

// 飞书生态
import { createDocPlugin } from './create-doc.plugin';
import { createTaskPlugin } from './create-task.plugin';
import { calendarEventPlugin } from './calendar-event.plugin';
import { uploadFilePlugin } from './upload-file.plugin';
import { approvalPlugin } from './approval.plugin';

// ---- 注册 ----

// 核心
nodeRegistry.register(triggerPlugin);
nodeRegistry.register(endPlugin);

// 流程控制
nodeRegistry.register(filterPlugin);
nodeRegistry.register(delayPlugin);
nodeRegistry.register(switchPlugin);
nodeRegistry.register(loopPlugin);
nodeRegistry.register(mergePlugin);
nodeRegistry.register(tryCatchPlugin);

// 数据转换
nodeRegistry.register(assignPlugin);
nodeRegistry.register(aggregatePlugin);
nodeRegistry.register(codePlugin);
nodeRegistry.register(templatePlugin);

// 业务动作
nodeRegistry.register(actionCreatePlugin);
nodeRegistry.register(actionReadPlugin);
nodeRegistry.register(actionUpdatePlugin);
nodeRegistry.register(actionDeletePlugin);
nodeRegistry.register(httpPlugin);
nodeRegistry.register(imPlugin);

// 通知
nodeRegistry.register(emailPlugin);
nodeRegistry.register(botNotifyPlugin);

// 飞书生态
nodeRegistry.register(createDocPlugin);
nodeRegistry.register(createTaskPlugin);
nodeRegistry.register(calendarEventPlugin);
nodeRegistry.register(uploadFilePlugin);
nodeRegistry.register(approvalPlugin);
