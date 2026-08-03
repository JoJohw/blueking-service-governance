1.注意:VSCode打开项目时，如果出现很多文件标红，可以只打开前端文件目录（bkms-govern\apps下的ui）

2.@blueking/table使用Setting表格设置注意事项，可参考应用管理-构建列表 '~/pages/application/detail/build.vue'
  2.1. 引入tippy样式
  /**
    import 'tippy.js/dist/tippy.css';
    import 'tippy.js/themes/light.css';
   */
  2.2.Table处show-settings设为true
  2.3.Table处settings配置checked,disabled用于字段设置;配置size用于高级设置,表格行高需搭配@setting-change事件使用
  2.4. style增加 .action-tab-wrapper { overflow-y: auto !important } 用于隐藏Tab滚动条（如果有需要的话）

3. yaml文件
   - 安装 VSCode 插件：[YAML (Red Hat)](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)
   - 该插件可自动检测 YAML 文件中的重复 key、格式错误等问题