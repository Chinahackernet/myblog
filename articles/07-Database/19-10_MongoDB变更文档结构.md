# MongoDB变更文档结构

> 分类：Database / 第19章：MongoDB
> 原文：https://www.cuiliangblog.cn/detail/section/31466552
> 来源：崔亮的博客

---

    - 传统关系型数据库使用DDL语句变更表结构，MongoDB使用update(updateOne()或updateMany())方法变更文档结构
    1. 为“sue”添加gender(性别)       field，值为“female”
+ >  db.users.find();
+ >  db.users.updateOne({name:"sue"},{$set:{gender:"female"}});
+ ![](assets/07-Database/853755261017cbb31ef2.png)
    1. 查找不包括“gender”field的文档：
+ >  db.users.find({gender:{$exists:false}})
+ ![](assets/07-Database/7a85b8b9f1afc2a32dff.png)
    1. 给不包含“gender”的文档添加字段，默认值为“”
+ >  db.users.updateMany({gender:{$exists:false}},{$set:{gender:""}})
+ >  db.users.find();
+ >  db.users.find({gender:{$eq:""}});
+ ![](assets/07-Database/0af269e1aa09a62a06ac.png)
    1. 设置jack和tom的gender为“male”
+ >  db.users.updateMany({name:{$in:["jack","tom"]}},{$set:{gender:"male"}})
+ >  db.users.find({name:{$in:["jack","tom"]}})
+ ![](assets/07-Database/5a0a08fd55506ec176ed.png)
    1. 去掉gender为空字符串的文档的gender列
+ >  db.users.updateMany({gender:{$eq:""}},{$unset:{gender:""}})
+ >  db.users.find();
+ ![](assets/07-Database/06935f6e4891ef4414e7.png)
+  


