/**
 * @file inf-ui/x/forms/asForm.es6
 * @author leeight
 */

import _ from 'lodash';
import moment from 'moment';
import {defineComponent} from 'inf-ui/sanx';
import {create} from 'inf-ui/x/components/util';

import {evalExpr} from './ExpressionEvaluator';

const cx = create('as-form');
const cx2 = create('ui-form');
const kFormItemComponents = {};
const kFormItemBuilders = {};

function wrapAsItem(item, prefix, content) {
    return `
    <div class="${cx2('item', 'item-inline')} ${cx2('item-' + item.name)}">
        <div class="${cx2('item-label')}${item.required ? ' required-label' : ''}" s-if="${prefix}.label">
            ${item.label}：
        </div>
        <div class="${cx2('item-content')}">
            ${content}
        </div>
    </div>
    `;
}

function appendList(root, key, value) {
    if (!root[key]) {
        root[key] = [];
    }
    root[key].push(value);
}

function schemaTraversal(controls, cb) {
    _.each(controls, item => {
        if (_.isArray(item)) {
            _.each(item, colItem => cb(colItem));
        }
        else {
            cb(item);
        }
    });
}

function generateTemplate(controls) {
    const template = [];

    _.each(controls, (item, i) => {
        if (_.isArray(item)) {
            template.push(`<div class="${cx('row')}">`);
            _.each(item, (colItem, j) => {
                const builder = kFormItemBuilders[colItem.type];
                if (typeof builder !== 'function') {
                    throw new Error('invalid control type = ' + colItem.type);
                }
                const prefix = `schema[${i}][${j}]`;
                template.push(`<div class="${cx('col')}"
                    s-if="{{!hiddenOn.${colItem.name} && visibleOn.${colItem.name} !== false}}">`);
                template.push(wrapAsItem(colItem, prefix, builder(colItem, prefix)));
                template.push('</div>');
            });
            template.push('</div>');
        }
        else {
            const builder = kFormItemBuilders[item.type];
            if (typeof builder !== 'function') {
                throw new Error('invalid control type = ' + item.type);
            }
            const prefix = `schema[${i}]`;
            template.push(`<div class="${cx('row')}"
                s-if="{{!hiddenOn.${item.name} && visibleOn.${item.name} !== false}}">`);
            template.push(wrapAsItem(item, prefix, builder(item, prefix)));
            template.push('</div>');
        }
    });

    return template.join('\n');
}

export function registerFormItem({type, tagName, Component, builder}) {
    if (kFormItemBuilders[type]) {
        throw new Error(`${type} already registered!`);
    }

    const $tagName = tagName || 'ui-' + type;
    kFormItemComponents[$tagName] = Component;
    kFormItemBuilders[type] = builder;
}

