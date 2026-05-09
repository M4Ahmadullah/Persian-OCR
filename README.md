# Persian OCR System

A complete local Persian OCR system using EasyOCR with a web interface.

## Features

- **Local Processing**: 100% offline, no internet required
- **GPU Accelerated**: Fast inference on Apple Silicon M3
- **Web Interface**: User-friendly Next.js frontend
- **Batch Processing**: Process multiple images at once
- **Custom Models**: Support for custom trained CRNN models

## Quick Start

```bash
# Clone the repository
git clone https://github.com/M4Ahmadullah/OCR-LLM-for-Persian-Language.git
cd OCR-LLM-for-Persian-Language

# Install Python dependencies
pip install -r requirements.txt

# Install Node dependencies
cd ocr-web && npm install && cd ..

# Start the system
./run.sh
```

Open **http://localhost:3001** in your browser.

## Manual Start

### Terminal 1 - Flask API (port 8080):
```bash
cd web
python3 app.py
```

### Terminal 2 - Next.js Frontend (port 3001):
```bash
cd ocr-web
npm run dev
```

## Stopping the Servers

```bash
lsof -ti:8080 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

## Performance

| Hardware | Time per Image |
|----------|---------------|
| GPU (M3 Apple Silicon) | 0.5-1 second |
| CPU | 3-5 seconds |

## Project Structure

```
OCR-LLM-for-Persian-Language/
├── run.sh                    # Start both servers
├── web/                      # Flask API
│   └── app.py                # OCR endpoints
├── ocr-web/                  # Next.js frontend
│   └── src/app/              # React UI
├── data/                     # Dataset images
│   └── images/               # Badr, Compset, Lotus, Mitra, Nazanin, Roya
├── checkpoints/              # Trained model weights
├── models/                   # Model architecture
├── inference.py              # Custom model inference
├── evaluate_comparison.py    # Model comparison script
├── health_check.py           # Evaluation script
├── dataset.xlsx              # Ground truth labels
├── requirements.txt          # Python dependencies
├── README.md                 # This file
└── HOWTO.md                  # Detailed usage guide
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ocr` | POST | Single image OCR |
| `/batch` | POST | Multiple images |
| `/health` | GET | Server status |
| `/evaluate` | POST | Test accuracy |

## Testing API

```bash
# Health check
curl http://localhost:8080/health

# Single image
curl -X POST -F "file=@image.jpg" http://localhost:8080/ocr
```

## Evaluation

Run accuracy evaluation on the dataset:
```bash
python3 health_check.py
```

## Requirements

- Python 3.8+
- Node.js 18+
- 16GB RAM recommended
- Apple Silicon M3 (optional for GPU acceleration)

## License

MIT