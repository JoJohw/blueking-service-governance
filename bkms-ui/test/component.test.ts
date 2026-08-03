import { mount } from '@vue/test-utils';
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
import { describe, expect, it } from 'vitest';

import FlexRow from '../src/components/flex-row.vue';

describe('FlexRow.vue', () => {
  it('renders correctly', () => {
    const wrapper = mount(FlexRow);
    expect(wrapper.exists()).toBe(true);
  });

  it('has two div elements', () => {
    const wrapper = mount(FlexRow);
    expect(wrapper.findAll('div')).toHaveLength(3); // One parent div and two child divs
  });

  it('renders left slot content', () => {
    const wrapper = mount(FlexRow, {
      slots: {
        left: '<span>Left Content</span>',
      },
    });
    expect(wrapper.find('div > div:first-child').html()).toContain('Left Content');
  });

  it('renders right slot content', () => {
    const wrapper = mount(FlexRow, {
      slots: {
        right: '<span>Right Content</span>',
      },
    });
    expect(wrapper.find('div > div:last-child').html()).toContain('Right Content');
  });

  it('has correct CSS classes', () => {
    const wrapper = mount(FlexRow);
    expect(wrapper.classes()).toContain('flex');
    expect(wrapper.classes()).toContain('items-center');
    expect(wrapper.classes()).toContain('place-content-between');
  });
});
