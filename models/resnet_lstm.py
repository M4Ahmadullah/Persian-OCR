import torch
import torch.nn as nn
import torchvision.models as models


class ResNetLSTM(nn.Module):
    def __init__(self, num_classes, hidden_dim=256):
        super().__init__()
        
        resnet = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        
        resnet.conv1 = nn.Conv2d(1, 64, kernel_size=7, stride=2, padding=3, bias=False)
        
        self.backbone = nn.Sequential(*list(resnet.children())[:-2])
        
        for param in self.backbone[:15].parameters():
            param.requires_grad = False
        
        self.pool = nn.AdaptiveAvgPool2d((1, None))
        
        self.map_to_seq = nn.Linear(512, hidden_dim)
        self.lstm1 = nn.LSTM(hidden_dim, hidden_dim, bidirectional=True, batch_first=True)
        self.lstm2 = nn.LSTM(hidden_dim * 2, hidden_dim, bidirectional=True, batch_first=True)
        self.fc = nn.Linear(hidden_dim * 2, num_classes)
        
    def forward(self, x):
        x = self.backbone(x)
        x = self.pool(x)
        
        batch, c, h, w = x.size()
        x = x.squeeze(2)
        x = x.permute(0, 2, 1)
        
        x = self.map_to_seq(x)
        
        x, _ = self.lstm1(x)
        x, _ = self.lstm2(x)
        
        x = self.fc(x)
        x = x.permute(1, 0, 2)
        
        return x


def get_resnet_lstm(num_classes):
    return ResNetLSTM(num_classes)