/**
 * @file Promise 扩展支持then与done
 * 支持异步resolve, 支持链式扩展
 *
 * @author Liandong Liu (liuliandong01@baidu.com)
 */

define(function (require, exports) {
    var Zip = require('./vendor/jszip');
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
    
    Zip.prototype.saveAs = function (zipName, callback) {
        var content = this.generate(
            {
                type: 'blob',
                compression: 'DEFLATE'
            }
        );
        fs.writeFile(zipName, content, callback);
    };

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
