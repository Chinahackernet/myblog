# MySQL AUTOCOMMIT模式

> 分类：Database / 第14章：MySQL事务处理
> 原文：https://www.cuiliangblog.cn/detail/section/31461204
> 来源：崔亮的博客

---

    1. 默认情况下，MySQL AUTOCOMMIT 模式处于启用状态
    - 意味着每一条DML语句都会产生一个事务
    - 每一条DML语句执行完了都会自动提交commit；因此无法通过commit       或rollback 作为一个单元提交或回滚多个DML语句
    - 有时，会将这种情况误认为根本没有事务，但是情况并非如此
    - 通常使用start       transaction;语句来改变autocommit，以显示的方式开启一个事务
    - start transaction 后面的所有DML语句会当成一个事务的一组操作，直到输入了commit;或rollback;命令事务才已显示的方式结束
    2. MySQL使用commit和rollback语句显示地提交或回滚一个事务
    3. 但有些语句会造成事务已隐式的方式按照提交(commit)来结束，这些语句如下所示：
    - create; alter; drop; grant;       revoke; set password; start transaction; truncate 等
    - 例如：start       transaction之后执行了一系列DML操作，产生了一个事务，但是执行了一个建表语句，create table a (id int);       这会导致事务以提交（commit）的方式结束，即还没有执行commit命令就使事务以提交的方式提前结束了，所以叫做隐式提交


