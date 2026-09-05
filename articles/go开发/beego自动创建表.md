# 0\. 数据库创建

此处使用MySQL数据库,在mysql中创建数据库beego

# 1\. 导入数据库驱动

使用如下语句导入MySQL驱动

```plain
import (
    _ "github.com/go-sql-driver/mysql"
)
```

# 2\. Model定义

```plain
type Users struct {
	Id  int
	Name string
	Pwd  string
	Age  int
	Sex  string
}
/*
//我们也可以使用Tag对属性进行详细的设置
type Users struct {
	Id  int   `pk:"auto;column(id)"`  			//设置主键自增长 列名设为id
	Name string `orm:"size(15);column(name)"`  	//设置varchar长度为15 列名为name
	Pwd  string  `orm:"size(15);column(pwd)"`
	Age  int    `orm:"column(age)"`
	Sex  string  `orm:"size(15);column(sex)"`
}
*/
```

# 3\. Beego ORM初始化

```plain
// Beego ORM 初始化
func init() {
	// 1. 注册数据驱动, mysql / sqlite3 / postgres 这三种是默认已经注册过的，所以可以无需设置
	orm.RegisterDriver("mysql", orm.DRMySQL)
	// 2. 注册数据库, ORM必须注册一个别名为 default 的数据库，作为默认使用
	orm.RegisterDataBase("default", "mysql", "root:123456@tcp(127.0.0.1:3306)/beego")
	// 3. 注册模型
	orm.RegisterModel(new(Users))
	// 4. 自动创建表 参数二为是否开启创建表   参数三是否更新表
	orm.RunSyncdb("default", true, true)
```