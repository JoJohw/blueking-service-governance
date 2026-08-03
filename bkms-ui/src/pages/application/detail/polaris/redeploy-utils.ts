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
import { i18n } from '~/modules/i18n';

import type { PolarisConfigOutputObj } from '~/@types/v1/polaris-config';

/** 北极星配置重新部署时的变更项，用于展示新旧值对比 */
export interface PolarisRedeployChange {
  /** 字段标识，如 'servicePort' / 'polarisToken' */
  key: string;
  /** 字段中文标签 */
  label: string;
  /** 当前待部署的新值 */
  newValue?: number | string;
  /** 已部署的旧值，未部署时为空 */
  oldValue?: number | string;
}

/** 格式化配置值用于展示：undefined 或空字符串显示为 '--' */
export function formatPolarisRedeployValue(value?: number | string) {
  return value === undefined || value === '' ? '--' : String(value);
}

/**
 * 获取指定环境下的北极星配置变更列表，用于重新部署时的差异提示
 * @param config 北极星配置对象
 * @param envName 环境名称
 * @returns 变更项数组；环境不在作用域内时返回空数组
 */
export function getPolarisRedeployChanges(config: PolarisConfigOutputObj, envName: string): PolarisRedeployChange[] {
  const state = config.envStates?.[envName];
  const appliedFields = state?.appliedFields ?? null;
  const scopeEnvNames = config.scopeEnvNames || [];
  const inScope = scopeEnvNames.includes(envName);

  if (!inScope) return [];

  // 当前作用域内但没有部署快照，说明关键字段尚未在该环境生效。
  if (!hasAppliedFields(appliedFields)) {
    return buildNotDeployedChanges(config);
  }

  const changes: PolarisRedeployChange[] = [];
  if (String(appliedFields?.servicePort ?? '') !== String(config.servicePort ?? '')) {
    changes.push({
      key: 'servicePort',
      label: i18n.global.t('服务端口'),
      oldValue: appliedFields?.servicePort ?? '--',
      newValue: config.servicePort ?? '--',
    });
  }
  if (
    state?.polarisTokenChanged === true &&
    String(appliedFields?.polarisToken ?? '') !== String(config.polarisToken ?? '')
  ) {
    changes.push({
      key: 'polarisToken',
      label: i18n.global.t('北极星Token'),
      oldValue: appliedFields?.polarisToken || '--',
      newValue: config.polarisToken || '--',
    });
  }
  return changes;
}

/** 当环境尚未部署时，构建仅包含新值的变更列表（无旧值可对比） */
function buildNotDeployedChanges(config: PolarisConfigOutputObj): PolarisRedeployChange[] {
  return [
    {
      key: 'servicePort',
      label: i18n.global.t('服务端口'),
      newValue: config.servicePort ?? '--',
    },
    {
      key: 'polarisToken',
      label: i18n.global.t('北极星Token'),
      newValue: config.polarisToken ?? '--',
    },
  ];
}

/** 判断 appliedFields 是否有效（非空且有字段），用于判断环境是否已部署过北极星配置 */
function hasAppliedFields(
  fields: NonNullable<PolarisConfigOutputObj['envStates']>[string]['appliedFields'] | null | undefined,
) {
  return !!fields && Object.keys(fields).length > 0;
}
