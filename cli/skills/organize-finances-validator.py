#!/usr/bin/env python3
"""
organize-finances 强制验证脚本
每一步都必须通过验证才能继续
"""

import pandas as pd
import xml.etree.ElementTree as ET
import glob
import os
import sys

class ValidationError(Exception):
    """验证失败异常"""
    pass

def step1_validate_structure(base_dir):
    """第1步：验证文件夹结构（强制）"""
    print("\n" + "="*80)
    print("第1步：验证文件夹结构")
    print("="*80)
    
    required = ['📊_对账报表', '📁_原始发票XML', '📋_说明文档']
    
    for folder in required:
        path = os.path.join(base_dir, folder)
        if not os.path.exists(path):
            raise ValidationError(f"❌ 缺少必需文件夹: {folder}")
        print(f"✅ {folder}")
    
    print("\n✅ 第1步验证通过")
    return True

def step2_extract_invoices(base_dir):
    """第2步：提取所有XML（强制递归）"""
    print("\n" + "="*80)
    print("第2步：提取所有XML发票")
    print("="*80)
    
    xml_dir = os.path.join(base_dir, '📁_原始发票XML')
    
    # 强制使用recursive=True
    xml_files = glob.glob(f"{xml_dir}/**/*.xml", recursive=True)
    
    if len(xml_files) < 50:
        raise ValidationError(f"❌ 发票数量异常少: {len(xml_files)}张，预期>50张")
    
    print(f"✅ 找到 {len(xml_files)} 个XML文件")
    
    # 解析所有XML
    invoices = []
    for xml_file in xml_files:
        try:
            tree = ET.parse(xml_file)
            root = tree.getroot()
            
            eiid = root.find('.//EIid')
            label_code = root.find('.//InIssuType/LabelCode')
            amount = root.find('.//TotalTax-includedAmount')
            buyer = root.find('.//BuyerName')
            
            if eiid is not None and amount is not None:
                invoices.append({
                    'invoice_id': eiid.text,
                    'buyer_name': buyer.text if buyer is not None else '',
                    'amount': float(amount.text),
                    'is_red': (label_code.text == 'N') if label_code is not None else False
                })
        except Exception as e:
            print(f"⚠️ 跳过损坏文件: {xml_file}")
    
    if len(invoices) == 0:
        raise ValidationError("❌ 没有成功解析任何发票")
    
    print(f"✅ 成功解析 {len(invoices)} 张发票")
    
    # 强制检查重复
    eiids = [inv['invoice_id'] for inv in invoices]
    if len(eiids) != len(set(eiids)):
        duplicates = [eiid for eiid in eiids if eiids.count(eiid) > 1]
        raise ValidationError(f"❌ 发现重复发票ID: {set(duplicates)}")
    
    print(f"✅ 发票ID无重复")
    print("\n✅ 第2步验证通过")
    
    return pd.DataFrame(invoices)

def step3_identify_red(df):
    """第3步：识别红字发票（强制）"""
    print("\n" + "="*80)
    print("第3步：识别红字发票")
    print("="*80)
    
    red_count = len(df[df['is_red'] == True])
    blue_count = len(df[df['is_red'] == False])
    
    print(f"蓝字发票: {blue_count} 张")
    print(f"红字发票: {red_count} 张")
    
    if red_count > 0:
        print(f"✅ 已识别红字发票")
    
    print("\n✅ 第3步验证通过")
    return df

def step4_calculate_net(df):
    """第4步：计算净额，排除完全冲红（强制）"""
    print("\n" + "="*80)
    print("第4步：计算净额")
    print("="*80)
    
    customers = []
    for buyer in df['buyer_name'].unique():
        buyer_data = df[df['buyer_name'] == buyer]
        blue = buyer_data[buyer_data['is_red']==False]['amount'].sum()
        red = buyer_data[buyer_data['is_red']==True]['amount'].abs().sum()
        net = blue - red
        
        customers.append({
            'buyer': buyer,
            'blue': blue,
            'red': red,
            'net': net
        })
    
    df_customers = pd.DataFrame(customers)
    
    # 强制排除净额=0
    fully_cancelled = df_customers[df_customers['net'] == 0]
    if len(fully_cancelled) > 0:
        print(f"\n❌ 以下{len(fully_cancelled)}个客户完全冲红，必须排除：")
        for _, row in fully_cancelled.iterrows():
            print(f"  {row['buyer']}: 蓝¥{row['blue']:,.2f} - 红¥{row['red']:,.2f} = ¥0")
    
    df_valid = df_customers[df_customers['net'] > 0]
    print(f"\n✅ 有效客户: {len(df_valid)} 个")
    print(f"✅ 排除完全冲红: {len(fully_cancelled)} 个")
    print("\n✅ 第4步验证通过")
    
    return df_valid

def step5_final_check(df_results):
    """第5步：最终验证（强制）"""
    print("\n" + "="*80)
    print("第5步：最终验证")
    print("="*80)
    
    total_net = df_results['net'].sum()
    
    # 强制检查总金额合理性
    if total_net < 50000:
        raise ValidationError(f"❌ 净应收金额异常低: ¥{total_net:,.2f}")
    
    if total_net > 10000000:
        raise ValidationError(f"❌ 净应收金额异常高: ¥{total_net:,.2f}")
    
    print(f"✅ 净应收金额: ¥{total_net:,.2f} (合理范围)")
    print("\n✅ 第5步验证通过")
    
    return True

def main():
    print("="*80)
    print("organize-finances 强制验证脚本")
    print("="*80)
    
    if len(sys.argv) < 2:
        print("用法: python3 organize-finances-validator.py <发票文件夹路径>")
        sys.exit(1)
    
    base_dir = sys.argv[1]
    
    try:
        # 强制执行5步
        step1_validate_structure(base_dir)
        df = step2_extract_invoices(base_dir)
        df = step3_identify_red(df)
        df_valid = step4_calculate_net(df)
        step5_final_check(df_valid)
        
        print("\n" + "="*80)
        print("✅ 所有验证通过！")
        print("="*80)
        
    except ValidationError as e:
        print("\n" + "="*80)
        print(f"❌ 验证失败: {e}")
        print("="*80)
        sys.exit(1)

if __name__ == '__main__':
    main()
