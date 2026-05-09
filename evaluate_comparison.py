#!/usr/bin/env python3
"""
Persian OCR Comparison - Compare custom trained models vs EasyOCR
Run on dataset to get accuracy for each
"""

import os
import sys
import pandas as pd
import editdistance
import torch
from datetime import datetime

import easyocr
from inference import PersianOCRInferencer


def evaluate_easyocr(dataset_path, params=None):
    print("\n" + "="*60)
    print("Evaluating EasyOCR...")
    print("="*60)
    
    if params is None:
        params = {
            'canvas_size': 1024,
            'mag_ratio': 1.5,
            'text_threshold': 0.25,
            'low_text': 0.15
        }
    
    reader = easyocr.Reader(['fa'], gpu=True, verbose=False)
    df = pd.read_excel(dataset_path)
    total = len(df)
    
    total_ed = 0
    total_chars = 0
    correct = 0
    
    for idx, row in df.iterrows():
        img_path = f"resources/{row['image']}"
        gt = str(row['text'])
        
        if not os.path.exists(img_path):
            continue
        
        result = reader.readtext(img_path, **params)
        pred = ' '.join([r[1] for r in result])
        
        ed = editdistance.eval(pred, gt)
        total_ed += ed
        total_chars += len(gt)
        
        if ed == 0:
            correct += 1
        
        if (idx + 1) % 500 == 0:
            acc = 100 * (1 - total_ed / total_chars) if total_chars > 0 else 0
            print(f"Progress: {idx + 1}/{total} | Accuracy: {acc:.2f}%")
    
    accuracy = (1 - total_ed / total_chars) * 100 if total_chars > 0 else 0
    exact_match = (correct / total) * 100
    
    print(f"\nEasyOCR Results:")
    print(f"  Character Accuracy: {accuracy:.2f}%")
    print(f"  Exact Match: {exact_match:.2f}%")
    
    return accuracy, exact_match


def evaluate_custom_model(dataset_path, model_path, label_map):
    print("\n" + "="*60)
    print(f"Evaluating Custom Model: {model_path}")
    print("="*60)
    
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"Using device: {device}")
    
    try:
        inferencer = PersianOCRInferencer(model_path, num_classes=len(label_map), device=device)
    except Exception as e:
        print(f"Error loading model: {e}")
        return None, None
    
    df = pd.read_excel(dataset_path)
    total = len(df)
    
    total_ed = 0
    total_chars = 0
    correct = 0
    
    for idx, row in df.iterrows():
        img_path = f"resources/{row['image']}"
        gt = str(row['text'])
        
        if not os.path.exists(img_path):
            continue
        
        try:
            pred_indices = inferencer.predict(img_path)
            pred = ''.join([label_map.get(i, '') for i in pred_indices])
        except Exception as e:
            pred = ""
        
        ed = editdistance.eval(pred, gt)
        total_ed += ed
        total_chars += len(gt)
        
        if ed == 0:
            correct += 1
        
        if (idx + 1) % 500 == 0:
            acc = 100 * (1 - total_ed / total_chars) if total_chars > 0 else 0
            print(f"Progress: {idx + 1}/{total} | Accuracy: {acc:.2f}%")
    
    accuracy = (1 - total_ed / total_chars) * 100 if total_chars > 0 else 0
    exact_match = (correct / total) * 100
    
    print(f"\nCustom Model Results:")
    print(f"  Character Accuracy: {accuracy:.2f}%")
    print(f"  Exact Match: {exact_match:.2f}%")
    
    return accuracy, exact_match


def main():
    print("="*60)
    print("Persian OCR Model Comparison")
    print("="*60)
    print(f"Started: {datetime.now()}")
    
    dataset_path = 'resources/dataset.xlsx'
    
    if not os.path.exists(dataset_path):
        print(f"Dataset not found at {dataset_path}")
        print("Available files in resources/:")
        if os.path.exists('resources'):
            for f in os.listdir('resources'):
                print(f"  - {f}")
        return
    
    results = {}
    
    easyocr_acc, easyocr_em = evaluate_easyocr(dataset_path)
    if easyocr_acc:
        results['EasyOCR'] = {'accuracy': easyocr_acc, 'exact_match': easyocr_em}
    
    checkpoints_dir = 'checkpoints'
    if os.path.exists(checkpoints_dir):
        for model_file in sorted(os.listdir(checkpoints_dir)):
            if model_file.endswith('.pt'):
                model_path = os.path.join(checkpoints_dir, model_file)
                
                label_map = {i: chr(0x06F0 + i) for i in range(10)}
                for i in range(10):
                    label_map[i] = str(i)
                for i in range(0x0600, 0x06FF):
                    label_map[len(label_map)] = chr(i)
                
                acc, em = evaluate_custom_model(dataset_path, model_path, label_map)
                if acc:
                    results[model_file] = {'accuracy': acc, 'exact_match': em}
    
    print("\n" + "="*60)
    print("FINAL COMPARISON RESULTS")
    print("="*60)
    print(f"{'Model':<30} {'Char Accuracy':>15} {'Exact Match':>15}")
    print("-"*60)
    
    for name, data in sorted(results.items(), key=lambda x: x[1]['accuracy'], reverse=True):
        print(f"{name:<30} {data['accuracy']:>14.2f}% {data['exact_match']:>14.2f}%")
    
    print("="*60)
    
    best = max(results.items(), key=lambda x: x[1]['accuracy'])
    print(f"\nBest model: {best[0]} with {best[1]['accuracy']:.2f}% accuracy")
    
    if 'EasyOCR' in results:
        diff = results['EasyOCR']['accuracy']
        if best[0] != 'EasyOCR':
            diff = best[1]['accuracy'] - results['EasyOCR']['accuracy']
            print(f"Improvement over EasyOCR: {diff:+.2f}%")
    
    print(f"\nCompleted: {datetime.now()}")


if __name__ == "__main__":
    main()