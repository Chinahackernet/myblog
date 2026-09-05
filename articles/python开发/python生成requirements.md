## 1、freeze

```plain
pip freeze > requirements.txt
```

  

## 2、pipreqs

```plain
# 安装
pip install pipreqs
# 在当前目录生成
pipreqs . --encoding=utf8 --force
复制代码
```

注意`--encoding=utf8`为使用utf8编码，不然可能会报UnicodeDecodeError: 'gbk' codec can't decode byte 0xae in position 406: illegal multibyte sequence 的错误。

`--force`强制执行，当 生成目录下的requirements.txt存在时覆盖。

当当当，可以看见我依赖的只有这些啦

![](assets/python开发/python生成requirements/python生成requirements-1.webp)

使用requirements.txt安装依赖的方式：

```plain
pip install -r requirements.txt
```