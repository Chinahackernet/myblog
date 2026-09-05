# MySQL配置选项

> 分类：Database / 第15章：MySQL体系结构与配置
> 原文：https://www.cuiliangblog.cn/detail/section/31461250
> 来源：崔亮的博客

---

# 一、MySQL选项
1. MySQL提供几百个选项（参数），许多选项都有默认值（预编译的值），如果没有指定选项值服务器启动就使用默认值
2. 可以通过调整选项的值来改变MySQL的运行状态
3. 显示MySQLD所有选项：
+ mysql> show variables;

或

+ root# mysqld --verbose --help

![](assets/07-Database/dde4ad05d5a23b16a4db.png)

![](assets/07-Database/69454abe8834d23c4b51.png)

# 二、改变选项值的方式
1. 命令行选项
+ 例如：
+ root>mysqld      --default_storage_engine=innodb
+ root>systemctl      set-environment MYSQLD_OPTS='--skip-grant-tables --skip-networking'  
2. 系统变量
+ 例如：
+ mysql> show variables like      'character_set_server%';
+ mysql> set      character_set_server='utf8';
+ 通用格式：set [global | session]      var_name=var_value 
+ global对所有新连接会话生效，session对当前会话生效
+ 有些选项不能直接改值，需要把选项和值放到选项文件中，重启MySQLD才能生效

![](assets/07-Database/811757ba48b9c443230c.png)

1. 选项文件 /etc/my.cnf
+ 通过set [global | session]      var_name=var_value      修改的选项，在重启mysqld后，还原回原来的默认值，这样不方便；一个一个修改选项值容易出错也不方便，因此mysql提供选项文件/etc/my.cnf，方便批量修改选项文件
+ 选项使用优先级 1.命令行选项 2. 选项文件 3.默认值

mysqld重启时先看有没有命令行选项，如果有优先使用

如果没有，查看/etc/my.cnf中有没有，如果有使用

如果没有，使用默认值

+ 查看选项文件中为mysqld设置了哪些选项

root# my_print_defaults mysqld

![](assets/07-Database/24dd1598c1eac1e8bebc.png)

 


