# MySQL查询总结

> 分类：Database / 第8章：SQL高级
> 原文：https://www.cuiliangblog.cn/detail/section/31451700
> 来源：崔亮的博客

---

简单查询

执行步骤：

select  c1,c2,...  from  tab_name  where xxx=xxx group by xxx  having xxx=xxx   order by xxx   limit

                  3                    1                 2            4              5              6          7

 

复杂查询

 

多表连接

 

交叉连接（笛卡尔积）

select * from a cross join b;

记录数 = a表记录 * b表记录

 

等值连接

内连接

select * from a inner join b on a.id=b.id;

左连接 （左外连接）

select * from a left join b on a.id=b.id;

有连接 （右外连接）

select * from a right join b on a.id=b.id;        

全连接  (全外连接) full join

select * from a full join b on a.id=b.id; (mysql不支持)

select * from a left join b on a.id=b.id union select * from a right join b on a.id=b.id;

非等值连接

 

例子：查看没有同学的bmi（体重指数=体重/身高^2）

select s.*,s.weight/(height/100*height/100) bmi,b.* from stu s join bmi b on s.weight/(height/100*height/100) BETWEEN b.lval and b.hval and s.sex=b.sex

 

 

 

子查询

 

非关联子查询

特点：子查询不依赖于主查询，可以单独执行；子查询只执行1次

例子：所有班中最高的那个同学是谁？

select * from stu where height=(select max(height) from stu);

例子：比许褚考分高的同学都是谁？

select * from stu where score>(select score from stu where sname='许褚');                                                                        

 

 

关联子查询

特点：子查询依赖于主查询，不可以单独执行；主查询有几行记录，子查询就执行几次

例子：高于本班平均分的同学都是谁？

select o.*,(select avg(score) from stu i where i.cno=o.cno) avgscore from stu o where o.score>(select avg(score) from stu i where i.cno=o.cno);

 

 

 

内联试图 in-line view

特点：作为表的子查询，属于非关联子查询，mysql需要给子查询起个别名

 

例子：每个班最高的同学都是谁？

select * from stu s join (select cno,max(height) maxheight from stu group by cno) x on s.cno=x.cno and s.height=maxheight

例子：高于本班平均分的同学都是谁？

select * from stu s join (select cno,avg(score) avgscore from stu group by cno) x on s.cno=x.cno and s.score>avgscore

例子：求班级表中每个老师所带学生的数量？

select teacher,count(ifnull(sno,null)) cnt from (select c.*,s.sno,s.sname from class c left join stu s on c.cno=s.cno) x group by teacher order by 2 desc;

 

 

 

 

复合查询

union      去除重复行，自动排序

union all  不去除重复行，不排序

查询结果集上下叠加

 

 

select user,host,null from mysql.user union select cno,teacher,cname from class ;

 

例：同学的名字都有哪些中国字，统计字的个数

select zi,count(*) from (select * from (select substr(sname,1,1) zi from stu union all select substr(sname,2,1) from stu union all select substr(sname,3,1) from stu) x where zi!='') x group by zi

 

 

 

 

 

 

 

 

 

 

 

 

 

 

 

 

 

 

 

 


