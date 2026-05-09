import torch
import torch.nn as nn
import torch.nn.functional as F

class ConvBlock(nn.Module):
    def __init__(self, in_channels, out_channels, kernel_size=3, stride=1, padding=1):
        super().__init__()
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size, stride, padding)
        self.bn = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        return self.relu(self.bn(self.conv(x)))

class CNN(nn.Module):
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
        self.pool5 = nn.MaxPool2d((2, 1), (2, 1))

    def forward(self, x):
        x = self.pool1(self.conv1(x))
        x = self.pool2(self.conv2(x))
        x = self.pool3(self.conv4(self.conv3(x)))
        x = self.pool4(self.conv6(self.conv5(x)))
        x = self.pool5(self.conv7(x))
        return x

class AttentionDecoder(nn.Module):
    def __init__(self, input_dim, hidden_dim, num_classes):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.num_classes = num_classes

        self.embedding = nn.Embedding(num_classes, hidden_dim)
        self.lstm = nn.LSTM(input_dim + hidden_dim, hidden_dim, bidirectional=True, batch_first=True)
        self.attention = nn.Linear(hidden_dim * 2, 1)
        self.fc = nn.Linear(hidden_dim * 2, num_classes)

    def forward(self, features, targets=None, max_len=50):
        batch_size = features.size(0)
        seq_len = features.size(1)

        if targets is None:
            start_token = torch.full((batch_size,), 0, dtype=torch.long, device=features.device)
            outputs = []
            hidden = None

            for t in range(max_len):
                if t == 0:
                    current_token = start_token
                else:
                    current_token = output.argmax(dim=-1)

                embedded = self.embedding(current_token)

                if hidden is None:
                    hidden_state = torch.zeros(2, batch_size, self.hidden_dim, device=features.device)
                    cell_state = torch.zeros(2, batch_size, self.hidden_dim, device=features.device)
                    hidden = (hidden_state, cell_state)

                context, hidden = self._attention_step(features, hidden, embedded)
                output = self.fc(context)
                outputs.append(output)

                current_token = output.argmax(dim=-1)

            outputs = torch.stack(outputs, dim=1)
            return outputs
        else:
            return self._teacher_forced(features, targets)

    def _attention_step(self, features, hidden, embedded):
        h_prev, c_prev = hidden
        h_prev = h_prev.permute(1, 0, 2)
        c_prev = c_prev.permute(1, 0, 2)

        attn_weights = torch.tanh(self.attention(torch.cat([h_prev[-1].unsqueeze(1).expand(-1, features.size(1), -1), features], dim=-1)))
        attn_weights = F.softmax(attn_weights, dim=1)
        context = torch.sum(attn_weights * features, dim=1)

        lstm_input = torch.cat([embedded, context], dim=-1)
        lstm_out, (h_new, c_new) = self.lstm(lstm_input.unsqueeze(1), (h_prev.permute(1, 0, 2), c_prev.permute(1, 0, 2)))

        return lstm_out.squeeze(1), (h_new.permute(1, 0, 2), c_new.permute(1, 0, 2))

    def _teacher_forced(self, features, targets):
        embedded = self.embedding(targets)
        lstm_out, _ = self.lstm(torch.cat([features, embedded], dim=-1))
        outputs = self.fc(lstm_out)
        return outputs


class PersianOCR(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.cnn = CNN()
        self.decoder = AttentionDecoder(512, 256, num_classes)

    def forward(self, x, targets=None):
        features = self.cnn(x)
        features = features.permute(0, 3, 1, 2)
        features = features.mean(2)
        features = features.permute(0, 2, 1)
        return self.decoder(features, targets)


class SimpleCRNN(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.cnn = CNN()
        self.map_to_seq = nn.Linear(1024, 256)
        self.lstm1 = nn.LSTM(256, 256, bidirectional=True, batch_first=True)
        self.lstm2 = nn.LSTM(512, 256, bidirectional=True, batch_first=True)
        self.fc = nn.Linear(512, num_classes)

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


def get_model(num_classes, model_type='crnn'):
    if model_type == 'attention':
        return PersianOCR(num_classes)
    return SimpleCRNN(num_classes)