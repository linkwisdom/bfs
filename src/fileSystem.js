/**
 * @file webkit 文件系统接口定义
 * - 按nodejs/FileSystem接口风格实现
 * - 支持callback和promise回调两种方式
 * @author Liandong Liu (liuliandong01@baidu.com)
 */
 
define(function (require, fileSystem) {
    // 为了支持更多系统建议自定义绑定系统的Deferred对象
    var Deferred = window.Deferred || (window.$ && $.Deferred);
    
    window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

    // 保留错误类型定义
    fileSystem.onError = function (e) {
        var msg = '';
        switch (e.code) {
            case FileError.QUOTA_EXCEEDED_ERR:
              msg = 'QUOTA_EXCEEDED_ERR';
              break;
            case FileError.NOT_FOUND_ERR:
              msg = 'NOT_FOUND_ERR';
              break;
            case FileError.SECURITY_ERR:
              msg = 'SECURITY_ERR';
              break;
            case FileError.INVALID_MODIFICATION_ERR:
              msg = 'INVALID_MODIFICATION_ERR';
              break;
            case FileError.INVALID_STATE_ERR:
              msg = 'INVALID_STATE_ERR';
              break;
            default:
              msg = 'Unknown Error';
              break;
        };
    };

    /**
     * 请求持久化文件系统存储空间
     * - 永不删除空间
     * - 可用于持久化备份数据
     */
    fileSystem.requestQuota = function (size) {
        navigator.webkitPersistentStorage.requestQuota(
            size || 1024 * 1024 * 30,
            function (grantedBytes) {
                console.log('grantedBytes = %s', grantedBytes);
            },
            function (error) {
                console.error(error);
            }
        );
    };

    /**
     * 获取FileReader
     * 回调函数获取
     * 
     * @param {FileSystem} fs
     * @param {Object} option
     * @param {Function(@FileWriter)} callback
     */
    function getReader(fs, option, callback) {
        fs.root.getFile(
            option.filename, option,
            function (fileEntry) {
                fileEntry.file(function (file) {
                    var reader = new FileReader();
                    reader.readAsText(file);
                    callback(reader);
                });
            }
        );
    }

    /**
     * 获取FileWriter
     * 回调函数获取
     * 
     * @param {FileSystem} fs
     * @param {Object} option
     * @param {Function(@FileWriter)} callback
     */
    function getWriter(fs, option, callback) {
        option.create = true;

        fs.root.getFile(
            option.filename, option,
            function (fileEntry) {
                fileEntry.createWriter(callback);
            }
        );
    }

    /**
     * 将callback转发到promise
     * - 回调方式支持callback方式或promise机制
     * 
     * @param {Function} callback
     * @return {Function}
     */
    function pipeCall(callback) {
        // 如果没有回调函数则支持异步链
        if (!callback) {
            var def = new Deferred();
            callback = function (data, error) {
                if (error) {
                    def.reject(error);
                } else {
                    def.resolve(data);
                }
            };
            callback.deferred = def;
        }
        return callback;
    }

    /**
     * 打开一个文件并且读取内容
     * - 通过promise返回响应数据
     * 
     * @param {string} filename 文件名
     * @param {Object} option 可选择参数
     * @return {Deferred}
     */
    fileSystem.openFile = function (filename, option, callback) {
        if (typeof option === 'function') {
            callback = option;
            option = {};
        }

        option = option || {};

        option.filename = filename;

        window.requestFileSystem(
            window.TEMPORARY,
            option.size || 1024 * 1024,
            function (fs) {
                if (option.forWrite) {
                    getWriter(fs, option, callback);
                } else {
                    getReader(fs, option, callback);
                }
            },
            function (error) {
                callback(null, error);
            }
        );

        return (callback = pipeCall(callback)).deferred;
    };

    /**
     * 打开一个文件并且读取内容
     * - 通过promise返回响应数据
     * 
     * @param {string} filename 文件名
     * @param {Object} option 可选择参数
     * @return {Deferred}
     */
    fileSystem.readFile = function (filename, option, callback) {
        if (typeof option === 'function') {
            callback = option;
            option = {};
        }

        option = option || {};

        fileSystem.openFile(
            filename,
            option,
            function (reader, error) {
                if (error) {
                    callback(null, error);
                    return;
                }
                
                reader.onloadend = function (e) {
                    callback(this.result);
                };
            }
        );

        return (callback = pipeCall(callback)).deferred;
    };

    /**
     * 打开一个文件并且读取内容
     * - 通过promise返回响应数据
     * - 或者通过callback响应
     * 
     * @param {string} filename 文件名
     * @param {Object} option 可选择参数
     * @return {Deferred}
     */
    fileSystem.writeFile = function (filename, option, callback) {
        if (typeof option === 'function') {
            callback = option;
            option = '';
        }

        option = option || '';
        
        if (typeof option == 'string') {
            option = {
                content: option,
                size: option.length * 2 + 100
            };
        }

        option.forWrite = true;
        
        fileSystem.openFile(
            filename,
            option,
            function (writer, error) {
                if (error) {
                    callback(null, error);
                    return;
                }
                
                writer.onwriteend = function (e) {
                    callback(e);
                };

                writer.onerror = function (error) {
                    callback(null, error);
                };

                if (option.content instanceof Blob) {
                    writer.write(option.content);
                } else {
                    var blob = new Blob([option.content], { type: 'text/plain' });
                    writer.write(blob);
                }
            }
        );

        return (callback = pipeCall(callback)).deferred;
    };

    return fileSystem;
});
