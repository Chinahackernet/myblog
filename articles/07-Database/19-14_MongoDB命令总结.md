# MongoDB命令总结

> 分类：Database / 第19章：MongoDB
> 原文：https://www.cuiliangblog.cn/detail/section/31466518
> 来源：崔亮的博客

---

# 一、数据库操作
1. 查看数据库

show dbs

1. 切换(创建)数据库

use mydatabase

1. 删除当前数据库

db.dropDatabase()

1. 统计数据库信息

db.stats()

# 二、集合操作
1. 查看集合

show collections

1. 删除集合

db.users.drop()

# 三、文档操作
1. 插入文档

db.users.insert({

    name:'harttle',

    url:'http://harttle.com'

})

1. 查询文档
+ 查询所有

db.users.find()

+ 条件查询

db.表名.find()查看表全部

db.表名.find().pretty()可视化

db.表名.distinct('key') 去重复

db.表名.find({key:vules}) 查找

db.表名.find({key:{$lt:55,$gt:45}}).pretty()大于45小于55的

lt <   lte<=    gt>    gte>= 

db.表名.find({key:/字段/}).pretty() 查找正则包含字段

db.表名.find({},{name:0}) 只显示name

db.表名.find().sort({age:1})  对age升序 -1降序

db.表名.find().limit(数字) 取前几条的数据  skil( )跳过几条数据

db.表名.find({$or:[{},{}]})条件或

db.表名.count()统计有几条数据

db.表名.find({key:{$ne:*}})  找key不等于*

db.表名.find（{key:{$in:[“a”，“b”]}}）找key有a，b的

db.表名.find({key:{$nin:[  ]}}) 不在的

db.表名.find({key:{$exists:true}}) 找有key的

db.表名.find({key:{&type:类型}}) 找key是某类型的

1. 更新文档

db.users.update({name:'harttle'},

{url:'http://harttle.com'})

1. 删除文档
+ 删除所有

db.users.remove({})

+ 条件删除

db.users.remove({

url:'http://harttle.com'

})

# 四、索引
1. 创建索引

db.userInfo.ensureIndex({name: 1});

db.userInfo.ensureIndex({name: 1, ts: -1});

1. 查询当前聚集集合所有索引

db.userInfo.getIndexes();

1. 查看总索引记录大小

db.userInfo.totalIndexSize();

1. 读取当前集合的所有index信息

db.users.reIndex();

1. 删除指定索引

db.users.dropIndex("name_1");

1. 删除所有索引索引

db.users.dropIndexes();

# 五、其他命令
1. 当前Mongo连接的服务器和端口

db.getMongo() 


