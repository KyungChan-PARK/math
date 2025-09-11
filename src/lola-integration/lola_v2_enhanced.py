"""
LOLA-Enhanced Mathematical Intent Learning System v2.0
Based on official PolymathicAI implementation
Integrating VAE + Diffusion Model for 1000x compression
"""

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, List, Tuple, Optional, Union
import json
import time
from dataclasses import dataclass, asdict
from pathlib import Path
import hashlib

# ===========================
# PART 1: Enhanced VAE Architecture
# ===========================

class ConvBlock(nn.Module):
    """Convolutional block with residual connection"""
    def __init__(self, in_channels, out_channels, kernel_size=3, stride=1):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size, stride, padding=kernel_size//2)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size, 1, padding=kernel_size//2)
        self.bn2 = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU(inplace=True)
        
        # Residual connection
        self.residual = nn.Conv2d(in_channels, out_channels, 1, stride) if in_channels != out_channels or stride != 1 else nn.Identity()
    
    def forward(self, x):
        residual = self.residual(x)
        
        out = self.conv1(x)
        out = self.bn1(out)
        out = self.relu(out)
        
        out = self.conv2(out)
        out = self.bn2(out)
        
        out += residual
        out = self.relu(out)
        
        return out

class EnhancedVAEEncoder(nn.Module):
    """
    Enhanced VAE Encoder based on LOLA architecture
    Supports multiple compression rates: 4x, 16x, 64x, 256x, 1000x
    """
    def __init__(self, input_channels=2, latent_channels=64, compression_factor=32):
        super().__init__()
        self.compression_factor = compression_factor
        self.latent_channels = latent_channels
        
        # Calculate downsampling layers needed
        self.n_downsample = int(np.log2(compression_factor))
        
        # Initial projection
        self.input_conv = nn.Sequential(
            nn.Conv2d(input_channels, 64, 7, 1, 3),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True)
        )
        
        # Encoder blocks with progressive downsampling
        encoder_blocks = []
        channels = 64
        for i in range(self.n_downsample):
            out_channels = min(channels * 2, 512)  # Cap at 512 channels
            encoder_blocks.append(ConvBlock(channels, out_channels, stride=2))
            channels = out_channels
        
        self.encoder = nn.Sequential(*encoder_blocks)
        
        # Latent projection
        self.mu_proj = nn.Conv2d(channels, latent_channels, 1)
        self.logvar_proj = nn.Conv2d(channels, latent_channels, 1)
        
    def forward(self, x):
        # Encode
        h = self.input_conv(x)
        h = self.encoder(h)
        
        # Project to latent
        mu = self.mu_proj(h)
        logvar = self.logvar_proj(h)
        
        # Reparameterization trick
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        z = mu + eps * std
        
        return z, mu, logvar

