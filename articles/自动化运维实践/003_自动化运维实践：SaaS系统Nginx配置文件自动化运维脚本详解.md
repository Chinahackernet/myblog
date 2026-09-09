---
title: 自动化运维实践：SaaS系统Nginx配置文件自动化运维脚本详解
---

**前言：在SaaS（软件即服务）系统架构中，多租户隔离是核心需求之一，而Nginx作为常用的反向代理和负载均衡工具，其配置文件的管理往往成为运维效率的瓶颈。手动编写或修改Nginx配置不仅耗时，还容易因人为操作引入错误。本文将介绍两款自主开发的Nginx配置Linux自动化运维脚本，通过自动化脚本解决多租户场景下的配置管理难题。**

## 脚本背景与价值

在SaaS系统中，每个租户通常拥有独立的域名（或子域名），对应的Nginx配置需要包含域名绑定、SSL证书路径、反向代理规则等信息。当租户数量增长到一定规模时，手动维护这些配置会面临以下问题：

- 重复劳动：不同租户的配置结构相似，仅域名等少数信息不同，手动复制修改效率低下
- 易出错：SSL证书路径、子域名规则等细节容易写错
- 不规范：运维人员配置风格不一，后期难以统一维护

基于此，我们开发了两款Linux自动化运维脚本，通过模板替换的方式快速生成租户专属Nginx配置，实现"一次模板定义，多次自动生成"的高效运维模式。

## 脚本一：灵活模板型配置生成脚本（nginx-tenant-2-config.py）

第一款脚本侧重于灵活性，支持自定义模板文件，可适配不同格式的占位符，适用于多种场景的Nginx配置生成。

### 完整脚本代码

```
# -*- coding: utf-8 -*-
import os
import re
import argparse

def generate_nginx_config(tenant_domain, template_path, output_dir="/etc/nginx/conf.d/saas-proxy"):
    """根据租户域名和自定义模板生成Nginx配置"""
    # 预处理：替换域名中的点为横线，避免文件命名冲突
    safe_tenant_name = tenant_domain.replace(".", "-")
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    # 配置文件路径（以安全租户名命名）
    config_file = os.path.join(output_dir, f"{safe_tenant_name}.conf")

    # 检查模板文件是否存在
    if not os.path.exists(template_path):
        print(f"❌ 错误：模板文件不存在 → {template_path}")
        return False

    try:
        # 读取模板内容（支持任意模板文件名，如template-1.conf、template-2.conf等）
        with open(template_path, "r", encoding="utf-8") as f:
            template_content = f.read()
        
        # 域名替换逻辑（根据模板中实际的占位符调整正则）
        # 示例：替换模板中的"example.com"为租户域名，支持带前缀的域名（如api.example.com → api.tenant.com）
        new_content = re.sub(r'example\.com', tenant_domain, template_content)
        # 若模板中有其他占位符格式（如${tenant}），可在此补充替换
        new_content = re.sub(r'\$\{tenant\}', tenant_domain, new_content)
        
        # 写入生成的配置文件
        with open(config_file, "w", encoding="utf-8") as f:
            f.write(new_content)
        
        # 输出成功信息和后续操作指引
        print(f"✅ 配置生成成功 → {config_file}")
        print(f"  - 模板文件：{template_path}")
        print(f"  - 替换域名：{tenant_domain}")
        print("\n建议操作：")
        print(f"1. 确认SSL证书存在：/etc/nginx/ssl/{tenant_domain}.pem 和 {tenant_domain}.key")
        print("2. 验证Nginx配置：sudo nginx -t")
        print("3. 重载Nginx：sudo systemctl reload nginx")
        return True

    except Exception as e:
        print(f"❌ 生成失败 → 错误原因：{str(e)}")
        return False

def main():
    # 解析命令行参数：支持 --template 指定模板文件，后续直接跟域名（位置参数）
    parser = argparse.ArgumentParser(description="生成多租户Nginx配置（支持自定义模板）")
    # 添加--template选项（可选，默认使用当前目录的template.conf）
    parser.add_argument(
        "--template", 
        default="template.conf",
        help="模板文件路径（例如：template-1.conf 或 template-2.conf，默认：template.conf）"
    )
    # 添加域名作为位置参数（必填，无需--前缀）
    parser.add_argument(
        "tenant_domain", 
        help="租户域名（例如：tenant-domain.com）"
    )
    # 可选：指定输出目录
    parser.add_argument(
        "--output-dir", 
        default="/etc/nginx/conf.d/saas-proxy",
        help="配置文件输出目录（默认：/etc/nginx/conf.d/saas-proxy）"
    )
    
    args = parser.parse_args()
    # 调用生成函数
    generate_nginx_config(
        tenant_domain=args.tenant_domain,
        template_path=args.template,
        output_dir=args.output_dir
    )

if __name__ == "__main__":
    main()
```

### 脚本特点与使用说明

