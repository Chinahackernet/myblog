```python
#!/usr/bin/env python
# -*- coding:utf-8 -*-

import json
import shutil
from collections import namedtuple
from ansible.parsing.dataloader import DataLoader
from ansible.inventory.manager import InventoryManager
from ansible.vars.manager import VariableManager
from ansible.playbook.play import Play
from ansible.executor.task_queue_manager import TaskQueueManager
from ansible.plugins.callback import CallbackBase
import ansible.constants as C

class ResultCallback(CallbackBase):
    """
    一个用于在结果出现时执行操作的回调插件示例；
    如果要将所有结果收集到单个对象中以便在执行结束时进行处理；
    请查看使用``json``回调插件或编写自己的自定义回调插件。
    """
    def v2_runner_on_ok(self, result, **kwargs):
        """
        以 JSON 形式打印结果
        此方法可以将结果存储在实例属性中以便稍后检索
        """
        host = result._host
        print(json.dumps({host.name: result._result}, indent=4))

# 由于 API 是为 CLI 构建的，因此需要始终设置某些选项，命名元组伪造的 args 解析选项对象
module_path = '/usr/lib/python2.7/site-packages/ansible/module'
Options = namedtuple('Options', ['connection', 'module_path', 'forks', 'become', 'become_method', 'become_user', 'check', 'diff'])
options = Options(connection='ssh', module_path=[module_path], forks=10, become=None, become_method=None, become_user=None, check=False, diff=False)

# 初始化所需的对象
loader = DataLoader() # 负责查找和阅读 yaml、json、ini文件
print(loader)
# 设置ansible密码
passwords = dict(conn_pass='D@ndy9989859')

# 实例化 ResultCallback 以便在进入时处理结果，Ansible 希望这是它的主要展示渠道之一
results_callback = ResultCallback()

# 创建 inventory 使用路径将主机配置文件作为源，或以逗号分隔的字符串中的主机
inventory = InventoryManager(loader=loader, sources='127.0.0.1')
# inventory = InventoryManager(loader=loader, sources='/etc/ansible/hosts')

# 变量管理器负责合并所有不同的源，为您提供每个上下文中可用变量的统一视图
variable_manager = VariableManager(loader=loader, inventory=inventory)

# 创建表示我们的 play 的数据结构，包括任务，这基本上是我们的 YAML 加载器在内部执行的操作
play_source =  dict(
        name = "Ansible Play",
        hosts = '127.0.0.1',
        gather_facts = 'yes',
        tasks = [
            dict(action=dict(module='shell', args='hostname'), register='shell_out'),
            #dict(action=dict(module='debug', args=dict(msg='{{shell_out.stdout}}')))
         ]
    )

# 创建 play 对象, playbook 对象使用 .load 而不是 init 或 new 方法，这也将自动从 play_source 中提供的信息创建任务对象
play = Play().load(play_source, variable_manager=variable_manager, loader=loader)

# 运行它 - 实例化任务队列管理器，它负责 forking 和设置所有对象以迭代主机列表和任务
tqm = None
try:
    tqm = TaskQueueManager(
              inventory=inventory,
              variable_manager=variable_manager,
              loader=loader,
              options=options,
              passwords=passwords,
              stdout_callback=results_callback,  # 使用我们的自定义回调而不是``default``回调插件，它打印到stdout
          )
    result = tqm.run(play) # 一个 play 的数据实际上是发送到回调的方法
finally:
    # 我们总是需要清理子进程和我们用来与它们通信的结构
    if tqm is not None:
        tqm.cleanup()

    # 删除 ansible 临时目录
    shutil.rmtree(C.DEFAULT_LOCAL_TMP, True)

```