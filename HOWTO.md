# Persian OCR - How To Use

## Starting the System

### Option 1: Run Both Servers (Recommended)
```bash
cd "OCR for persian"
./run.sh
```

This starts:
- Flask API on port **8080**
- Next.js frontend on port **3001**

Then open: **http://localhost:3001**

### Option 2: Manual Start

**Terminal 1 - Flask API:**
```bash
cd "OCR for persian/web"
python3 app.py
```

**Terminal 2 - Next.js:**
```bash
cd "OCR for persian/ocr-web"
npm run dev
```

---

## Stopping the Servers

### Kill all related processes:
```bash
lsof -ti:8080 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
```

### Or use run.sh script:
The script doesn't have a stop function - use the commands above.

---

## Testing the API

### Health Check:
```bash
curl http://localhost:8080/health
```

### Single Image OCR:
```bash
curl -X POST -F "file=@image.jpg" http://localhost:8080/ocr
```

### Batch OCR:
```bash
curl -X POST -F "files=@img1.jpg" -F "files=@img2.jpg" http://localhost:8080/batch
```

---

## First Time Setup

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Install Node dependencies:
   ```bash
   cd ocr-web
   npm install
   ```

3. First run will auto-download EasyOCR model (~100MB)

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| Port 8080 in use | Kill existing: `lsof -ti:8080 \| xargs kill -9` |
| Port 3001 in use | Kill existing: `lsof -ti:3001 \| xargs kill -9` |
| EasyOCR not found | Wait - first run downloads model automatically |
| No GPU detected | Will fall back to CPU (slower but works) |

---

## Performance

- **GPU (M3)**: ~0.5-1 second per image
- **CPU**: ~3-5 seconds per image
- **Memory**: ~2GB for 100 images batch

---

## Project Structure

```
OCR for persian/
├── run.sh            # Start both servers
├── web/              # Flask API (port 8080)
│   └── app.py
├── ocr-web/          # Next.js frontend (port 3001)
├── models/           # Trained models
├── checkpoints/      # Model checkpoints
├── health_check.py   # Evaluation script
└── README.md         # Project overview
```