class EnhancedVAEDecoder(nn.Module):
    """
    Enhanced VAE Decoder based on LOLA architecture
    """
    def __init__(self, latent_channels=64, output_channels=2, compression_factor=32):
        super().__init__()
        self.compression_factor = compression_factor
        self.n_upsample = int(np.log2(compression_factor))
        
        # Initial projection from latent
        self.latent_proj = nn.Sequential(
            nn.Conv2d(latent_channels, 512, 1),
            nn.BatchNorm2d(512),
            nn.ReLU(inplace=True)
        )
        
        # Decoder blocks with progressive upsampling
        decoder_blocks = []
        channels = 512
        for i in range(self.n_upsample):
            out_channels = max(channels // 2, 64)
            decoder_blocks.append(
                nn.Sequential(
                    nn.ConvTranspose2d(channels, out_channels, 4, 2, 1),
                    nn.BatchNorm2d(out_channels),
                    nn.ReLU(inplace=True),
                    ConvBlock(out_channels, out_channels)
                )
            )
            channels = out_channels
        
        self.decoder = nn.Sequential(*decoder_blocks)
        
        # Output projection
        self.output_conv = nn.Sequential(
            nn.Conv2d(channels, output_channels, 7, 1, 3),
            nn.Tanh()  # Normalize output to [-1, 1]
        )
        
    def forward(self, z):
        h = self.latent_proj(z)
        h = self.decoder(h)
        out = self.output_conv(h)
        return out

class LOLAEnhancedVAE(nn.Module):
    """
    Complete VAE model for LOLA compression
    """
    def __init__(self, input_channels=2, latent_channels=64, compression_factor=32):
        super().__init__()
        self.encoder = EnhancedVAEEncoder(input_channels, latent_channels, compression_factor)
        self.decoder = EnhancedVAEDecoder(latent_channels, input_channels, compression_factor)
        self.compression_factor = compression_factor
        
    def forward(self, x):
        z, mu, logvar = self.encoder(x)
        recon = self.decoder(z)
        return recon, mu, logvar
    
    def encode(self, x):
        z, mu, logvar = self.encoder(x)
        return z
    
    def decode(self, z):
        return self.decoder(z)
    
    def loss(self, x, recon, mu, logvar, beta=0.001):
        """
        VAE loss with physics-preserving terms
        """
        # Reconstruction loss
        recon_loss = F.mse_loss(recon, x, reduction='mean')
        
        # KL divergence
        kl_loss = -0.5 * torch.mean(1 + logvar - mu.pow(2) - logvar.exp())
        
        # Physics preservation loss (gradient matching)
        dx_true = torch.gradient(x, dim=-1)[0]
        dx_recon = torch.gradient(recon, dim=-1)[0]
        dy_true = torch.gradient(x, dim=-2)[0]
        dy_recon = torch.gradient(recon, dim=-2)[0]
        
        gradient_loss = F.mse_loss(dx_recon, dx_true) + F.mse_loss(dy_recon, dy_true)
        
        # Total loss
        total_loss = recon_loss + beta * kl_loss + 0.1 * gradient_loss
        
        return {
            'total': total_loss,
            'recon': recon_loss,
            'kl': kl_loss,
            'gradient': gradient_loss
        }

# ===========================
# PART 2: Diffusion Model Integration
# ===========================

class DiffusionModel(nn.Module):
    """
    Denoising Diffusion Probabilistic Model for latent space
    Based on LOLA's approach
    """
    def __init__(self, latent_channels=64, hidden_dim=256, num_steps=1000):
        super().__init__()
        self.num_steps = num_steps
        self.latent_channels = latent_channels
        
        # Beta schedule (linear)
        self.register_buffer('betas', torch.linspace(0.0001, 0.02, num_steps))
        self.register_buffer('alphas', 1 - self.betas)
        self.register_buffer('alphas_cumprod', torch.cumprod(self.alphas, 0))
        
        # U-Net architecture for denoising
        self.denoise_net = nn.Sequential(
            nn.Conv2d(latent_channels * 2, hidden_dim, 3, 1, 1),  # *2 for concatenated noisy + time
            nn.GroupNorm(8, hidden_dim),
            nn.ReLU(inplace=True),
            
            ConvBlock(hidden_dim, hidden_dim),
            ConvBlock(hidden_dim, hidden_dim),
            ConvBlock(hidden_dim, hidden_dim),
            
            nn.Conv2d(hidden_dim, latent_channels, 3, 1, 1)
        )
        
        # Time embedding
        self.time_embed = nn.Sequential(
            nn.Linear(1, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim)
        )
        
    def forward_diffusion(self, x0, t):
        """Add noise to x0 at timestep t"""
        noise = torch.randn_like(x0)
        alpha_t = self.alphas_cumprod[t].view(-1, 1, 1, 1)
        
        xt = torch.sqrt(alpha_t) * x0 + torch.sqrt(1 - alpha_t) * noise
        return xt, noise
    
    def predict_noise(self, xt, t):
        """Predict noise from xt at timestep t"""
        # Time embedding
        t_embed = self.time_embed(t.float().view(-1, 1))
        t_embed = t_embed.view(-1, t_embed.size(1), 1, 1)
        t_embed = t_embed.expand(-1, -1, xt.size(2), xt.size(3))
        
        # Concatenate noisy latent with time
        x_input = torch.cat([xt, t_embed[:, :self.latent_channels]], dim=1)
        
        # Predict noise
        predicted_noise = self.denoise_net(x_input)
        return predicted_noise
    
    @torch.no_grad()
    def sample(self, shape, device):
        """Generate samples through reverse diffusion"""
        # Start from random noise
        x = torch.randn(shape, device=device)
        
        for t in reversed(range(self.num_steps)):
            t_batch = torch.full((shape[0],), t, device=device, dtype=torch.long)
            
            # Predict noise
            predicted_noise = self.predict_noise(x, t_batch)
            
            # Denoise step
            alpha = self.alphas[t]
            alpha_cumprod = self.alphas_cumprod[t]
            
            if t > 0:
                noise = torch.randn_like(x)
                sigma = torch.sqrt(self.betas[t])
            else:
                noise = 0
                sigma = 0
            
            x = (1 / torch.sqrt(alpha)) * (
                x - ((1 - alpha) / torch.sqrt(1 - alpha_cumprod)) * predicted_noise
            ) + sigma * noise
        
        return x

# ===========================
# PART 3: Enhanced Intent Learning System
# ===========================

class LOLAv2IntentSystem:
    """
    Enhanced LOLA-based Intent Learning System v2.0
    With VAE + Diffusion Model for up to 1000x compression
    """
    def __init__(self, compression_factor=256, latent_dim=64, device='cuda' if torch.cuda.is_available() else 'cpu'):
        self.device = device
        self.compression_factor = compression_factor
        self.latent_dim = latent_dim
        
        # Initialize models
        self.vae = LOLAEnhancedVAE(
            input_channels=2,  # x, y coordinates
            latent_channels=latent_dim,
            compression_factor=compression_factor
        ).to(device)
        
        self.diffusion = DiffusionModel(
            latent_channels=latent_dim,
            hidden_dim=256,
            num_steps=100  # Reduced for faster inference
        ).to(device)
        
        # Training state
        self.optimizer_vae = torch.optim.Adam(self.vae.parameters(), lr=1e-4)
        self.optimizer_diffusion = torch.optim.Adam(self.diffusion.parameters(), lr=1e-4)
        
        # Intent learning history
        self.attempt_history = []
        self.latent_history = []
        self.session_id = self._generate_session_id()
        
    def _generate_session_id(self):
        timestamp = str(time.time())
        return hashlib.md5(timestamp.encode()).hexdigest()[:8]
    
    def stroke_to_tensor(self, stroke_points, size=(64, 64)):
        """Convert stroke points to 2D tensor representation"""
        tensor = torch.zeros(1, 2, size[0], size[1])
        
        if len(stroke_points) < 2:
            return tensor
        
        # Create density map from points
        for i, point in enumerate(stroke_points):
            x = int(point[0] * size[0])
            y = int(point[1] * size[1])
            
            if 0 <= x < size[0] and 0 <= y < size[1]:
                # X channel: position
                tensor[0, 0, y, x] = 1.0
                # Y channel: temporal information (stroke order)
                tensor[0, 1, y, x] = i / len(stroke_points)
        
        # Apply Gaussian blur for continuity
        from scipy.ndimage import gaussian_filter
        tensor[0, 0] = torch.tensor(gaussian_filter(tensor[0, 0].numpy(), sigma=1.0))
        tensor[0, 1] = torch.tensor(gaussian_filter(tensor[0, 1].numpy(), sigma=1.0))
        
        return tensor.to(self.device)
    
    def encode_attempt(self, stroke_data):
        """Encode drawing attempt to latent space using VAE"""
        # Convert stroke to tensor
        stroke_tensor = self.stroke_to_tensor(stroke_data['points'])
        
        # Encode with VAE
        with torch.no_grad():
            latent = self.vae.encode(stroke_tensor)
        
        return latent
    
    def analyze_intent(self, min_attempts=5):
        """Analyze user intent from latent history"""
        if len(self.latent_history) < min_attempts:
            return None
        
        # Stack latent vectors
        latents = torch.stack(self.latent_history[-10:])  # Last 10 attempts
        
        # Analyze convergence in latent space
        mean_latent = latents.mean(0)
        std_latent = latents.std(0)
        
        # Calculate confidence based on consistency
        confidence = 1.0 / (1.0 + std_latent.mean().item())
        
        # Use diffusion model to generate refined suggestion
        if confidence > 0.6:
            # Generate multiple samples and pick best
            samples = []
            for _ in range(5):
                sample = self.diffusion.sample(
                    mean_latent.shape,
                    self.device
                )
                samples.append(sample)
            
            # Select best sample (closest to mean)
            samples = torch.stack(samples)
            distances = ((samples - mean_latent.unsqueeze(0)) ** 2).mean(dim=(1, 2, 3))
            best_idx = distances.argmin()
            best_sample = samples[best_idx]
            
            return {
                'latent': best_sample,
                'confidence': confidence,
                'convergence_rate': 1.0 / (1.0 + std_latent.mean().item())
            }
        
        return None
    
    def decode_suggestion(self, latent):
        """Decode latent to visual suggestion"""
        with torch.no_grad():
            decoded = self.vae.decode(latent)
        
        # Convert to numpy for visualization
        decoded_np = decoded[0].cpu().numpy()
        
        # Extract x, y coordinates from density maps
        x_map = decoded_np[0]
        y_map = decoded_np[1]
        
        # Find peak points for curve reconstruction
        from scipy.signal import find_peaks
        from scipy.interpolate import interp1d
        
        # Get contour of the shape
        threshold = x_map.max() * 0.1
        y_coords, x_coords = np.where(x_map > threshold)
        
        if len(x_coords) > 0:
            # Sort by temporal information
            temporal_values = [y_map[y, x] for x, y in zip(x_coords, y_coords)]
            sorted_indices = np.argsort(temporal_values)
            
            x_sorted = x_coords[sorted_indices] / x_map.shape[1]
            y_sorted = y_coords[sorted_indices] / x_map.shape[0]
            
            # Smooth the curve
            if len(x_sorted) > 3:
                from scipy.interpolate import UnivariateSpline
                t = np.linspace(0, 1, len(x_sorted))
                t_smooth = np.linspace(0, 1, 100)
                
                spl_x = UnivariateSpline(t, x_sorted, s=0.01)
                spl_y = UnivariateSpline(t, y_sorted, s=0.01)
                
                x_smooth = spl_x(t_smooth)
                y_smooth = spl_y(t_smooth)
            else:
                x_smooth = x_sorted
                y_smooth = y_sorted
            
            return {
                'x': x_smooth.tolist(),
                'y': y_smooth.tolist(),
                'type': 'optimized_curve',
                'compression_rate': self.compression_factor,
                'quality_score': float(x_map.max())
            }
        
        return None
    
    def train_on_batch(self, batch_strokes):
        """Train VAE and diffusion model on batch of strokes"""
        # Convert strokes to tensors
        tensors = []
        for stroke in batch_strokes:
            tensor = self.stroke_to_tensor(stroke['points'])
            tensors.append(tensor)
        
        batch = torch.cat(tensors, dim=0)
        
        # Train VAE
        self.optimizer_vae.zero_grad()
        recon, mu, logvar = self.vae(batch)
        losses = self.vae.loss(batch, recon, mu, logvar)
        losses['total'].backward()
        self.optimizer_vae.step()
        
        # Train diffusion model
        with torch.no_grad():
            latents = self.vae.encode(batch)
        
        self.optimizer_diffusion.zero_grad()
        
        # Random timesteps
        t = torch.randint(0, self.diffusion.num_steps, (batch.size(0),), device=self.device)
        
        # Forward diffusion
        noisy_latents, noise = self.diffusion.forward_diffusion(latents, t)
        
        # Predict noise
        predicted_noise = self.diffusion.predict_noise(noisy_latents, t)
        
        # Loss
        diffusion_loss = F.mse_loss(predicted_noise, noise)
        diffusion_loss.backward()
        self.optimizer_diffusion.step()
        
        return {
            'vae_loss': losses['total'].item(),
            'diffusion_loss': diffusion_loss.item()
        }
    
    def save_models(self, path):
        """Save trained models"""
        torch.save({
            'vae': self.vae.state_dict(),
            'diffusion': self.diffusion.state_dict(),
            'compression_factor': self.compression_factor,
            'latent_dim': self.latent_dim
        }, path)
    
    def load_models(self, path):
        """Load trained models"""
        checkpoint = torch.load(path, map_location=self.device)
        self.vae.load_state_dict(checkpoint['vae'])
        self.diffusion.load_state_dict(checkpoint['diffusion'])

# ===========================
# PART 4: Training Script
# ===========================

def train_lola_v2(data_path='lola_math_data', epochs=100, batch_size=32):
    """
    Train the enhanced LOLA v2 system
    """
    print("=" * 60)
    print("  LOLA v2.0 Training - Enhanced VAE + Diffusion")
    print("  Based on Official PolymathicAI Implementation")
    print("=" * 60)
    
    # Initialize system
    system = LOLAv2IntentSystem(
        compression_factor=256,  # Can go up to 1000
        latent_dim=64,
        device='cuda' if torch.cuda.is_available() else 'cpu'
    )
    
    print(f"Device: {system.device}")
    print(f"Compression Factor: {system.compression_factor}x")
    print(f"Latent Dimension: {system.latent_dim}")
    
    # Load existing data
    data_path = Path(data_path)
    if not data_path.exists():
        print(f"Creating data directory: {data_path}")
        data_path.mkdir(parents=True)
        return
    
    # Load all session files
    session_files = list(data_path.glob("session_*.json"))
    print(f"Found {len(session_files)} training samples")
    
    if len(session_files) == 0:
        print("No training data found. Please collect some drawing attempts first.")
        return
    
    # Load strokes
    all_strokes = []
    for file in session_files:
        with open(file, 'r') as f:
            data = json.load(f)
            all_strokes.append(data['stroke'])
    
    # Training loop
    print("\nStarting training...")
    for epoch in range(epochs):
        # Shuffle data
        np.random.shuffle(all_strokes)
        
        total_vae_loss = 0
        total_diff_loss = 0
        n_batches = 0
        
        # Process in batches
        for i in range(0, len(all_strokes), batch_size):
            batch = all_strokes[i:i+batch_size]
            
            if len(batch) < 2:  # Skip if batch too small
                continue
            
            losses = system.train_on_batch(batch)
            total_vae_loss += losses['vae_loss']
            total_diff_loss += losses['diffusion_loss']
            n_batches += 1
        
        # Print progress
        if epoch % 10 == 0:
            avg_vae_loss = total_vae_loss / max(n_batches, 1)
            avg_diff_loss = total_diff_loss / max(n_batches, 1)
            print(f"Epoch {epoch:3d}/{epochs} | VAE Loss: {avg_vae_loss:.4f} | Diffusion Loss: {avg_diff_loss:.4f}")
    
    # Save trained models
    save_path = data_path / "lola_v2_models.pth"
    system.save_models(save_path)
    print(f"\nModels saved to: {save_path}")
    
    return system

# ===========================
# PART 5: HTTP Server Integration
# ===========================

from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class LOLAv2Server(BaseHTTPRequestHandler):
    system = None
    
    @classmethod
    def set_system(cls, system):
        cls.system = system
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        if self.path == '/attempt':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                stroke_data = json.loads(post_data)
                
                # Encode attempt
                latent = self.system.encode_attempt(stroke_data)
                self.system.latent_history.append(latent)
                self.system.attempt_history.append(stroke_data)
                
                # Analyze intent
                analysis = self.system.analyze_intent()
                
                response = {
                    'attempt': len(self.system.attempt_history),
                    'compression_rate': self.system.compression_factor,
                    'latent_dim': self.system.latent_dim
                }
                
                if analysis and analysis['confidence'] > 0.6:
                    # Generate suggestion
                    suggestion = self.system.decode_suggestion(analysis['latent'])
                    response['suggestion'] = suggestion
                    response['confidence'] = float(analysis['confidence'])
                    response['message'] = f"Optimized with {self.system.compression_factor}x compression!"
                else:
                    response['message'] = f"Learning... ({len(self.system.attempt_history)}/5 attempts)"
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                self.wfile.write(json.dumps(response).encode())
                
            except Exception as e:
                self.send_error(500, str(e))
        
        elif self.path == '/train':
            # Train on collected data
            try:
                if len(self.system.attempt_history) > 0:
                    losses = self.system.train_on_batch(self.system.attempt_history[-32:])
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    
                    self.wfile.write(json.dumps({
                        'status': 'training',
                        'losses': losses
                    }).encode())
                else:
                    self.send_error(400, "No training data available")
                    
            except Exception as e:
                self.send_error(500, str(e))
    
    def do_GET(self):
        if self.path == '/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            status = {
                'status': 'running',
                'version': '2.0',
                'compression_factor': self.system.compression_factor,
                'latent_dim': self.system.latent_dim,
                'device': str(self.system.device),
                'attempts': len(self.system.attempt_history),
                'features': [
                    'VAE with physics preservation',
                    'Diffusion model for refinement',
                    f'{self.system.compression_factor}x compression',
                    'Gradient matching loss',
                    'Based on official LOLA'
                ]
            }
            
            self.wfile.write(json.dumps(status).encode())

