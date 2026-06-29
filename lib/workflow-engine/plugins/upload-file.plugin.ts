/**
 * 上传文件节点插件
 *
 * 上传文件到飞书云空间指定文件夹。
 */

import { Upload } from 'lucide-react';
import type { WorkflowNode, UploadFileConfig } from '@/types';
import type { NodePlugin } from '../node-registry';
import UploadFileNode from '@/app/components/workflow-editor/nodes/UploadFileNode';

export const uploadFilePlugin: NodePlugin = {
  kind: 'upload_file',
  rfType: 'uploadFileNode',
  displayName: '上传文件',
  description: '上传文件到飞书云空间',
  icon: Upload,
  color: 'text-purple-600',
  bg: 'bg-purple-50',
  border: 'border-purple-200',
  miniMapColor: '#9333ea',
  category: 'lark_ecosystem',

  defaults: () => ({
    fileUrl: '',
    fileSource: 'manual' as const,
    folderToken: '',
    fileName: '',
    fileType: 'auto' as const,
  }),

  component: UploadFileNode,

  deserialize: (wfNode: WorkflowNode) => {
    const cfg = wfNode.uploadFileConfig as UploadFileConfig | undefined;
    return {
      label: wfNode.title,
      fileUrl: cfg?.fileUrl || '',
      fileSource: cfg?.fileSource || 'manual',
      folderToken: cfg?.folderToken || '',
      fileName: cfg?.fileName || '',
      fileType: cfg?.fileType || 'auto',
    };
  },

  serialize: (data: Record<string, unknown>) => ({
    uploadFileConfig: {
      fileUrl: (data.fileUrl as string) || '',
      fileSource: (data.fileSource as string) || 'manual',
      folderToken: (data.folderToken as string) || '',
      fileName: (data.fileName as string) || '',
      fileType: (data.fileType as string) || 'auto',
    },
  }),
};
