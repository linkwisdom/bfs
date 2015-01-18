bfs (browser-end filesystem)
===
浏览器端文件系统API

## 使用方法
-----

### 读取文件内容

```js
    // 读取文件内容；并且打印结果
    fs.readFile('test.txt').display();

    // 异步方式读取文件内容
    fs.readFile('test.txt').then(function (content) {
        console.log(content);
    });

    // 回调方式读取文件内容
    fs.readFile('test.txt', function (content) {
        console.log(content);
    });
```

### 读取文件列表
```js
    // 以表格详情方式打印文件列表信息
    fs.listFiles('mydir/').display();

    // 获取文件具体内容
    fs.listFiles('/').then(function() {
        return list.map(function (file) {
            return {
                name: file.name, // 文件名称
                size: file.size, // 文件大小
                isDir: file.isDir // 是否文件夹
            };
        });
    }).display();
```

### 读取文件部分内容
```js
    // 翻页方式读取文件内容
    fs.readBuffer('test.txt', {start: 1000, size: 1000}).display();
```

### 写入文件
```js
    // 写入文件
    fs.readFile('test.txt', 'file-content').display();
    // 写入指定位置
    fs.readFile('test.txt', {
        start: 1000,
        content: 'file-content'
    }).display();
```

### 追加方式写入文件

```js
    fs.appendFile('test.txt', 'file-content').display();
```