/**
 * 节点执行器注册入口（服务端专用）
 *
 * 此文件仅在 executor.ts（服务端执行引擎）中被导入，
 * 不会进入客户端 bundle。
 *
 * 添加新节点的 executor：import → nodeRegistry.registerExecutor()
 */
import { nodeRegistry } from '../node-registry';
import { actionExecutor } from './action.executor';
import { imExecutor } from './im.executor';
import { switchExecutor } from './switch.executor';
import { loopExecutor } from './loop.executor';
import { mergeExecutor } from './merge.executor';
import { tryCatchExecutor } from './try-catch.executor';
import { assignExecutor } from './assign.executor';
import { aggregateExecutor } from './aggregate.executor';
import { codeExecutor } from './code.executor';
import { templateExecutor } from './template.executor';
import { emailExecutor } from './email.executor';
import { botNotifyExecutor } from './bot-notify.executor';
import { createDocExecutor } from './create-doc.executor';
import { createTaskExecutor } from './create-task.executor';
import { calendarEventExecutor } from './calendar-event.executor';
import { uploadFileExecutor } from './upload-file.executor';
import { approvalExecutor } from './approval.executor';

// ---- 注册 ----

// 已有
nodeRegistry.registerExecutor('action', actionExecutor);
nodeRegistry.registerExecutor('im_message', imExecutor);

// 流程控制
nodeRegistry.registerExecutor('switch', switchExecutor);
nodeRegistry.registerExecutor('loop', loopExecutor);
nodeRegistry.registerExecutor('merge', mergeExecutor);
nodeRegistry.registerExecutor('try_catch', tryCatchExecutor);

// 数据转换
nodeRegistry.registerExecutor('assign', assignExecutor);
nodeRegistry.registerExecutor('aggregate', aggregateExecutor);
nodeRegistry.registerExecutor('code', codeExecutor);
nodeRegistry.registerExecutor('template', templateExecutor);

// 通知
nodeRegistry.registerExecutor('email', emailExecutor);
nodeRegistry.registerExecutor('bot_notify', botNotifyExecutor);

// 飞书生态
nodeRegistry.registerExecutor('create_doc', createDocExecutor);
nodeRegistry.registerExecutor('create_task', createTaskExecutor);
nodeRegistry.registerExecutor('calendar_event', calendarEventExecutor);
nodeRegistry.registerExecutor('upload_file', uploadFileExecutor);
nodeRegistry.registerExecutor('approval', approvalExecutor);
