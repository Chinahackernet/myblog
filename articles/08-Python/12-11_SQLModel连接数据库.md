# SQLModel连接数据库

> 分类：Python / 第12章：FastAPI
> 原文：https://www.cuiliangblog.cn/detail/section/245282990
> 来源：崔亮的博客

---

# SQLModel 简介
SQLModel 是一个基于 SQLAlchemy 和 Pydantic 构建的 ORM 库，具有以下特点：

+ 类型安全：完全基于 Python 类型提示，开发体验优秀。
+ 与 FastAPI 深度集成：可以直接用于请求体和响应模型。
+ 兼容 SQLAlchemy：底层基于 SQLAlchemy，功能强大。
+ 自动生成表结构：支持自动建表。
+ 简洁易学：API 设计简单直观，非常适合初学者。

# 安装依赖
你可以使用 `uv` 安装 对应数据库驱动包

```bash
uv add sqlmodel
# PostgreSQL数据库
uv add psycopg2-binary
# MySQL数据库
uv add pymysql
```

# 定义数据模型
新建文件 `models.py`，并定义一个简单的数据模型：

```python
from sqlmodel import SQLModel, Field
from typing import Optional


class Item(SQLModel, table=True):
    """
    Item类用于定义商品数据模型，继承自SQLModel并映射到数据库表。
    该类描述了商品的基本信息，包括名称、描述、价格和库存状态。

    属性说明:
        id (Optional[int]): 商品唯一标识符，主键，默认为None表示自动生成
        name (str): 商品名称，必填字段
        description (Optional[str]): 商品描述，可选字段，默认为None
        price (float): 商品价格，必填字段
        in_stock (bool): 商品库存状态，True表示有库存，默认为True
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    price: float
    in_stock: bool = True

```

说明：

+ `table=True` 表示该模型将被映射为数据库中的表。
+ `id` 字段设置为 `primary_key=True`，并使用 `Optional[int]` 允许其为空（用于自动递增主键）。

# 创建数据库连接和会话
你可以新建 `database.py` 来管理数据库连接：

```python
from sqlmodel import create_engine, Session, SQLModel

DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(DATABASE_URL, echo=True)

def init_db():
    """
    初始化数据库，创建所有定义的表结构。

    该函数使用SQLModel的元数据来创建数据库表，如果表已存在则不会重复创建。
    """
    # 创建所有继承自SQLModel的表
    SQLModel.metadata.create_all(engine)

def get_session():
    """
    获取数据库会话的生成器函数。

    该函数提供了一个数据库会话上下文管理器，确保会话在使用完毕后能够正确关闭。

    Yields:
        Session: 数据库会话对象，用于执行数据库操作
    """
    # 使用with语句确保会话在使用后自动关闭
    with Session(engine) as session:
        yield session

```

+ `echo=True` 会在终端输出 SQL 日志，方便调试。
+ `init_db()` 会根据模型创建数据库表。

# 创建和查询数据接口
你可以编写一个简单的增查接口（例如放在 `routes/items.py`）：

```python
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from models import Item
from database import get_session

router = APIRouter()


@router.post("/items/", response_model=Item)
def create_item(item: Item, session: Session = Depends(get_session)):
    """
    创建一个新的物品记录

    该函数接收一个物品对象，将其保存到数据库中，并返回创建后的完整物品信息。
    通过数据库会话管理事务，确保数据的一致性。

    参数:
        item (Item): 包含物品信息的数据模型对象
        session (Session): 数据库会话对象，通过依赖注入自动获取

    返回值:
        Item: 创建成功的物品对象，包含数据库生成的ID等信息
    """
    # 将新物品添加到会话中
    session.add(item)
    # 提交事务，将数据持久化到数据库
    session.commit()
    # 刷新对象以获取数据库生成的字段值
    session.refresh(item)
    return item


@router.get("/items/", response_model=list[Item])
def read_items(session: Session = Depends(get_session)):
    """
    查询所有物品记录

    该函数从数据库中检索所有的物品记录，并以列表形式返回。

    参数:
        session (Session): 数据库会话对象，通过依赖注入自动获取

    返回值:
        list[Item]: 包含所有物品记录的列表
    """
    # 构造查询所有物品的SQL语句
    statement = select(Item)
    # 执行查询并获取所有结果
    results = session.exec(statement).all()
    return results

```

# 初始化数据库
在 `main.py` 文件中引入并调用初始化函数：

```python
from fastapi import FastAPI
from database import init_db
from routes import items
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    应用程序生命周期管理函数

    在应用程序启动时初始化数据库，在应用程序关闭时执行清理操作

    参数:
        app (FastAPI): FastAPI应用程序实例

    返回值:
        None
    """
    # 启动时执行的代码
    init_db()
    yield
    # 关闭时执行的代码（如果需要的话）

# 创建FastAPI应用实例，配置生命周期管理器
app = FastAPI(lifespan=lifespan)
# 注册路由处理器
app.include_router(items.router)
```

这样，FastAPI 应用启动时会自动建表。

# 使用测试请求
你可以使用 FastAPI 自动生成的文档界面（`http://127.0.0.1:8000/docs`）来测试 POST 和 GET 接口。

POST 示例：

```plain
{
  "name": "测试商品",
  "description": "这是一个示例",
  "price": 99.9,
  "in_stock": true
}
```