export function asForm(schema) {
    const controls = schema.controls;
    const components = _.extend({}, kFormItemComponents);

    /* eslint-disable */
    const template = `<template>
    <div class="${cx()}">
        <div class="${cx('title')}" s-if="title">
            <h4>{{title}}</h4>
            <slot name="actions" s-if="editable">
                <div class="${cx('title-actions')}">
                    <ui-button on-click="startEditing" s-if="!editing">编辑</ui-button>
                    <ui-button disabled="{{submitting}}" on-click="submit" skin="primary" s-if="editing">{{submitting ? '保存中...' : '保存'}}</ui-button>
                    <ui-button disabled="{{submitting}}" on-click="cancelEditing" s-if="editing">取消修改</ui-button>
                </div>
            </slot>
        </div>
        <div class="${cx2('x')}">${generateTemplate(controls)}</div>
    </div>
    </template>`;
    /* eslint-enable */

    // text, number, select, switch, calendar, uploader
    const Form = defineComponent({
        template,
        components,
        computed: {},
        filters: {
            filename(url) {
                if (!url) {
                    return '';
                }
                const lastSlashIndex = url.lastIndexOf('/');
                try {
                    return decodeURIComponent(url.substr(lastSlashIndex + 1));
                }
                catch (ex) {
                    return url.substr(lastSlashIndex + 1);
                }
            },
            datetime(value, format) {
                if (!format) {
                    format = 'YYYY-MM-DD';    // eslint-disable-line
                }
                return moment(value).format(format);
            }
        },
        initData() {
            return {
                title: null,
                preview: false, // 预览模式
                editing: false, // 编辑状态
                submitting: false, // 提交状态
                editable: false, // 预览模式下是否允许编辑
                schema: controls,
                formData: {},
                visibleOn: {},
                hiddenOn: {}
            };
        },

        inited() {
            // 根据 Name 来快速定位相关的配置
            const itemsMap = {};

            const visibleOn = {};

            // {
            //   当 formData.a 变化的时候，需要重新计算 hiddenOn.b 和 hiddenOn.c 的值
            //   计算的逻辑就参考 schema 里面配置的内容
            //   1. 如果 hiddenOn 是字符串，就从 formData 中获取对应的值
            //   然后按照 js 里面 value to boolean 的逻辑计算结果，通常是 !!this.data.get('formData.$deps');
            //
            //   2. 如果 hiddenOn 是一个对象，那么就需要考虑多种比较的情况了，比如 $in, $nin, $eq, $ne, $gt, $lt, $gte, $lte 等等
            //   实际上是(MongoDb Comparison Query Operators的语法)
            //
            //   'a': ['b', 'c']
            // }
            const hiddenOn = {};

            function appendToMap(item) {
                itemsMap[item.name] = item;

                if (item.visibleOn) {
                    if (_.isString(item.visibleOn)) {
                        appendList(visibleOn, item.visibleOn, item.name);
                    }
                    else if (_.isPlainObject(item.visibleOn)) {
                        _.each(item.visibleOn, (config, key) => appendList(visibleOn, key, item.name));
                    }
                }

                if (item.hiddenOn) {
                    if (_.isString(item.hiddenOn)) {
                        appendList(hiddenOn, item.hiddenOn, item.name);
                    }
                    else if (_.isPlainObject(item.hiddenOn)) {
                        _.each(item.hiddenOn, (config, key) => appendList(hiddenOn, key, item.name));
                    }
                }
            }

            const controls = this.data.get('schema');
            _.each(controls, item => {
                if (_.isArray(item)) {
                    _.each(item, appendToMap);
                }
                else {
                    appendToMap(item);
                }
            });

            this.itemsMap = itemsMap;
            this.visibleOn = visibleOn;
            this.hiddenOn = hiddenOn;

            const triggerKeys = _.uniq([..._.keys(visibleOn), ..._.keys(hiddenOn)]);
            _.each(triggerKeys, name => this.watch(`formData.${name}`, () => this.__refreshRelatedFields(name)));

            this.watch('submitting', submitting => {
                if (!submitting) {
                    this.data.set('editing', false);
                    this.data.set('preview', true);
                }
            });
        },

        attached() {
            _.each(Form.$fields, name => this.__refreshRelatedFields(name));
        },

        __refreshRelatedFields(name) {
            this.nextTick(() => {
                const get = name => this.data.get(`formData.${name}`);
                const scope = {get};

                if (this.visibleOn[name]) {
                    _.each(this.visibleOn[name], itemName => {
                        const expression = this.itemsMap[itemName].visibleOn;
                        this.data.set(`visibleOn.${itemName}`, evalExpr(expression, scope));
                    });
                }

                if (this.hiddenOn[name]) {
                    _.each(this.hiddenOn[name], itemName => {
                        const expression = this.itemsMap[itemName].hiddenOn;
                        this.data.set(`hiddenOn.${itemName}`, evalExpr(expression, scope));
                    });
                }
            });
        },

        getFormKey() {
            const formKey = this.data.get('formKey');
            if (formKey != null) {
                return formKey;
            }

            const bindExpr = this.aNode.binds.get('formData');
            if (bindExpr && bindExpr.x) {
                // 双绑
                return bindExpr.expr.raw;
            }
            else if (bindExpr) {
                return bindExpr.raw;
            }
            throw new Error('Please specify `form-key` prop');
        },

        startEditing() {
            // 保存一下当前数据的快照，如果 cancelEditing 之后，就恢复当时的数据
            this.dataSnapshot = _.pick(this.data.get('formData'), Form.$fields);

            this.data.set('editing', true);
            this.data.set('preview', false);
        },

        cancelEditing() {
            if (this.dataSnapshot) {
                _.each(Form.$fields, name => {
                    if (this.dataSnapshot[name] != null) {
                        this.data.set(`formData.${name}`, this.dataSnapshot[name]);
                    }
                });
                this.dataSnapshot = null;
            }
            this.nextTick(() => {
                this.data.set('editing', false);
                this.data.set('preview', true);
            });
        },

        submit() {
            const formKey = this.getFormKey();
            const formData = _.pick(this.data.get('formData'), Form.$fields);
            this.data.set('submitting', true);
            this.dispatch('submit', {formKey, formData});
        }
    });

    const $fields = [];
    schemaTraversal(controls, item => {
        if (item.name) {
            $fields.push(item.name);
        }
    });
    Form.$fields = $fields;

    return Form;
}