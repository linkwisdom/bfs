/**
 * @file 文件系统测试
 * @author Liandong Liu (liuliandong01@baidu.com)
 */

define(function (require, exports) {
    var fs = require('bfs');
    var Chain = require('bfs/Chain');
    var contentPanel = document.querySelector('#edit-panel');
    var showPanel = document.querySelector('#show-panel');
    var blogName = document.querySelector('#blog-name');

    // 文件保存定时器
    var timer = 0;

    // 通过hash获取文件名称
    blogName.value = (location.hash || '#blog.html').substr(1);

    /**
     * 初始化事件
     */
    exports.init = function () {
        var observer = new MutationObserver(function (changes) {
            changes.forEach(function (change) {
                // 只有触发文字变化才保存文本内容
                if (change.type === 'characterData') {
                    clearTimeout(timer);
                    timer = setTimeout(function () {
                        exports.writeFile();
                    }, 500);
                }
            });
        });

        // 通过observer监视文档结构变化
        observer.observe(
            contentPanel,
            {
                attributes: true,
                childList: true,
                subtree: true,
                characterData: true
            }
        );

        // 展现当前文件列表和文件内容
        exports.listFiles();
        exports.readFile();
    };

    /**
     * hash变化，触发重新加载
     */
    window.onhashchange = function () {
        location.reload();
    };

    /**
     * 拖拽删除
     *
     * @param  {Event} evt 拖拽事件
     */
    document.ondragend = function (evt) {
        var target = evt.target;
        // 如果拖拽离开列表区域表示删除
        if (target.href && evt.x > 250) {
            var fname = target.hash.substr(1);
            exports.removeFile(fname).then(function () {
                location.reload();
            });
        }
    };

    /**
     * 显示文件内容
     *
     * @return {Promise}
     */
    Chain.prototype.display = function () {
        return this.promise.then(function (content) {
            contentPanel.innerHTML = content;
        });
    };

    /**
     * 编辑状态信息
     *
     * @param {string} message log信息
     * @return {Promise}
     */
    Chain.prototype.showLog = function (message) {
        var now = new Date();
        var info = [
            message,
            now.getHours(),
            now.getMinutes(),
            now.getSeconds()
        ].join(':');

        return this.promise.then(function (content) {
            showPanel.textContent = info;
        });
    };

    /**
     * 读取文件
     *
     * @return {Promise}
     */
    exports.readFile = function () {
        return fs.readFile(blogName.value).display();
    };

    /**
     * 读取文件文件部分信息
     *
     * @return {Promise}
     */
    exports.readBuffer = function () {
        return fs.readBuffer(blogName.value, {size: 1000}).display();
    };

    /**
     * 展现文件列表
     *
     * @return {Promise}
     */
    exports.listFiles = function () {
        var listPanel = document.querySelector('#file-list .list');
        return fs.listFiles().then(function (files) {
            var list = files.map(function (file) {
                return '<li><a href="#'
                    + file.name
                    + '">'
                    + file.name
                    + '</a></li>';
            });
            listPanel.innerHTML = list.join('');
            return list;
        });
    };

    /**
     * 写入文件
     *
     * @return {Promise}
     */
    exports.writeFile = function () {
        var content = contentPanel.innerHTML;
        var fname = blogName.value;
        return fs.writeFile(fname, content).showLog('写入文件:' + fname);
    };

    /**
     * 删除文件
     *
     * @param {string} fname 文件名
     * @return {Promise}
     */
    exports.removeFile = function (fname) {
        return fs.removeFile(fname).showLog('删除文件: ' + fname);
    };

    exports.init();
});
