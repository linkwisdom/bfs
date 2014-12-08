/**
 * @file 超级编辑器
 * @author Liandong Liu (liuliandong01@baidu.com)
 */

define(function (require, exports) {
    exports = require('./fileSystem');
    exports.jsZip = require('./vendor/jszip');
    exports.saveAs = require('./vendor/FileSaver');
    return exports;
});
