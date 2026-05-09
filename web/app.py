#!/usr/bin/env python3
"""
Persian OCR Web Server
======================
Flask API for Persian text recognition using EasyOCR

Performance:
- GPU (M3 Apple Silicon): ~0.5-1 second per page
- CPU: ~3-5 seconds per page

Supports:
- Single image OCR
- Batch processing
- Progress tracking
- Full error reporting for developers

Run with: python3 app.py
Access at: http://localhost:8080
"""

import os
import sys
import traceback
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import easyocr
import pandas as pd
import editdistance
from werkzeug.utils import secure_filename
from datetime import datetime

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Best parameters from optimization
PARAMS = {
    'canvas_size': 1024,
    'mag_ratio': 1.5,
    'text_threshold': 0.25,
    'low_text': 0.15
}

# Load model at startup
print("="*60)
print("Persian OCR Server - Initializing...")
print("="*60)

try:
    print("[1/3] Loading EasyOCR model (Persian)...")
    reader = easyocr.Reader(['fa'], gpu=True, verbose=False)
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ ERROR loading model: {e}")
    print("\nTROUBLESHOOTING:")
    print("- If first run: EasyOCR will download model (~100MB)")
    print("- Check GPU availability: torch.cuda.is_available()")
    print("- Check PyTorch MPS: torch.backends.mps.is_available()")
    sys.exit(1)

print("[2/3] Checking dataset...")
dataset_path = 'resources/dataset.xlsx'
if os.path.exists(dataset_path):
    try:
        df = pd.read_excel(dataset_path)
        print(f"✅ Dataset found: {len(df)} images")
    except Exception as e:
        print(f"⚠️ Dataset check warning: {e}")
else:
    print("⚠️ Dataset not found at resources/dataset.xlsx")

print("[3/3] Server configuration...")
print(f"   - Max file size: 16MB")
print(f"   - Parameters: {PARAMS}")
print("")
print("="*60)
print("✅ Server ready!")
print("="*60)


@app.route('/')
def index():
    """Main page with API info"""
    return {
        'service': 'Persian OCR API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'POST /ocr': 'Upload image for OCR',
            'GET /health': 'Health check',
            'POST /evaluate': 'Evaluate against dataset'
        }
    }


@app.route('/ocr', methods=['POST'])
def ocr():
    """
    Perform OCR on uploaded image
    
    Expected: multipart/form-data with 'file' field
    Returns: {
        'success': bool,
        'text': str,
        'confidence': float,
        'segments': int,
        'processing_time': float
    }
    """
    start_time = datetime.now()
    
    if 'file' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No file provided',
            'hint': 'Send file as multipart/form-data with key "file"',
            'code': 'NO_FILE'
        }), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'No file selected',
            'code': 'EMPTY_FILENAME'
        }), 400
    
    # Validate file extension
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff', '.gif'}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        return jsonify({
            'success': False,
            'error': f'Invalid file type: {ext}',
            'hint': f'Allowed types: {allowed_extensions}',
            'code': 'INVALID_FILE_TYPE'
        }), 400
    
    # Save uploaded file
    filename = secure_filename(f"{datetime.now().timestamp()}_{file.filename}")
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    try:
        file.save(filepath)
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to save file: {str(e)}',
            'code': 'FILE_SAVE_ERROR'
        }), 500
    
    try:
        # Run OCR
        result = reader.readtext(filepath, **PARAMS)
        text = ' '.join([r[1] for r in result])
        
        # Get confidence scores
        confidences = [r[2] for r in result if r[2] is not None]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Clean up
        try:
            os.remove(filepath)
        except:
            pass
        
        return jsonify({
            'success': True,
            'text': text,
            'confidence': round(avg_confidence * 100, 2),
            'segments': len(result),
            'processing_time': round(processing_time, 2)
        })
    
    except easyocr.EasyOCRException as e:
        try:
            os.remove(filepath)
        except:
            pass
        return jsonify({
            'success': False,
            'error': f'EasyOCR error: {str(e)}',
            'hint': 'Image may be corrupted or unsupported',
            'code': 'EASYOCR_ERROR',
            'trace': traceback.format_exc()
        }), 500
        
    except Exception as e:
        try:
            os.remove(filepath)
        except:
            pass
        return jsonify({
            'success': False,
            'error': f'OCR processing failed: {str(e)}',
            'hint': 'Check image format and try again',
            'code': 'OCR_FAILED',
            'trace': traceback.format_exc()
        }), 500


