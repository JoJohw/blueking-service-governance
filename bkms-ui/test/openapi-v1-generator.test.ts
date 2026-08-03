/*
 * Tencent is pleased to support the open source community by making
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) is licensed under the MIT License.
 *
 * License for 蓝鲸智云PaaS平台 (BlueKing PaaS):
 *
 * ---------------------------------------------------
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

describe('OpenAPI v1 API 生成器', () => {
  it('生成包含详细注释的类型文件和 API 文件', () => {
    const { generateFromSwagger } = require('../scripts/openapi-v1/generator.cjs');

    const swagger = {
      swagger: '2.0',
      info: {
        title: 'bkms-server Gin API',
        version: '1.0',
      },
      basePath: '/bkms/v1/bkms-server',
      paths: {
        '/apps/{appID}/deploy-statuses': {
          get: {
            tags: ['app'],
            summary: '查询应用在各环境及各泳道上的部署状态',
            description: '返回默认泳道和自定义泳道的部署状态。',
            parameters: [
              {
                name: 'appID',
                in: 'path',
                required: true,
                type: 'string',
                description: '应用 ID',
              },
            ],
            responses: {
              200: {
                description: 'OK',
                schema: {
                  $ref: '#/definitions/serializer.GetAppDeployStatusesOutput',
                },
              },
            },
          },
        },
      },
      definitions: {
        'serializer.GetAppDeployStatusesOutput': {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              description: '应用部署状态列表',
              type: 'array',
              items: {
                $ref: '#/definitions/serializer.AppDeployedEnvOutputObj',
              },
            },
          },
        },
        'serializer.AppDeployedEnvOutputObj': {
          type: 'object',
          properties: {
            deployStatus: {
              description: '部署状态',
              type: 'string',
            },
          },
        },
      },
    };

    const files = generateFromSwagger(swagger);

    expect(files.typeFiles['app.d.ts']).toContain('export interface GetAppDeployStatusesOutput');
    expect(files.typeFiles['app.d.ts']).toContain('* 应用部署状态列表');
    expect(files.typeFiles['app.d.ts']).toContain('data: AppDeployedEnvOutputObj[];');
    expect(files.apiFiles['app.ts']).toContain("import type { NoInfer } from '~/api/ts-helpers';");
    expect(files.apiFiles['app.ts']).toContain("import { v1Fetch } from '~/api/clients';");
    expect(files.apiFiles['app.ts']).toContain('* 查询应用在各环境及各泳道上的部署状态');
    expect(files.apiFiles['app.ts']).toContain('* 返回默认泳道和自定义泳道的部署状态。');
    expect(files.apiFiles['app.ts']).toContain('* @path /apps/{appID}/deploy-statuses');
    expect(files.apiFiles['app.ts']).toContain('* @param appID path string required 应用 ID');
    expect(files.apiFiles['app.ts']).toContain(
      'getAppDeployStatuses: async <Request extends GetAppDeployStatusesRequest = GetAppDeployStatusesRequest',
    );
    expect(files.apiFiles['app.ts']).toContain('params?: NoInfer<Request>,');
    expect(files.apiFiles['app.ts']).toContain(
      "await v1Fetch.get<Request, ResponseData>('/apps/{appID}/deploy-statuses')",
    );
  });
});
