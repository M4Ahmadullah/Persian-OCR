#!/usr/bin/env python3
"""
Persian OCR Inference - Using trained custom models from checkpoints/
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
import numpy as np
import os
from models.crnn import CNN, SimpleCRNN

class ConvBlock(nn.Module):
    def __init__(self, in_channels, out_channels, kernel_size=3, stride=1, padding=1):
        super().__init__()
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size, stride, padding)
        self.bn = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        return self.relu(self.bn(self.conv(x)))


class CustomCRNN(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.conv1 = ConvBlock(1, 64)
        self.pool1 = nn.MaxPool2d(2, 2)
        
        self.conv2 = ConvBlock(64, 128)
        self.pool2 = nn.MaxPool2d(2, 2)
        
        self.conv3 = ConvBlock(128, 256)
        self.conv4 = ConvBlock(256, 256)
        self.pool3 = nn.MaxPool2d((2, 1), (2, 1))
        
        self.conv5 = ConvBlock(256, 512)
        self.conv6 = ConvBlock(512, 512)
        self.pool4 = nn.MaxPool2d((2, 1), (2, 1))
        
        self.conv7 = ConvBlock(512, 512)
        self.pool5 = nn.MaxPool2d((2, 1), (2, 1))
        
        self.map_to_seq = nn.Linear(512, 256)
        self.lstm1 = nn.LSTM(256, 256, bidirectional=True, batch_first=True)
        self.lstm2 = nn.LSTM(512, 256, bidirectional=True, batch_first=True)
        self.fc = nn.Linear(512, num_classes)

    def forward(self, x):
        x = self.pool1(self.conv1(x))
        x = self.pool2(self.conv2(x))
        x = self.pool3(self.conv4(self.conv3(x)))
        x = self.pool4(self.conv6(self.conv5(x)))
        x = self.pool5(self.conv7(x))
        
        batch, c, h, w = x.size()
        x = x.view(batch, c * h, w)
        x = x.permute(0, 2, 1)
        x = self.map_to_seq(x)
        
        lstm1, _ = self.lstm1(x)
        lstm2, _ = self.lstm2(lstm1)
        
        output = self.fc(lstm2)
        output = output.permute(1, 0, 2)
        return output


class PersianOCRInferencer:
    def __init__(self, model_path, num_classes=100, device='cuda'):
        self.device = device
        self.num_classes = num_classes
        
        print(f"Loading model from {model_path}...")
        self.model = CustomCRNN(num_classes)
        self.model.load_state_dict(torch.load(model_path, map_location=device))
        self.model.to(device)
        self.model.eval()
        
        self.ctc_blank = 0
        
    def preprocess_image(self, image_path, height=32):
        img = Image.open(image_path).convert('L')
        w, h = img.size
        new_w = int(w * height / h)
        img = img.resize((new_w, height), Image.LANCZOS)
        img_array = np.array(img).astype(np.float32) / 255.0
        img_tensor = torch.from_numpy(img_array).unsqueeze(0).unsqueeze(0)
        return img_tensor.to(self.device)
    
    def decode(self, outputs):
        _, preds = outputs.max(2)
        preds = preds.transpose(1, 0).contiguous().view(-1).cpu().numpy()
        
        decoded = []
        prev = None
        for p in preds:
            if p != prev and p != self.ctc_blank:
                decoded.append(p)
            prev = p
        return decoded
    
    def predict(self, image_path):
        img_tensor = self.preprocess_image(image_path)
        
        with torch.no_grad():
            outputs = self.model(img_tensor)
            outputs = outputs.log_softmax(2)
            
        return self.decode(outputs)


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python inference.py <image_path> [model_path]")
        sys.exit(1)
    
    image_path = sys.argv[1]
    model_path = sys.argv[2] if len(sys.argv) > 2 else "checkpoints/best_model.pt"
    
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    inferencer = PersianOCRInferencer(model_path, device=device)
    
    result = inferencer.predict(image_path)
    print("Predicted characters:", result)