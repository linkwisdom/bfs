/**
 * @file Promise 扩展支持then与done
 * 支持异步resolve, 支持链式扩展
 *
 * @author Liandong Liu (liuliandong01@baidu.com)
 */

define(function (require, exports) {
    var logger = window.console;
    var Promise = window.Promise;

    /**
     * Chain 文件系统调用promise扩展实现
     * @constructor
     */
    function Chain() {
        var chain = this;
        var promise = new Promise(function (resolve, reject) {
            chain.resolve = resolve.bind(chain);
            chain.reject = reject.bind(chain);
        });
        this.promise = promise;
    }

    /**
     * then 下一步
     * @param  {Function} fullfill 成功处理
     * @param  {Function} fail 失败处理
     * @return {Promise}
     */
    Chain.prototype.then = function (fullfill, fail) {
        return this.promise.then(fullfill, fail);
    };

    /**
     * 串行下个任务
     * 下个任务可能是一个异步任务
     * @param  {Function} fullfill 成功处理
     * @param  {Function} fail 失败处理
     * @return {Promise}
     */
    Chain.prototype.pipe = function (fullfill, fail) {
        var chain = new Chain();
        this.then(function (data) {
            data = fullfill(data);
            if (data.then) {
                data.then(function (rst) {
                    chain.resolve(rst);
                });
            }
            else {
                chain.resolve(data);
            }
        }, fail);
        return chain;
    };

    /**
     * 确保执行
     *
     * @param  {Function} fullfill 处理函数
     * @return {Chain}
     */
    Chain.prototype.ensure = function (fullfill) {
        var chain = new Chain();
        this.then(fullfill, fullfill).then(function (data) {
            chain.resolve(data);
        });
        return chain;
    };

    /**
     * console中打印结果
     * - 为了方便调试、开发
     * - 业务中可自己定义回显示函数
     *
     * @return {Promise}
     */
    Chain.prototype.display = function () {
        return this.promise.then(function (data) {
            logger.table(data);
        });
    };

    return Chain;
});
