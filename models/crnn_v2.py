import torch
import torch.nn as nn
import torch.nn.functional as F


class ConvBlock(nn.Module):
    def __init__(self, in_channels, out_channels, kernel_size=3, stride=1, padding=1, dropout=0.0):
        super().__init__()
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size, stride, padding)
        self.bn = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU(inplace=True)
        self.dropout = nn.Dropout(dropout) if dropout > 0 else None

    def forward(self, x):
        x = self.relu(self.bn(self.conv(x)))
        if self.dropout:
            x = self.dropout(x)
        return x


class DeepCNN(nn.Module):
    def __init__(self, in_channels=1):
        super().__init__()

        self.conv1 = ConvBlock(in_channels, 64)
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
        self.conv8 = ConvBlock(512, 512)
        self.pool5 = nn.MaxPool2d((2, 1), (2, 1))

    def forward(self, x):
        x = self.pool1(self.conv1(x))
        x = self.pool2(self.conv2(x))
        x = self.pool3(self.conv4(self.conv3(x)))
        x = self.pool4(self.conv6(self.conv5(x)))
        x = self.pool5(self.conv8(self.conv7(x)))
        return x


class AttentionCell(nn.Module):
    def __init__(self, input_dim, hidden_dim):
        super().__init__()
        self.W_i = nn.Linear(input_dim, hidden_dim)
        self.W_h = nn.Linear(hidden_dim, hidden_dim)
        self.v = nn.Linear(hidden_dim, 1)

    def forward(self, features, hidden):
        h = self.W_h(hidden)
        s = self.v(torch.tanh(self.W_i(features) + h.unsqueeze(1))).squeeze(-1)
        alpha = F.softmax(s, dim=1)
        context = (features * alpha.unsqueeze(-1)).sum(dim=1)
        return context, alpha


class CRNNv2(nn.Module):
    def __init__(self, num_classes, hidden_dim=256):
        super().__init__()
        self.cnn = DeepCNN()
        self.hidden_dim = hidden_dim
        self.num_classes = num_classes

        self.map_to_seq = nn.Linear(1024, hidden_dim)
        self.lstm1 = nn.LSTM(hidden_dim, hidden_dim, bidirectional=True, batch_first=True, dropout=0.3)
        self.lstm2 = nn.LSTM(hidden_dim * 2, hidden_dim, bidirectional=True, batch_first=True, dropout=0.3)

        self.attention = nn.Linear(hidden_dim * 2, 1)
        self.fc = nn.Linear(hidden_dim * 2, num_classes)

    def forward(self, x):
        conv = self.cnn(x)
        batch, c, h, w = conv.size()

        conv = conv.view(batch, c * h, w)
        conv = conv.permute(0, 2, 1)
        conv = self.map_to_seq(conv)

        lstm1, _ = self.lstm1(conv)
        lstm2, _ = self.lstm2(lstm1)

        output = self.fc(lstm2)
        output = output.permute(1, 0, 2)
        return output


def get_model_v2(num_classes):
    return CRNNv2(num_classes)