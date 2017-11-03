/**
 * @file v3/components/Table.es6
 * @author leeight
 */

import _ from 'lodash';
import $ from 'jquery';
import {defineComponent} from 'san';

import {create, hasUnit, nextZindex} from './util';
import Loading from './Loading';
import TableFilter from './TableFilter';

const cx = create('ui-table');

/* eslint-disable */
const template = `<div class="{{mainClass}}" style="{{mainStyle}}" on-scroll="onScroll($event)">
    <table cellpadding="0" cellspacing="0" width="{{tableWidth}}">
        <thead class="${cx('head')}">
            <tr>
                <th class="${cx('hcell', 'hcell-sel')}" s-if="select === 'multi'">
                    <div class="${cx('hcell-text')}">
                        <input disabled="{{disabledSelectAll || loading}}"
                            checked="{=selectAll=}"
                            on-click="onSelectAllClicked($event)"
                            value="all"
                            type="checkbox"
                            class="${cx('select-all')}" />
                    </div>
                </th>
                <th class="${cx('hcell', 'hcell-sel')}" s-if="select === 'single'">
                </th>
                <th class="{{col | hcellClass}}"
                    style="{{col | cellStyle}}"
                    s-for="col in tableColumns">
                    <div class="${cx('hcell-text')}">
                        {{col.label}}
                        <div class="${cx('hsort')}" s-if="col.sortable"></div>
                        <ui-table-filter on-change="onFilter($event, col)" s-if="col.filter" options="{{col.filter.options}}" />
                    </div>
                </th>
            </tr>
        </thead>
        <tbody class="${cx('body')}">
            <tr s-if="error">
                <td colSpan="{{columnCount}}" class="${cx('error')}">
                    <slot name="error">{{error}}</slot>
                </td>
            </tr>
            <tr s-elif="!loading && !datasource.length">
                <td colSpan="{{columnCount}}" class="${cx('empty')}">
                    <slot name="empty">{{emptyText}}</slot>
                </td>
            </tr>
            <tr s-else
                class="{{item | rowClass(rowIndex)}}"
                on-mouseenter="onEnterRow(item, rowIndex)"
                on-mouseleave="onLeaveRow(item, rowIndex)"
                s-for="item, rowIndex in datasource">
                <td class="${cx('cell', 'cell-sel')}" s-if="select === 'multi'">
                    <div class="${cx('cell-text', 'cell-sel')}">
                        <input disabled="{=item.xui__disabled=}"
                            checked="{=selectedIndex=}"
                            value="{{rowIndex}}"
                            type="checkbox"
                            class="${cx('multi-select')}" />
                    </div>
                </td>
                <td class="${cx('cell', 'cell-sel')}" s-if="select === 'single'">
                    <div class="${cx('cell-text', 'cell-sel')}">
                        <input disabled="{=item.xui__disabled=}"
                            checked="{=selectedIndex=}"
                            value="{{rowIndex}}"
                            name="{{radioName}}"
                            type="radio"
                            class="${cx('single-select')}" />
                    </div>
                </td>
                <td class="{{col | cellClass}}"
                    style="{{col | cellStyle}}"
                    s-for="col in tableColumns">
                    <div class="${cx('cell-text')}">
                        {{item | tableCell(col.name, col, rowIndex) | raw}}
                    </div>
                </td>
            </tr>
        </tbody>
    </table>
    <div class="${cx('loading')}" s-if="loading"><slot name="loading"><ui-loading /></slot></div>
</div>`;
/* eslint-enable */

