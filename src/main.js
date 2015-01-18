/**
 * @file 入口文件
 *
 * @author Liandong Liu (liuliandong01@baidu.com)
 */

define(function (require, exports) {
    exports = require('./fileSystem');
    exports.saveAs = require('./vendor/FileSaver');
    exports.Zip = require('./Zip');
    return exports;
});
