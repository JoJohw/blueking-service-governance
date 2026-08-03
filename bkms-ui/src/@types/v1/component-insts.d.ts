/* eslint-disable */
// gen-api-v1.js 自动生成，请勿手动修改
// 来源：apps/bkms-server/docs/apis/swagger.json
// 模块：component-insts

export type PreviewComponentInstRequest = PreviewComponentInstInput;

export interface PreviewComponentInstInput {
  /**
   * 组件属性值
   */
  properties: Record<string, unknown>;
  /**
   * 组件类型，即组件在市场中的名字，等同于 ComponentDef 的 name
   */
  type: string;
}

export interface PreviewOutput {
  /**
   * patch 预览列表
   */
  patchPreview?: PreviewPatchOutput[];
  /**
   * 渲染后的附加资源列表
   */
  resources?: PreviewResourceOutput[];
}

export interface PreviewPatchOutput {
  /**
   * 预置底稿 YAML
   */
  baseManifest?: string;
  /**
   * 应用全部 patcher 后的 YAML
   */
  patchedManifest?: string;
  /**
   * 被 patch 的目标资源类型；当前固定 GameDeployment
   */
  targetKind?: string;
}

export interface PreviewResourceOutput {
  apiVersion?: string;
  kind?: string;
  /**
   * 渲染后的完整资源 YAML
   */
  manifest?: string;
  name?: string;
}
