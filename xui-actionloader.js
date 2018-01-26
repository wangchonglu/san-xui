define(["san"], function(__WEBPACK_EXTERNAL_MODULE_0__) { return webpackJsonp([6],{

/***/ 0:
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_0__;

/***/ }),

/***/ 391:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_san__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_san___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_san__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_san_xui__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_san_xui_x_components_ActionLoader__ = __webpack_require__(72);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_er_controller__ = __webpack_require__(241);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_er_controller___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_er_controller__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__Row__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__util__ = __webpack_require__(401);
/**
 * @file demos/xui-actionloader.es6
 * @author leeight
 */









__WEBPACK_IMPORTED_MODULE_3_er_controller___default.a.registerAction([
    {
        type: Object(__WEBPACK_IMPORTED_MODULE_5__util__["a" /* createAction */])(),
        path: '/bar/foo/abc'
    },
    {
        type: Object(__WEBPACK_IMPORTED_MODULE_5__util__["a" /* createAction */])(),
        path: '/bar/foo/123'
    }
]);

/* eslint-disable */
const template = `<template>
<xui-toastlabel>
通过 xui-actionloader 可以让 San Page 复用之前遗留的 ER Action，本质上跟之前的 ef/ActionPanel 是一样的思路.
</xui-toastlabel>
<br />

<x-row label="[default]">
    <xui-actionloader
        url="/foo/bar/abc"
    />
</x-row>

<x-row label="url=/bar/foo/abc">
    <div>
        <xui-button on-click="switchTo('/bar/foo/abc')">/bar/foo/abc</xui-button>
        <xui-button on-click="switchTo('/bar/foo/123')">/bar/foo/123</xui-button>
    </div>
    <br />
    <xui-actionloader url="{=action.url=}" />
</x-row>

</template>`;
/* eslint-enable */

/* harmony default export */ __webpack_exports__["default"] = (Object(__WEBPACK_IMPORTED_MODULE_0_san__["defineComponent"])({
    template,
    components: {
        'x-row': __WEBPACK_IMPORTED_MODULE_4__Row__["a" /* default */],
        'xui-button': __WEBPACK_IMPORTED_MODULE_1_san_xui__["e" /* Button */],
        'xui-toastlabel': __WEBPACK_IMPORTED_MODULE_1_san_xui__["Q" /* ToastLabel */],
        'xui-actionloader': __WEBPACK_IMPORTED_MODULE_2_san_xui_x_components_ActionLoader__["a" /* default */]
    },
    initData() {
        return {
            action: {
                url: '/bar/foo/abc'
            }
        };
    },
    switchTo(url) {
        this.data.set('action.url', url);
    }
}));


/***/ }),

/***/ 401:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = createAction;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_promise__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_promise___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_promise__);
/**
 * @file demos/util.es6
 * @author leeight
 */



class SimpleAction {
    constructor(actionContext) {
        this.context = actionContext;
    }
    enter(actionContext) {
        if (Math.random() > .8) {
            return __WEBPACK_IMPORTED_MODULE_0_promise___default.a.reject(new Error('RANDOM error on entering action...'));
        }

        const container = actionContext.container;
        const containerElement = document.getElementById(container);
        if (containerElement) {
            const now = new Date();
            const url = actionContext.url.toString();
            containerElement.innerHTML = `
                <h1>Simple Action Loaded!</h1>
                <h2>Url: ${url}</h2>
                <h3>Time: ${now}</h3>
            `;
            return __WEBPACK_IMPORTED_MODULE_0_promise___default.a.resolve();
        }
        return __WEBPACK_IMPORTED_MODULE_0_promise___default.a.reject(new Error('No such element, id = ' + container));
    }
}

function createAction(ms = 350) {
    return {
        createRuntimeAction(actionContext) {
            return new __WEBPACK_IMPORTED_MODULE_0_promise___default.a((resolve, reject) => {
                setTimeout(() => resolve(new SimpleAction(actionContext)), ms);
            });
        }
    };
}




/***/ })

},[391])});;