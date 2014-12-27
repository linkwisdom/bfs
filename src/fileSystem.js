/**
 * @file webkit 文件系统接口定义
 * - 按nodejs/FileSystem接口风格实现
 * - 支持callback和promise回调两种方式
 * @author Liandong Liu (liuliandong01@baidu.com)
 */

define(function (require, fileSystem) {
    var logger = window.console;
    var Promise = require('./Chain');
    var FileError = window.FileError;

    // 为了支持更多系统建议自定义绑定系统的Promise对象
    window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

    /**
     * 获取Reader对象
     *
     * @param {string} fs 文件系统对象
     * @param {Object} option 可选择参数
     * @param {Function} callback 回调函数
     */
    function getReader(fs, option, callback) {
        fs.root.getFile(
            option.filename, option,
            function (fileEntry) {
                fileEntry.file(function (file) {
                    var reader = new FileReader();
                    reader.readAsText(file);
                    // 优化大数据量的情况
                    // reader.readAsArrayBuffer(100)
                    callback(reader);
                });
            }
        );
    }

    /**
     * 获取Writer对象
     *
     * @param {string} fs 文件系统对象
     * @param {Object} option 可选择参数
     * @param {Function} callback 回调函数
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
     * 删除文件操作
     *
     * @param {string} fs 文件系统对象
     * @param {Object} option 可选择参数
     * @param {Function} callback 回调函数
     */
    function remove(fs, option, callback) {
        option.create = false;
        fs.root.getFile(
            option.filename, option,
            function (fileEntry) {
                fileEntry.remove(callback);
            }
        );
    }

    /**
     * 读取文件夹
     * @param {FileSystem} fs 文件对象
     * @param {Function} callback 请求回调
     * @return {Promise} 异步链
     */
    function readDir(fs, callback) {
        var dirReader = fs.root.createReader();
        var entries = [];
        var fetchEntries = function() {
            dirReader.readEntries(
                function(results) {
                    if (!results.length) {
                        callback(entries.sort().reverse());
                    }
                    else {
                        Array.prototype.push.apply(entries, results);
                        fetchEntries();
                    }
                },
                function (error) {
                    callback(null, error);
                }
            );
        };
        fetchEntries();
        return (callback = pipeCall(callback)).promise;
    }

    /**
     * 保留错误类型定义
     * @param {Event} e 错误时间对象
     */
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
        }
        logger.error(msg);
    };

    /**
     * 请求持久化文件系统存储空间
     * - 永不删除空间
     * - 可用于持久化备份数据
     * @param {number} size 申请大小
     */
    fileSystem.requestQuota = function (size) {
        navigator.webkitPersistentStorage.requestQuota(
            size || 1024 * 1024 * 30,
            function (grantedBytes) {
                logger.log('grantedBytes = %s', grantedBytes);
            },
            function (error) {
                logger.error(error);
            }
        );
    };

    /**
     * 将callback转发到promise
     * - 回调方式支持callback方式或promise机制
     * @param {Function} callback 回调函数
     * @return {Function}
     */
    function pipeCall(callback) {
        // 如果没有回调函数则支持异步链
        if (!callback) {
            var promise = new Promise();
            callback = function (data, error) {
                if (error) {
                    promise.reject(error);
                }
                else {
                    promise.resolve(data);
                }
            };
            callback.promise = promise;
        }
        return callback;
    }

    /**
     * 打开一个文件并且读取内容
     * - 通过promise返回响应数据
     *
     * @param {string} filename 文件名
     * @param {Object} option 可选择参数
     * @param {Function} callback 回调函数
     * @return {Promise}
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
                }
                else if (option.forRemove) {
                    remove(fs, option, callback);
                }
                else {
                    getReader(fs, option, callback);
                }
            },
            function (error) {
                callback(null, error);
            }
        );

        return (callback = pipeCall(callback)).promise;
    };

    fileSystem.open = function (filename, handler, callback) {
        window.requestFileSystem(
            window.TEMPORARY,
            1024 * 1024,
            function (fs) {
                handler(fs, callback);
            },
            function (error) {
                callback(null, error);
            }
        );

        return (callback = pipeCall(callback)).promise;
    };

    /**
     * 打开一个文件并且读取内容
     * - 通过promise返回响应数据
     *
     * @param {string} filename 文件名
     * @param {Object} option 可选择参数
     * @param {Function} callback 回调函数
     * @return {Promise}
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

        return (callback = pipeCall(callback)).promise;
    };

    fileSystem.readBuffer = function (filename, option, callback) {
        if (typeof option === 'function') {
            callback = option;
            option = {};
        }

        option = option || {};

        fileSystem.open(
            filename,
            function (fs, callback) {
                fs.root.getFile(
                    filename, option,
                    function (fileEntry) {
                        fileEntry.file(function (file) {
                            var reader = new FileReader();
                            var size = Math.min(file.size, 1024);
                            var blob = file.slice(0, size);
                            // 优化大数据量的情况
                            reader.readAsArrayBuffer(blob);
                            callback(reader);
                        });
                    }
                );
            },
            function (reader, error) {
                var result = [];
                if (error) {
                    callback(null, error);
                    return;
                }
                reader.onload = function loaded(evt) {
                    var buffer = evt.target.result;
                    var content = String.fromCharCode.apply(
                        null,
                        new Uint8Array(buffer) // utf8
                    );
                    result.push(content);
                };

                reader.onloadend = function (e) {
                    callback(result);
                };
            }
        );

        return (callback = pipeCall(callback)).promise;
    };

    /**
     * 删除文件
     * @param {string} filename 文件名
     * @param {Function} callback 回调函数
     * @return {Promise}
     */
    fileSystem.removeFile = function (filename, callback) {
        var option = {forRemove: true};
        fileSystem.openFile(
            filename,
            option,
            function (e, error) {
                if (error) {
                    callback(null, error);
                    return;
                }
                callback(e);
            }
        );

        return (callback = pipeCall(callback)).promise;
    };

    fileSystem.listFiles = function (dirname, callback) {
        var promise = fileSystem.open(dirname, readDir, callback);
        return promise.pipe(function (data) {
            var chain = new Promise();
            var counter = data.length;
            var list = data.map(function (fileEntry) {

                var info = {
                    path: fileEntry.fullPath,
                    name: fileEntry.name,
                    isDir: fileEntry.isDirectory
                };

                fileEntry.file(function (file) {
                    info.size = file.size;
                    counter--;
                    if (counter === 0) {
                        chain.resolve(list);
                    }
                });
                return info;
            });
            return chain;
        });
    };

    /**
     * 打开一个文件并且追加内容
     * - 通过promise返回响应数据
     * - 或者通过callback响应
     *
     * @param {string} filename 文件名
     * @param {string} content 可选择参数
     * @param {Function} callback 回调函数
     * @return {Promise}
     */
    fileSystem.appendFile = function (filename, content, callback) {
        return fileSystem.writeFile(
            filename,
            {forAppend: true, content: content},
            callback
        );
    };

    /**
     * 打开一个文件并且写人内容
     * - 通过promise返回响应数据
     * - 或者通过callback响应
     *
     * @param {string} filename 文件名
     * @param {Object} option 可选择参数
     * @param {Function} callback 回调函数
     * @return {Promise}
     */
    fileSystem.writeFile = function (filename, option, callback) {
        if (typeof option === 'function') {
            callback = option;
            option = '';
        }

        option = option || '';
        if (typeof option === 'string') {
            option = {
                content: option,
                size: option.length * 4
            };
        }

        option.forWrite = true;
        option.exclusive = true;
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

                var blob = option.content;
                if (!(blob instanceof Blob)) {
                    blob = new Blob([blob], {type: 'text/plain'});
                }

                // 文件追加方式血
                if (option.forAppend) {
                    writer.seek(writer.length);
                }

                writer.write(blob);
            }
        );

        return (callback = pipeCall(callback)).promise;
    };

    return fileSystem;
});
