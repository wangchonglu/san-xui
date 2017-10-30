/**
 * @file components/Dialog.es6
 * @author leeight
 */
import $ from 'jquery';
import lib from 'esui/lib';
import {nextTick, defineComponent} from 'san';

import {create, nextZindex} from './util';
import Button from './Button';

const cx = create('ui-dialog');

/* eslint-disable */
const template = `<template><div s-if="open" class="{{mainClass}}" style="{{dialogStyle}}">
    <div class="${cx('head', 'head-panel')}" san-if="head">
        <div class="${cx('title')}">
            <slot name="head">Title</slot>
        </div>
        <div class="${cx('close-icon')}" on-click="onCloseDialog"></div>
    </div>
    <div class="${cx('body', 'body-panel')}" style="{{dialogBodyStyle}}">
        <slot />
    </div>
    <div class="${cx('foot', 'foot-panel')}" san-if="foot">
        <slot name="foot">
            <ui-button on-click="onConfirmDialog" skin="primary">确认</ui-button>
            <ui-button on-click="onCloseDialog">取消</ui-button>
        </slot>
    </div>
</div>
<div s-if="open && mask" on-click="onClickMask" class="${cx('mask')}" style="{{maskStyle}}"></div>
</template>`;
/* eslint-enable */

export default defineComponent({
    template,
    components: {
        'ui-button': Button
    },
    initData() {
        return {
            draggable: false,
            closeOnClickMask: false,
            width: 'auto',
            height: 'auto',
            left: null,
            top: null,
            open: false,
            mask: true,
            foot: true,
            head: true
        };
    },
    computed: {
        mainClass() {
            const klass = [cx(), cx('x')];
            const draggable = this.data.get('draggable');
            if (draggable) {
                klass.push('state-draggable');
                klass.push(cx('draggable'));
            }
            const skin = this.data.get('skin');
            if (skin) {
                klass.push('skin-' + skin);
                klass.push('skin-' + skin + '-dialog');
            }
            return klass;
        },
        maskStyle() {
            return {
                'z-index': nextZindex()
            };
        },
        dialogBodyStyle() {
            const styles = {};
            const height = this.data.get('height');
            if (height !== 'auto') {
                styles.height = `${height}px`;
            }
            return styles;
        },
        dialogStyle() {
            const width = this.data.get('width');
            const left = this.data.get('left');
            const top = this.data.get('top');
            const styles = {'opacity': 1, 'z-index': nextZindex() + 1};
            if (width !== 'auto') {
                styles.width = `${width}px`;
            }
            if (left != null) {
                styles.left = left;
            }
            if (top != null) {
                styles.top = top;
            }
            return styles;
        }
    },
    onCloseDialog() {
        this.data.set('open', false);
        this.fire('close');
    },
    onConfirmDialog() {
        this.data.set('open', false);
        this.fire('confirm');
    },
    onClickMask() {
        if (this.data.get('closeOnClickMask')) {
            this.data.set('open', false);
            this.fire('close');
        }
    },
    __resize() {
        const open = this.data.get('open');
        if (!open) {
            return;
        }
        const main = this.el.firstChild;
        const left = Math.max((lib.page.getViewWidth() - main.offsetWidth) / 2, 0);
        const top = lib.page.getScrollTop() + Math.max((lib.page.getViewHeight() - main.offsetHeight) / 2, 0);
        this.data.set('top', top + 'px');
    },
    inited() {
        this.watch('open', () => this.__resize());
    },
    attached() {
        if (this.el.parentNode !== document.body) {
            document.body.appendChild(this.el);
        }
        this.__resize();
    },
    detached() {
        $(this.el).remove();
    }
});