export default defineComponent({
    template,
    components: {
        'ui-table-filter': TableFilter,
        'ui-loading': Loading
    },
    computed: {
        mainStyle() {
            return cx.mainStyle(this);
        },
        mainClass() {
            const klass = cx.mainClass(this);
            const loading = this.data.get('loading');
            if (loading) {
                klass.push(cx('state-loading'));
            }
            return klass;
        },
        tableColumns() {
            const schema = this.data.get('schema');
            const tableColumns = _.filter(schema, col => !col.xui__hidden);
            return tableColumns;
        },
        columnCount() {
            const tableColumns = this.data.get('tableColumns');
            const select = this.data.get('select');
            return tableColumns.length + (/^(multi|single)$/.test(select) ? 1 : 0);
        },
        selectAll() {
            const loading = this.data.get('loading');
            const error = this.data.get('error');
            if (loading || error) {
                return [];
            }
            const selectedIndex = this.data.get('selectedIndex');
            return selectedIndex && selectedIndex.length ? ['all'] : [];
        },
        selectedItems() {
            const datasource = this.data.get('datasource');
            const selectedIndex = this.data.get('selectedIndex');
            const selectedItems = _([...selectedIndex])
                .map(i => datasource[i])
                .compact()
                .value();
            return selectedItems;
        }
    },

    filters: {
        rowClass(item, rowIndex) {
            const klass = [cx('row')];
            klass.push(cx(rowIndex % 2 === 0 ? 'row-even' : 'row-odd'));
            return klass;
        },
        cellStyle(item) {
            const style = {};
            // FIXME(leeight) 如果 item.width 发生了变化，实际上这里不会被调用的
            if (item.width != null) {
                style.width = hasUnit(item.width) ? item.width : item.width + 'px';
            }
            return style;
        },
        cellClass(item) {
            const klass = [cx('cell')];
            return klass;
        },
        hcellClass(item) {
            const klass = [cx('hcell')];
            if (item.sortable) {
                klass.push(cx('hcell-sort'));
            }
            if (item.labelClassName) {
                klass.push(item.labelClassName);
            }
            return klass;
        },
        tableCell(item, key, col, rowIndex) {
            const cellBuilder = this.data.get('cellBuilder');
            if (typeof cellBuilder === 'function') {
                return cellBuilder(item, key, col, rowIndex);
            }
            return item[key];
        }
    },

    initData() {
        return {
            schema: [],
            datasource: [],
            selectedIndex: [],
            cellBuilder: null,
            tableWidth: '100%',
            select: 'none',
            disabledSelectAll: false,
            radioName: `e${nextZindex()}`,
            loading: false,
            emptyText: '暂无数据',
            error: null
        };
    },

    dispatchEvent() {
        const {selectedIndex, selectedItems} = this.data.get();
        this.fire('selected-change', {selectedIndex: [...selectedIndex], selectedItems});
    },

    onSelectAllClicked(e) {
        const target = e.target;
        const datasource = this.data.get('datasource');
        const selectedIndex = target.checked
            ? _.range(0, datasource.length)
            : [];

        this.data.set('selectedIndex', _.map(selectedIndex, String));
    },

    inited() {
        const selectedIndex = this.data.get('selectedIndex');
        if (selectedIndex && selectedIndex.length) {
            // 如果是 number 类型的话，匹配不上，需要转成 string 类型
            this.data.set('selectedIndex', _.map(selectedIndex, String));
        }
        this.watch('selectedIndex', () => this.dispatchEvent());
    },

    onEnterRow(item, rowIndex) {
        this.fire('row-enter', {rowIndex});
    },

    onLeaveRow(item, rowIndex) {
        this.fire('row-leave', {rowIndex});
    },

    onFilter(filterItem, colItem) {
        const key = colItem.name;
        const value = filterItem.value;
        this.fire('filter', {[key]: value});
    },

    onScroll(event) {
        this.fire('scroll', event);
    },

    attached() {
        const selectedIndex = this.data.get('selectedIndex');
        if (selectedIndex && selectedIndex.length) {
            this.dispatchEvent();
        }
        $(this.el).on('click', 'a[data-command]', e => {
            // 因为有 head 的存在，rowIndex 是从 1开始的
            const rowIndex = $(e.target).parents('tr').prop('rowIndex');
            const type = $(e.target).data('command');
            const payload = this.data.get(`datasource[${rowIndex - 1}]`);
            this.fire('command', {type, payload, rowIndex, domEvent: e});
        });
    },

    disposed() {
        $(this.el).off('click');
    }
});
