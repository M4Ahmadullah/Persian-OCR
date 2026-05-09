#!/usr/bin/env python3
"""
Persian OCR Health Check - Full evaluation script
Saves results to health_report.txt
"""

import easyocr
import pandas as pd
import editdistance
import os
from datetime import datetime


def evaluate_full():
    print("="*60)
    print("Persian OCR Health Check")
    print("="*60)
    print(f"Started: {datetime.now()}")
    
    # Best parameters from grid search
    params = {
        'canvas_size': 1024,
        'mag_ratio': 1.5,
        'text_threshold': 0.25,
        'low_text': 0.15
    }
    
    print("\nLoading EasyOCR model...")
    reader = easyocr.Reader(['fa'], gpu=True, verbose=False)
    print("Model loaded!")
    
    df = pd.read_excel('resources/dataset.xlsx')
    total_images = len(df)
    print(f"Total images: {total_images}")
    
    total_ed = 0
    total_chars = 0
    correct = 0
    
    print("\nRunning evaluation...")
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
            current_acc = 100 * (1 - total_ed / total_chars)
            print(f"Progress: {idx + 1}/{total_images} | Current: {current_acc:.2f}%")
    
    accuracy = (1 - total_ed / total_chars) * 100 if total_chars > 0 else 0
    exact_match = (correct / total_images) * 100
    
    print("\n" + "="*60)
    print("RESULTS")
    print("="*60)
    print(f"Total Images: {total_images}")
    print(f"Character Accuracy: {accuracy:.2f}%")
    print(f"Exact Match: {exact_match:.2f}%")
    print(f"Total Characters: {total_chars}")
    print(f"Total Edits: {total_ed}")
    print(f"Completed: {datetime.now()}")
    print("="*60)
    
    # Save to health report
    with open('health_report.txt', 'w') as f:
        f.write("="*60 + "\n")
        f.write("Persian OCR Health Report\n")
        f.write("="*60 + "\n")
        f.write(f"Date: {datetime.now()}\n")
        f.write(f"Model: EasyOCR (Persian)\n")
        f.write(f"Parameters: canvas=1024, mag_ratio=1.5, text_thresh=0.25, low_text=0.15\n")
        f.write("\n")
        f.write(f"Total Images: {total_images}\n")
        f.write(f"Character Accuracy: {accuracy:.2f}%\n")
        f.write(f"Exact Match: {exact_match:.2f}%\n")
        f.write(f"Total Characters: {total_chars}\n")
        f.write(f"Total Edits: {total_ed}\n")
        f.write("="*60 + "\n")
    
    print("\nSaved to health_report.txt")
    
    return accuracy, exact_match, total_images


if __name__ == "__main__":
    acc, em, total = evaluate_full()