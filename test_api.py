#!/usr/bin/env python3
"""
Nav Portal API 测试脚本
用于测试 Webhook API 的获取和更新链接功能
"""

import requests
import json
import sys

# 配置
BASE_URL = "http://localhost:3000"  # 本地服务器地址
# BASE_URL = "https://your-domain.pages.dev"  # Cloudflare Pages 地址

API_KEY = "123"  # 在设置中配置的 API Key


def test_health():
    """测试健康检查端点"""
    print("=" * 50)
    print("测试: 健康检查")
    print("=" * 50)
    
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False


def test_get_data():
    """测试获取所有数据"""
    print("\n" + "=" * 50)
    print("测试: 获取所有数据")
    print("=" * 50)
    
    try:
        response = requests.get(f"{BASE_URL}/api/data")
        print(f"状态码: {response.status_code}")
        data = response.json()
        print(f"成功: {data.get('success')}")
        if data.get('data'):
            print(f"分类数量: {len(data['data'].get('categories', []))}")
            print(f"导航项数量: {len(data['data'].get('navItems', []))}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False


def test_get_link(appid: str):
    """测试获取导航项链接"""
    print("\n" + "=" * 50)
    print(f"测试: 获取链接 (appid={appid})")
    print("=" * 50)
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/link",
            params={"key": API_KEY, "appid": appid}
        )
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False


def test_update_link(appid: str, new_link: str):
    """测试更新导航项链接"""
    print("\n" + "=" * 50)
    print(f"测试: 更新链接 (appid={appid}, link={new_link})")
    print("=" * 50)
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/link",
            params={"key": API_KEY, "appid": appid, "link": new_link}
        )
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 200
    except Exception as e:
        print(f"错误: {e}")
        return False


def test_invalid_api_key(appid: str):
    """测试无效 API Key"""
    print("\n" + "=" * 50)
    print("测试: 无效 API Key")
    print("=" * 50)
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/link",
            params={"key": "invalid-key", "appid": appid}
        )
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 401
    except Exception as e:
        print(f"错误: {e}")
        return False


def test_not_found_appid():
    """测试不存在的 AppID"""
    print("\n" + "=" * 50)
    print("测试: 不存在的 AppID")
    print("=" * 50)
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/link",
            params={"key": API_KEY, "appid": "non-existent-appid"}
        )
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.status_code == 404
    except Exception as e:
        print(f"错误: {e}")
        return False


def run_all_tests():
    """运行所有测试"""
    print("\n" + "#" * 60)
    print("Nav Portal API 测试")
    print("#" * 60)
    
    results = []
    
    # 基础测试
    results.append(("健康检查", test_health()))
    results.append(("获取数据", test_get_data()))
    
    # 如果有导航项，测试链接 API
    # 请替换为实际的 appid
    test_appid = "test-app"
    
    results.append(("获取链接", test_get_link(test_appid)))
    results.append(("更新链接", test_update_link(test_appid, "https://new-url.com")))
    results.append(("验证更新", test_get_link(test_appid)))
    
    # 错误场景测试
    results.append(("无效 API Key", test_invalid_api_key(test_appid)))
    results.append(("不存在的 AppID", test_not_found_appid()))
    
    # 打印结果汇总
    print("\n" + "#" * 60)
    print("测试结果汇总")
    print("#" * 60)
    
    passed = 0
    failed = 0
    for name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{name}: {status}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\n总计: {passed} 通过, {failed} 失败")
    return failed == 0


if __name__ == "__main__":
    # 可以通过命令行参数指定服务器地址和 API Key
    if len(sys.argv) >= 2:
        BASE_URL = sys.argv[1]
    if len(sys.argv) >= 3:
        API_KEY = sys.argv[2]
    
    print(f"服务器地址: {BASE_URL}")
    print(f"API Key: {API_KEY[:4]}..." if len(API_KEY) > 4 else f"API Key: {API_KEY}")
    
    success = run_all_tests()
    sys.exit(0 if success else 1)
