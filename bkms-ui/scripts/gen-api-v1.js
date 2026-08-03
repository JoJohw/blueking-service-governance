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
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */
const fs = require('fs');
const path = require('path');

const { generateFromSwagger } = require('./openapi-v1/generator.cjs');

const swaggerPath = path.resolve(__dirname, '../../bkms-server/docs/apis/swagger.json');
const apiOutputDir = path.resolve(__dirname, '../src/api/modules/v1');
const typeOutputDir = path.resolve(__dirname, '../src/@types/v1');

function writeFiles(outputDir, files) {
  fs.mkdirSync(outputDir, { recursive: true });

  for (const [fileName, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(outputDir, fileName), content);
  }
}

function main() {
  const swagger = JSON.parse(fs.readFileSync(swaggerPath, 'utf-8'));
  const files = generateFromSwagger(swagger);

  writeFiles(apiOutputDir, files.apiFiles);
  writeFiles(typeOutputDir, files.typeFiles);

  console.log(`v1 API 文件已生成：${apiOutputDir}`);
  console.log(`v1 类型文件已生成：${typeOutputDir}`);
}

main();