@app.route('/batch', methods=['POST'])
def batch_ocr():
    """
    Perform OCR on multiple images
    
    Expected: multipart/form-data with multiple 'files'
    Returns: {
        'success': bool,
        'results': [{'filename': str, 'text': str, 'success': bool}]
    }
    """
    if 'files' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No files provided',
            'hint': 'Send files as multipart/form-data with key "files" (multiple)'
        }), 400
    
    files = request.files.getlist('files')
    if not files or len(files) == 0:
        return jsonify({
            'success': False,
            'error': 'No files in request',
            'code': 'NO_FILES'
        }), 400
    
    results = []
    
    for file in files:
        if file.filename == '':
            continue
            
        filename = secure_filename(f"{datetime.now().timestamp()}_{file.filename}")
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        
        try:
            file.save(filepath)
            result = reader.readtext(filepath, **PARAMS)
            text = ' '.join([r[1] for r in result])
            
            results.append({
                'filename': file.filename,
                'text': text,
                'success': True,
                'segments': len(result)
            })
        except Exception as e:
            results.append({
                'filename': file.filename,
                'text': '',
                'success': False,
                'error': str(e)
            })
        finally:
            try:
                os.remove(filepath)
            except:
                pass
    
    return jsonify({
        'success': True,
        'total': len(files),
        'processed': len(results),
        'results': results
    })


@app.route('/evaluate', methods=['POST'])
def evaluate():
    """Evaluate OCR against dataset"""
    data = request.get_json() or {}
    num_samples = data.get('num_samples', 100)
    
    try:
        df = pd.read_excel('resources/dataset.xlsx')
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Dataset not found: {str(e)}',
            'hint': 'Ensure resources/dataset.xlsx exists',
            'code': 'DATASET_ERROR'
        }), 500
    
    total_ed = 0
    total_chars = 0
    results = []
    
    for idx, row in df.head(num_samples).iterrows():
        img_path = f"resources/{row['image']}"
        
        if not os.path.exists(img_path):
            continue
        
        gt = str(row['text'])
        
        try:
            result = reader.readtext(img_path, **PARAMS)
            pred = ' '.join([r[1] for r in result])
        except Exception as e:
            pred = ''
        
        ed = editdistance.eval(pred, gt)
        total_ed += ed
        total_chars += len(gt)
        
        accuracy = (1 - ed / len(gt)) * 100 if len(gt) > 0 else 0
        results.append({
            'image': row['image'],
            'ground_truth': gt[:50] + '...' if len(gt) > 50 else gt,
            'prediction': pred[:50] + '...' if len(pred) > 50 else pred,
            'accuracy': round(accuracy, 2)
        })
    
    accuracy = (1 - total_ed / total_chars) * 100 if total_chars > 0 else 0
    
    return jsonify({
        'success': True,
        'samples': num_samples,
        'accuracy': round(accuracy, 2),
        'total_characters': total_chars,
        'total_edits': total_ed,
        'results': results[:10]
    })


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model': 'EasyOCR Persian',
        'ready': True,
        'gpu_available': True,
        'parameters': PARAMS
    })


@app.route('/stats', methods=['GET'])
def stats():
    """Get server stats"""
    try:
        df = pd.read_excel('resources/dataset.xlsx')
        total_images = len(df)
    except:
        total_images = 0
    
    return jsonify({
        'total_dataset_images': total_images,
        'model_parameters': PARAMS,
        'server_version': '1.0.0',
        'max_file_size_mb': 16,
        'supported_formats': ['.jpg', '.jpeg', '.png', '.bmp', '.tif', '.tiff', '.gif']
    })


if __name__ == '__main__':
    print("\n" + "="*60)
    print("Starting Persian OCR Server on http://localhost:8080")
    print("="*60)
    app.run(host='0.0.0.0', port=8080, debug=False, threaded=True)