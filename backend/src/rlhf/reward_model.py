# reward_model.py - Reward model for RLHF training
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from typing import Dict, List, Tuple
import json
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RewardModel(nn.Module):
    """
    Reward model for learning teacher preferences
    Input: State encoding + Action encoding
    Output: Scalar reward value
    """
    
    def __init__(self, state_dim=512, action_dim=128, hidden_dim=256):
        super(RewardModel, self).__init__()
        
        # State encoder
        self.state_encoder = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU()
        )
        
        # Action encoder
        self.action_encoder = nn.Sequential(
            nn.Linear(action_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_dim // 2, hidden_dim // 4),
            nn.ReLU()
        )
        
        # Fusion and reward head
        fusion_dim = hidden_dim // 2 + hidden_dim // 4
        self.reward_head = nn.Sequential(
            nn.Linear(fusion_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_dim // 2, 64),
            nn.ReLU(),
            nn.Linear(64, 1)  # Single scalar reward
        )
        
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.to(self.device)
        
    def forward(self, state, action):
        """
        Forward pass through the reward model
        Args:
            state: State tensor [batch_size, state_dim]
            action: Action tensor [batch_size, action_dim]
        Returns:
            reward: Scalar reward [batch_size, 1]
        """
        state_features = self.state_encoder(state)
        action_features = self.action_encoder(action)
        
        # Concatenate features
        combined = torch.cat([state_features, action_features], dim=-1)
        
        # Generate reward
        reward = self.reward_head(combined)
        
        return reward
    
    def compute_loss(self, state_batch, preferred_actions, rejected_actions):
        """
        Compute preference loss: R(s, a_preferred) > R(s, a_rejected)
        Using Bradley-Terry model
        """
        # Get rewards for preferred and rejected actions
        preferred_rewards = self.forward(state_batch, preferred_actions)
        rejected_rewards = self.forward(state_batch, rejected_actions)
        
        # Bradley-Terry loss: -log(sigmoid(r_preferred - r_rejected))
        loss = -torch.mean(torch.log(torch.sigmoid(preferred_rewards - rejected_rewards)))
        
        return loss, preferred_rewards.mean(), rejected_rewards.mean()


class StateEncoder:
    """
    Encodes 3D scene state into fixed-size vector
    """
    
    def __init__(self, max_objects=50, object_feature_dim=13):
        self.max_objects = max_objects
        self.object_feature_dim = object_feature_dim
        self.state_dim = max_objects * object_feature_dim + 7  # +7 for camera position/rotation
        
    def encode(self, scene_state: Dict) -> np.ndarray:
        """
        Encode scene state to fixed-size vector
        """
        # Initialize state vector
        state_vector = np.zeros(self.state_dim)
        
        if not scene_state:
            return state_vector
        
        # Encode objects
        objects = scene_state.get('objects', [])
        for i, obj in enumerate(objects[:self.max_objects]):
            start_idx = i * self.object_feature_dim
            
            # Object features: position (3), rotation (3), scale (3), type (1), color (3)
            features = []
            
            # Position
            pos = obj.get('position', {})
            features.extend([pos.get('x', 0), pos.get('y', 0), pos.get('z', 0)])
            
            # Rotation
            rot = obj.get('rotation', {})
            features.extend([rot.get('x', 0), rot.get('y', 0), rot.get('z', 0)])
            
            # Scale
            scale = obj.get('scale', {})
            features.extend([scale.get('x', 1), scale.get('y', 1), scale.get('z', 1)])
            
            # Object type (encoded as integer)
            type_map = {'cube': 1, 'sphere': 2, 'cylinder': 3, 'cone': 4, 'torus': 5, 'pyramid': 6}
            obj_type = type_map.get(obj.get('type', 'cube'), 0)
            features.append(obj_type)
            
            # Color (RGB normalized)
            material = obj.get('material', {})
            color_hex = material.get('color', '#ffffff')
            try:
                color_int = int(color_hex.replace('#', ''), 16)
                r = ((color_int >> 16) & 255) / 255.0
                g = ((color_int >> 8) & 255) / 255.0
                b = (color_int & 255) / 255.0
                features.extend([r, g, b])
            except:
                features.extend([1.0, 1.0, 1.0])
            
            # Set features in state vector
            state_vector[start_idx:start_idx + self.object_feature_dim] = features
        
        # Encode camera (last 7 elements)
        camera = scene_state.get('camera', {})
        cam_pos = camera.get('position', {})
        cam_rot = camera.get('rotation', {})
        
        camera_features = [
            cam_pos.get('x', 5), cam_pos.get('y', 5), cam_pos.get('z', 5),
            cam_rot.get('x', 0), cam_rot.get('y', 0), cam_rot.get('z', 0),
            scene_state.get('timestamp', 0) / 1e9  # Normalize timestamp
        ]
        
        state_vector[-7:] = camera_features
        
        return state_vector


class ActionEncoder:
    """
    Encodes user actions (gestures) into fixed-size vector
    """
    
    def __init__(self):
        self.action_dim = 128
        self.gesture_types = [
            'TAP', 'DOUBLE_TAP', 'DRAG', 'PINCH', 'ROTATE', 
            'PAN', 'TRIPLE_TAP', 'LONG_PRESS', 'SWIPE'
        ]
        
    def encode(self, action: Dict) -> np.ndarray:
        """
        Encode action to fixed-size vector
        """
        action_vector = np.zeros(self.action_dim)
        
        if not action:
            return action_vector
        
        # Gesture type (one-hot encoding)
        gesture_type = action.get('gesture_type', '')
        if gesture_type in self.gesture_types:
            type_idx = self.gesture_types.index(gesture_type)
            action_vector[type_idx] = 1.0
        
        # Parameters encoding
        params = action.get('parameters', {})
        param_start = len(self.gesture_types)
        
        # Common parameters
        if 'x' in params:
            action_vector[param_start] = params['x'] / 1000.0  # Normalize
        if 'y' in params:
            action_vector[param_start + 1] = params['y'] / 1000.0
        if 'deltaX' in params:
            action_vector[param_start + 2] = params['deltaX'] / 500.0
        if 'deltaY' in params:
            action_vector[param_start + 3] = params['deltaY'] / 500.0
        if 'scaleFactor' in params:
            action_vector[param_start + 4] = params['scaleFactor']
        if 'rotation' in params:
            action_vector[param_start + 5] = params['rotation'] / (2 * np.pi)
        if 'force' in params:
            action_vector[param_start + 6] = params['force']
        
        # Object ID hash (simplified)
        if 'objectId' in params:
            # Simple hash to get a normalized value
            obj_id = params['objectId']
            hash_val = sum(ord(c) for c in str(obj_id)) % 1000
            action_vector[param_start + 7] = hash_val / 1000.0
        
        return action_vector


class RLHFTrainer:
    """
    Trainer for the reward model using teacher demonstrations
    """
    
    def __init__(self, model: RewardModel, learning_rate=1e-4):
        self.model = model
        self.optimizer = optim.Adam(model.parameters(), lr=learning_rate)
        self.state_encoder = StateEncoder()
        self.action_encoder = ActionEncoder()
        self.training_history = []
        
    def prepare_batch(self, preference_pairs: List[Dict]) -> Tuple[torch.Tensor, ...]:
        """
        Prepare batch of preference pairs for training
        """
        states = []
        preferred_actions = []
        rejected_actions = []
        
        for pair in preference_pairs:
            # Encode state
            state_vec = self.state_encoder.encode(pair['state'])
            states.append(state_vec)
            
            # Encode preferred action
            preferred_vec = self.action_encoder.encode(pair['preferred'])
            preferred_actions.append(preferred_vec)
            
            # Encode rejected action
            rejected_vec = self.action_encoder.encode(pair['rejected'])
            rejected_actions.append(rejected_vec)
        
        # Convert to tensors
        state_batch = torch.FloatTensor(np.array(states)).to(self.model.device)
        preferred_batch = torch.FloatTensor(np.array(preferred_actions)).to(self.model.device)
        rejected_batch = torch.FloatTensor(np.array(rejected_actions)).to(self.model.device)
        
        return state_batch, preferred_batch, rejected_batch
    
    def train_step(self, preference_pairs: List[Dict]) -> Dict:
        """
        Single training step
        """
        # Prepare batch
        state_batch, preferred_batch, rejected_batch = self.prepare_batch(preference_pairs)
        
        # Zero gradients
        self.optimizer.zero_grad()
        
        # Compute loss
        loss, pref_reward, rej_reward = self.model.compute_loss(
            state_batch, preferred_batch, rejected_batch
        )
        
        # Backward pass
        loss.backward()
        
        # Gradient clipping
        torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
        
        # Update weights
        self.optimizer.step()
        
        # Log metrics
        metrics = {
            'loss': loss.item(),
            'preferred_reward': pref_reward.item(),
            'rejected_reward': rej_reward.item(),
            'reward_gap': (pref_reward - rej_reward).item()
        }
        
        return metrics
    
    def train_epoch(self, training_data: List[Dict], batch_size=32):
        """
        Train for one epoch
        """
        num_batches = len(training_data) // batch_size
        epoch_metrics = []
        
        # Shuffle data
        np.random.shuffle(training_data)
        
        for i in range(num_batches):
            batch = training_data[i * batch_size:(i + 1) * batch_size]
            metrics = self.train_step(batch)
            epoch_metrics.append(metrics)
            
            if i % 10 == 0:
                logger.info(f"Batch {i}/{num_batches}: Loss={metrics['loss']:.4f}, "
                          f"Reward Gap={metrics['reward_gap']:.4f}")
        
        # Average metrics
        avg_metrics = {
            'loss': np.mean([m['loss'] for m in epoch_metrics]),
            'preferred_reward': np.mean([m['preferred_reward'] for m in epoch_metrics]),
            'rejected_reward': np.mean([m['rejected_reward'] for m in epoch_metrics]),
            'reward_gap': np.mean([m['reward_gap'] for m in epoch_metrics])
        }
        
        self.training_history.append({
            'timestamp': datetime.now().isoformat(),
            'metrics': avg_metrics
        })
        
        return avg_metrics
    
    def evaluate(self, test_data: List[Dict]) -> Dict:
        """
        Evaluate model on test data
        """
        self.model.eval()
        
        with torch.no_grad():
            state_batch, preferred_batch, rejected_batch = self.prepare_batch(test_data)
            
            # Get rewards
            preferred_rewards = self.model(state_batch, preferred_batch)
            rejected_rewards = self.model(state_batch, rejected_batch)
            
            # Calculate accuracy (preferred > rejected)
            accuracy = torch.mean(
                (preferred_rewards > rejected_rewards).float()
            ).item()
            
            # Average reward gap
            reward_gap = torch.mean(preferred_rewards - rejected_rewards).item()
        
        self.model.train()
        
        return {
            'accuracy': accuracy,
            'reward_gap': reward_gap
        }
    
    def save_model(self, path='reward_model.pth'):
        """
        Save model checkpoint
        """
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'training_history': self.training_history
        }, path)
        logger.info(f"Model saved to {path}")
    
    def load_model(self, path='reward_model.pth'):
        """
        Load model checkpoint
        """
        checkpoint = torch.load(path, map_location=self.model.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.training_history = checkpoint.get('training_history', [])
        logger.info(f"Model loaded from {path}")


# Example usage
if __name__ == "__main__":
    # Initialize model
    reward_model = RewardModel(state_dim=657, action_dim=128)
    trainer = RLHFTrainer(reward_model)
    
    # Example preference pair
    example_pair = {
        'state': {
            'objects': [
                {
                    'id': 'obj1',
                    'type': 'cube',
                    'position': {'x': 0, 'y': 1, 'z': 0},
                    'rotation': {'x': 0, 'y': 0, 'z': 0},
                    'scale': {'x': 1, 'y': 1, 'z': 1},
                    'material': {'color': '#ff0000'}
                }
            ],
            'camera': {
                'position': {'x': 5, 'y': 5, 'z': 5},
                'rotation': {'x': 0, 'y': 0, 'z': 0}
            }
        },
        'preferred': {
            'gesture_type': 'DRAG',
            'parameters': {'x': 100, 'y': 200, 'objectId': 'obj1'}
        },
        'rejected': {
            'gesture_type': 'TAP',
            'parameters': {'x': 50, 'y': 50}
        }
    }
    
    # Train on example
    metrics = trainer.train_step([example_pair])
    print("Training metrics:", metrics)
    
    # Save model
    trainer.save_model('math_education_reward_model.pth')