def main():
    """Start enhanced LOLA v2 server"""
    print("=" * 60)
    print("  LOLA v2.0 Mathematical Intent Learning")
    print("  Enhanced with VAE + Diffusion Model")
    print("  Based on Official PolymathicAI Implementation")
    print("=" * 60)
    
    # Check for existing trained models
    model_path = Path("C:/palantir/math/lola_math_data/lola_v2_models.pth")
    
    if model_path.exists():
        print("[INFO] Loading pre-trained models...")
        system = LOLAv2IntentSystem(compression_factor=256, latent_dim=64)
        system.load_models(model_path)
        print("[OK] Models loaded successfully")
    else:
        print("[INFO] No pre-trained models found")
        print("[INFO] Training new models on existing data...")
        system = train_lola_v2('C:/palantir/math/lola_math_data', epochs=50)
        
        if system is None:
            print("[INFO] Creating new untrained system")
            system = LOLAv2IntentSystem(compression_factor=256, latent_dim=64)
    
    # Set system for server
    LOLAv2Server.set_system(system)
    
    # Start server
    PORT = 8093  # Different port for v2
    server = HTTPServer(('localhost', PORT), LOLAv2Server)
    
    print(f"\n[LOLA v2.0] Server starting on http://localhost:{PORT}")
    print("[LOLA v2.0] Endpoints:")
    print("  POST /attempt - Submit drawing attempt")
    print("  POST /train - Train on recent attempts")
    print("  GET /status - Get system status")
    print("")
    print("[INFO] Features:")
    print(f"  ✓ Compression: {system.compression_factor}x")
    print(f"  ✓ Latent Dimension: {system.latent_dim}")
    print(f"  ✓ Device: {system.device}")
    print("  ✓ VAE + Diffusion Model")
    print("  ✓ Physics-preserving loss")
    print("")
    print("Press Ctrl+C to stop")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[LOLA v2.0] Shutting down...")
        
        # Save models before shutdown
        save_path = Path("C:/palantir/math/lola_math_data/lola_v2_models_final.pth")
        system.save_models(save_path)
        print(f"[LOLA v2.0] Models saved to {save_path}")
        
        server.shutdown()

if __name__ == '__main__':
    main()
