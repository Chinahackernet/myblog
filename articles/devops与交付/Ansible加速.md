下载安装包

```shell
wget https://files.pythonhosted.org/packages/source/m/mitogen/mitogen-0.2.7.tar.gz
tar axf mitogen-0.2.7.tar.gz -C /opt/
```

  

配置ansible配置文件

```shell
[defaults]
strategy_plugins = /opt/mitogen-0.2.7/ansible_mitogen/plugins/strategy
strategy = mitogen_linear
```

  

*注: mitogen中也有三种模式*

-   ***mitogen\_linear**: 对应原生的linear*
-   ***mitogen\_free**: 对应原生的free*
-   ***mitogen\_host\_pinned**: 对应原生的host\_pinned*

[https://github.com/dw/mitogen/blob/master/docs/ansible\_detailed.rst](https://github.com/dw/mitogen/blob/master/docs/ansible_detailed.rst)