import { NextResponse } from 'next/server';
import { bitableService } from '@/services/feishu-bitable';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, appToken, tableId, recordId, fields, pageSize, pageToken, tableName, folderToken, useUserToken, userToken, tokenExpire } = body;

    if (!action) {
      return NextResponse.json(
        { error: '缺少必要参数: action' },
        { status: 400 }
      );
    }

    if (!appToken && action !== 'listApps' && action !== 'getOAuthUrl') {
      return NextResponse.json(
        { error: '缺少必要参数: appToken' },
        { status: 400 }
      );
    }

    if (useUserToken && userToken) {
      const expireSeconds = tokenExpire ? parseInt(tokenExpire) : 7200;
      const expireTime = Date.now() + expireSeconds * 1000;
      bitableService.setUserAccessToken(userToken, expireTime);
    }

    let result;
    switch (action) {
      case 'getOAuthUrl':
        result = { url: bitableService.getOAuthUrl() };
        break;
      case 'list':
        if (!tableId) {
          return NextResponse.json(
            { error: '查询记录需要提供 tableId 参数' },
            { status: 400 }
          );
        }
        result = await bitableService.listRecords(
          appToken,
          tableId,
          pageSize,
          pageToken,
          useUserToken
        );
        break;
      case 'read':
        if (!tableId || !recordId) {
          return NextResponse.json(
            { error: '读取单条记录需要提供 tableId 和 recordId 参数' },
            { status: 400 }
          );
        }
        result = await bitableService.readRecord(appToken, tableId, recordId, useUserToken);
        break;
      case 'create':
        if (!tableId || !fields) {
          return NextResponse.json(
            { error: '创建记录需要提供 tableId 和 fields 参数' },
            { status: 400 }
          );
        }
        result = await bitableService.createRecord(appToken, tableId, fields, useUserToken);
        break;
      case 'update':
        if (!tableId || !recordId || !fields) {
          return NextResponse.json(
            { error: '更新记录需要提供 tableId、recordId 和 fields 参数' },
            { status: 400 }
          );
        }
        result = await bitableService.updateRecord(appToken, tableId, recordId, fields, useUserToken);
        break;
      case 'delete':
        if (!tableId || !recordId) {
          return NextResponse.json(
            { error: '删除记录需要提供 tableId 和 recordId 参数' },
            { status: 400 }
          );
        }
        result = await bitableService.deleteRecord(appToken, tableId, recordId, useUserToken);
        break;
      case 'listTables':
        result = await bitableService.listTables(appToken, useUserToken);
        break;
      case 'createTable':
        if (!tableName || !fields) {
          return NextResponse.json(
            { error: '创建表格需要提供 tableName 和 fields 参数' },
            { status: 400 }
          );
        }
        result = await bitableService.createTable(appToken, tableName, fields, useUserToken);
        break;
      case 'deleteTable':
        if (!tableId) {
          return NextResponse.json(
            { error: '删除表格需要提供 tableId 参数' },
            { status: 400 }
          );
        }
        result = await bitableService.deleteTable(appToken, tableId, useUserToken);
        break;
      case 'listApps':
        result = await bitableService.listApps(pageSize, pageToken, folderToken, useUserToken);
        break;
      default:
        return NextResponse.json(
          { error: '不支持的操作类型: ' + action },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code) {
      const result = await bitableService.getUserAccessToken(code);
      
      return NextResponse.redirect(new URL(`/?token=${encodeURIComponent(result.accessToken)}&expire=${result.expire}`, request.url));
    }

    return NextResponse.json({ error: '缺少 code 参数' }, { status: 400 });
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