1. **核心功能**：通过读取自定义模板文件，替换其中的占位域名（如`example.com`）和变量占位符（如`${tenant}`），生成租户专属的Nginx配置文件。
2. **灵活性设计**：

   - 支持任意模板文件（通过`--template`参数指定）
   - 支持自定义输出目录（通过`--output-dir`参数指定）
   - 自动处理文件名冲突（将域名中的`.`替换为`-`作为配置文件名）
3. **使用示例**：

   ```
   # 使用template-1.conf作为模板，为tenant-a.com生成配置
   python3 nginx-tenant-2-config.py --template template-1.conf tenant-a.com

   # 自定义输出目录
   python3 nginx-tenant-2-config.py --template template-2.conf --output-dir /tmp/nginx-conf tenant-b.com
   ```

## 脚本二：子域名适配型配置生成脚本（nginx-tenant-config.py）

第二款脚本专注于包含子域名的场景，默认适配多子域名（如prod、test等）的配置生成，适合租户结构固定的SaaS系统。

### 完整脚本代码

```
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import argparse
import re

def generate_nginx_config(tenant_domain, template_path="template", output_dir="/etc/nginx/conf.d/saas-proxy"):
    """
    根据租户域名生成对应的Nginx配置
    
    Args:
        tenant_domain: 租户基础域名 (例如: tenant-domain.com)
        template_path: 模板文件路径
        output_dir: 输出目录
    """
    # 将域名中的点替换为横线作为文件名
    tenant_name = tenant_domain.replace(".", "-")
    
    # 确保目标目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    # 配置文件目标路径
    config_file = os.path.join(output_dir, f"{tenant_name}.conf")
    
    # 检查模板文件是否存在
    if not os.path.exists(template_path):
        print(f"错误: 找不到模板文件 {template_path}")
        return False
    
    try:
        # 读取模板文件
        with open(template_path, 'r', encoding='utf-8') as f:
            template_content = f.read()
        
        # 替换所有域名实例
        # 使用正则表达式确保只替换base-domain.com域名
        new_content = re.sub(r'base-domain\.com', tenant_domain, template_content)
        
        # 写入配置文件
        with open(config_file, "w", encoding="utf-8") as f:
            f.write(new_content)
        
        print(f"已创建配置文件: {config_file}")
        print("此配置包含以下子域名:")
        print(f"- prod.{tenant_domain}")
        print(f"- test.{tenant_domain}")
        print(f"- dev.{tenant_domain}")
        print("")
        print("请确保以下目录和文件存在:")
        print(f"- SSL证书: /etc/nginx/ssl/{tenant_domain}.pem")
        print(f"- SSL密钥: /etc/nginx/ssl/{tenant_domain}.key")
        print("")
        print("请检查配置文件内容是否正确，然后重新加载Nginx配置:")
        print("sudo nginx -t && sudo systemctl reload nginx")
        
        return True
    except Exception as e:
        print(f"错误: {str(e)}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Nginx多租户配置生成器")
    parser.add_argument("tenant_domain", help="租户基础域名 (例如: tenant-domain.com)")
    parser.add_argument("--template", default="template", help="模板文件路径 (默认: template)")
    parser.add_argument("--output-dir", default="/etc/nginx/conf.d/saas-proxy", 
                        help="输出目录 (默认: /etc/nginx/conf.d/saas-proxy)")
    
    args = parser.parse_args()
    
    generate_nginx_config(args.tenant_domain, args.template, args.output_dir)

if __name__ == "__main__":
    main()
```

### 脚本特点与使用说明

1. **核心功能**：针对包含固定子域名（如prod、test、dev）的场景，通过模板替换基础域名（如`base-domain.com`），快速生成包含多子域名的Nginx配置。
2. **场景适配**：

   - 自动识别并提示配置中包含的子域名（方便运维人员核对）
   - 明确提示SSL证书的路径要求（减少证书配置错误）
3. **使用示例**：

   ```
   # 使用默认模板为tenant-c.com生成配置（包含子域名）
   python3 nginx-tenant-config.py tenant-c.com

   # 指定自定义模板
   python3 nginx-tenant-config.py --template subdomain-template.conf tenant-d.com
   ```

## 总结与扩展

两款脚本均通过"模板+替换"的核心逻辑实现Nginx配置自动化生成，解决了SaaS多租户场景下的配置管理痛点：

- 减少重复劳动：一次模板定义，支持无限次生成
- 降低错误率：标准化替换逻辑，避免手动修改失误
- 提升可维护性：统一配置结构，便于后期批量调整

实际使用时，可根据租户结构选择脚本：若租户子域名不固定，推荐使用第一款灵活模板脚本；若租户包含固定子域名（如prod、test），第二款脚本更贴合场景。

未来可进一步扩展功能，如增加SSL证书自动检测、配置文件语法预校验、批量生成多租户配置等，持续提升SaaS系统的运维自动化水平。  
