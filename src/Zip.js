/**
 * @file Zip文件压缩
 * - 本文件是只做了文件api封装
 * - 采用开源项目jsZip压缩文件
 * - 采用开源项目saveAs下载文件
 *
 * @author Liandong Liu (liuliandong01@baidu.com)
 */

define(function (require, exports) {
    var Zip = require('./vendor/jszip');
    var fs = require('./fileSystem');

    /**
     * 添加文件到压缩包中
     *
     * @param {string} fileName 文件名
     * @param {string} content  文件内容
     * @return {Object}
     */
    Zip.prototype.addFile = function (fileName, content) {
        var ss = fileName.split('/');
        fileName = ss.pop();
        var dirName = ss.join('/');
        var folder = this;
        if (dirName) {
            folder = this.folder(dirName);
        }

        if (Array.isArray(content)) {
            content = content.map(function (item) {
                return JSON.stringify(item);
            }).join('\n');
        }
        else if (typeof content === 'object') {
            content = JSON.stringify(content);
        }
        folder.file(fileName, content);
        return this;
    };

    /**
     * 存储为
     * - 存储到文件系统
     *
     * @param  {string}   zipName  压缩包名称
     * @param  {Function} callback 回调名称
     * @return {Promise}
     */
    Zip.prototype.saveAs = function (zipName, callback) {
        var content = this.generate(
            {
                type: 'blob',
                compression: 'DEFLATE'
            }
        );
        return fs.writeFile(zipName, content, callback);
    };

    /**
     * 存储为
     * - 以下载方式存储文件
     *
     * @param  {string} zipName  压缩包名称
     */
    Zip.prototype.downloadAs = function (zipName) {
        var content = this.generate(
            {
                type: 'blob',
                compression: 'DEFLATE'
            }
        );
        fs.saveAs(content, zipName);
    };
    return Zip;
});
