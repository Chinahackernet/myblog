项目地址：[https://github.com/jinzhu/gorm](https://github.com/jinzhu/gorm)

文档地址：[https://godoc.org/github.com/jinzhu/gorm](https://godoc.org/github.com/jinzhu/gorm)

  

## 库安装

```go
go get github.com/jinzhu/gorm
```

如果因为网络原因不能安装，可以设置代理。比如在Windows下

```go
set GOPROXY=http://goproxy.cn
```

  

## 数据库连接

> gorm支持多种数据库连接，这里以Mysql为例

```go
import (
    "github.com/jinzhu/gorm"
    _ "github.com/jinzhu/gorm/dialects/mysql"
）

var db *gorm.DB

func init() {
    var err error
    db, err = gorm.Open("mysql", "<user>:<password>/<database>?charset=utf8&parseTime=True&loc=Local")
    if err != nil {
        panic(err)
    }
}
```

或者

```go
package common

import (
	"fmt"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/mysql"	
    "log"
)

var db *gorm.DB

// 初始化数据库
func InitDB() *gorm.DB {
	driverName := "mysql"
	host := "localhost"
	port := "3306"
	username := "root"
	password := "coolops"
	dbName := "my_user"
	charSet := "utf8"
	args := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=%s&parseTime=True&loc=Local",
		username, password, host,port,dbName, charSet,
	)
	db, err := gorm.Open(driverName, args)
	if err != nil {
		log.Println("connect to MySQL failed. err " + err.Error())
	}
}
```

数据库的连接比较简单，直接使用`gorm.Open()`即可。

  

## 数据库操作

### 表定义

```go
type User struct {
	gorm.Model
	UserName  string `gorm:"varchar(20);not null"`
	PassWord  string `gorm:"size 255;not null"`
	Telephone string `gorm:"varchar(11);not null;unique"`
}
```

gorm用tag的方式来标识MySQL里面的约束。

  

### 创建表

支持自动创建，也支持手动创建。

##### 自动创建

```go
db.AutoMigrate(&User{})
```

会创建一张以users的表。

  

##### 手动创建

```go
if !db.HasTable(&Like{}) {
    if err := db.Set("gorm:table_options", "ENGINE=InnoDB DEFAULT CHARSET=utf8").CreateTable(&User{}).Error; err != nil {
        panic(err)
    }
}
```

  

### 插入数据

```go
user := &User{
    UserName: name,
    Password: password,
    Telephone: telephone,
}
if err := db.Create(user).Error; err != nil{
    return err
}
```

  

### 删除数据

```go
if err := db.Where(&User{Telephone: telephone}).Delete(User{}).Error; err != nil {
    return err
}
```

  

### 查询数据

```go
if err := db.Model(&User{}).Where("telephone = ?", telephone).First(&user); err != nil {
    return err
}
```

先用 `db.Model()` 选择一个表，再用 `db.Where()` 构造查询条件，`db.First(&user)`只取第一条记录。

  

### 修改数据

```go
db.Model(&user).Update("name", "hello")
db.Model(&user).Updates(User{Name: "hello", Age: 18})
db.Model(&user).Updates(User{Name: "", Age: 0, Actived: false}) // nothing update
```

  

### 事务操作

```go
func CreateAnimals(db *gorm.DB) err {
    tx := db.Begin()
    if err := tx.Create(&Animal{Name: "Giraffe"}).Error; err != nil {
        tx.Rollback()
        return err
    }
    if err := tx.Create(&Animal{Name: "Lion"}).Error; err != nil {
        tx.Rollback()
        return err
    }
    tx.Commit()
    return nil
}
```

事务的处理也很简单，用 `db.Begin()` 声明开启事务，结束的时候调用 `tx.Commit()`，异常的时候调用 `tx.Rollback()`