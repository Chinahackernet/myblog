# rename table修改表名

> 分类：Database / 第5章：SQL数据定义
> 原文：https://www.cuiliangblog.cn/detail/section/31451615
> 来源：崔亮的博客

---

不同语句修改表明参考以下相应命令：

<font style="color:#333333;">1. </font>[MYSQL](https://www.baidu.com/s?wd=MYSQL&tn=SE_PcZhidaonwhc_ngpagmjz&rsv_dl=gh_pc_zhidao)

rename table table1 to table2;

2. SQL SERVER

EXEC sp_rename 'table1', 'table2';

<font style="color:#333333;">3. </font>[Oracle](https://www.baidu.com/s?wd=Oracle&tn=SE_PcZhidaonwhc_ngpagmjz&rsv_dl=gh_pc_zhidao)

alter table table1 rename to table2

4. db2

rename table table1 to table2;

 


