# 创建

1、创建模型类

2、生成迁移文件

```yaml
python manager.py makemigratations
```

（1）、去对比原有迁移文件

（2）、增量更新迁移文件

3、执行迁移文件

```yaml
python manager.py migrate
```

4、记录迁移过的文件以供下次迁移使用

  

# 重建

1、删除迁移文件

2、删除由迁移文件生成的表

3、删除迁移表中的迁移记录