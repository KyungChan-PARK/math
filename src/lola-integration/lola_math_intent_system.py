"""
LOLA-based Mathematical Intent Learning System
Based on "Lost in Latent Space" by PolymathicAI
For mathematical education from basic to university level
"""

import numpy as np
import json
import time
from dataclasses import dataclass, asdict
from typing import List, Dict, Tuple, Optional
import pickle
from pathlib import Path
import hashlib

@dataclass
class MathematicalStroke:
    """Single stroke or drawing attempt"""
    points: List[Tuple[float, float]]
    timestamp: float
    pressure: List[float]
    velocity: List[float]
    context: str  # 'calculus', 'geometry', 'algebra', etc.
    dimension: int  # 2D or 3D
    
@dataclass
class LatentRepresentation:
    """Latent code representation of mathematical drawing"""
    vector: np.ndarray  # Compressed representation (e.g., 64 dimensions)
    compression_rate: int
    physical_properties: Dict  # Curvature, continuity, symmetry, etc.
    mathematical_type: str  # 'function', 'shape', 'graph', 'equation'
    
class LOLAMathEncoder:
    """
    Encoder based on LOLA paper principles
    Compresses mathematical drawings to latent space
    """
    
    def __init__(self, latent_dim=64, compression_rate=256):
        self.latent_dim = latent_dim
        self.compression_rate = compression_rate
        self.feature_extractors = {
            'geometry': self._extract_geometric_features,
            'calculus': self._extract_calculus_features,
            'algebra': self._extract_algebraic_features,
            'topology': self._extract_topological_features
        }
        
    def encode(self, stroke: MathematicalStroke) -> LatentRepresentation:
        """
        Encode mathematical drawing to latent space
        Following LOLA's approach for physics-preserving compression
        """
        # Extract features based on context
        features = self._extract_features(stroke)
        
        # Compress to latent space (simulate VAE encoding)
        latent_vector = self._compress_features(features)
        
        # Preserve mathematical properties
        properties = self._analyze_mathematical_properties(stroke)
        
        return LatentRepresentation(
            vector=latent_vector,
            compression_rate=self.compression_rate,
            physical_properties=properties,
            mathematical_type=self._classify_mathematical_type(stroke)
        )
    
    def _extract_features(self, stroke: MathematicalStroke) -> np.ndarray:
        """Extract mathematical features from stroke"""
        points = np.array(stroke.points)
        
        features = []
        
        # Basic geometric features
        features.append(self._compute_curvature(points))
        features.append(self._compute_fourier_descriptors(points))
        features.append(self._compute_moments(points))
        
        # Velocity and acceleration patterns
        if stroke.velocity:
            features.append(np.mean(stroke.velocity))
            features.append(np.std(stroke.velocity))
        
        # Context-specific features
        if stroke.context in self.feature_extractors:
            context_features = self.feature_extractors[stroke.context](points)
            features.extend(context_features)
        
        return np.concatenate([np.array(f).flatten() for f in features])
    
    def _compress_features(self, features: np.ndarray) -> np.ndarray:
        """
        Compress features to latent dimension
        Simulating VAE encoder or PCA
        """
        # Simple linear compression for now (replace with neural network)
        if len(features) > self.latent_dim:
            # Random projection matrix (in practice, use trained weights)
            projection = np.random.randn(self.latent_dim, len(features))
            projection /= np.linalg.norm(projection, axis=1, keepdims=True)
            latent = projection @ features
        else:
            # Pad if features are smaller than latent dim
            latent = np.pad(features, (0, self.latent_dim - len(features)))
        
        # Normalize to unit sphere
        latent = latent / (np.linalg.norm(latent) + 1e-8)
        
        return latent
    
    def _compute_curvature(self, points: np.ndarray) -> np.ndarray:
        """Compute curvature features"""
        if len(points) < 3:
            return np.array([0.0])
        
        # Approximate curvature using three consecutive points
        curvatures = []
        for i in range(1, len(points) - 1):
            p1, p2, p3 = points[i-1], points[i], points[i+1]
            
            # Menger curvature
            area = 0.5 * np.abs((p2[0] - p1[0]) * (p3[1] - p1[1]) - 
                               (p3[0] - p1[0]) * (p2[1] - p1[1]))
            d12 = np.linalg.norm(p2 - p1)
            d23 = np.linalg.norm(p3 - p2)
            d13 = np.linalg.norm(p3 - p1)
            
            if d12 * d23 * d13 > 0:
                curvatures.append(4 * area / (d12 * d23 * d13))
            else:
                curvatures.append(0.0)
        
        return np.array([np.mean(curvatures), np.std(curvatures), np.max(curvatures)])
    
    def _compute_fourier_descriptors(self, points: np.ndarray, n_descriptors=10) -> np.ndarray:
        """Compute Fourier descriptors for shape analysis"""
        if len(points) < 2:
            return np.zeros(n_descriptors * 2)
        
        # Convert to complex representation
        complex_points = points[:, 0] + 1j * points[:, 1]
        
        # Compute FFT
        fft = np.fft.fft(complex_points)
        
        # Take first n descriptors (normalized)
        descriptors = fft[:min(n_descriptors, len(fft))]
        descriptors = descriptors / (np.abs(descriptors[0]) + 1e-8)
        
        # Separate real and imaginary parts
        result = np.concatenate([descriptors.real, descriptors.imag])
        
        # Pad if necessary
        if len(result) < n_descriptors * 2:
            result = np.pad(result, (0, n_descriptors * 2 - len(result)))
        
        return result[:n_descriptors * 2]
    
    def _compute_moments(self, points: np.ndarray) -> np.ndarray:
        """Compute geometric moments"""
        if len(points) == 0:
            return np.zeros(6)
        
        # Centroid
        centroid = np.mean(points, axis=0)
        
        # Central moments
        centered = points - centroid
        
        m00 = len(points)
        m10 = np.sum(centered[:, 0])
        m01 = np.sum(centered[:, 1])
        m20 = np.sum(centered[:, 0] ** 2)
        m02 = np.sum(centered[:, 1] ** 2)
        m11 = np.sum(centered[:, 0] * centered[:, 1])
        
        return np.array([m00, m10, m01, m20, m02, m11]) / (m00 + 1e-8)
    
    def _extract_geometric_features(self, points: np.ndarray) -> List[float]:
        """Extract geometry-specific features"""
        features = []
        
        # Check for closure
        if len(points) > 2:
            closure = np.linalg.norm(points[0] - points[-1])
            features.append(closure)
        
        # Convexity measure
        # Symmetry measures
        # Regularity measures
        
        return features
    
    def _extract_calculus_features(self, points: np.ndarray) -> List[float]:
        """Extract calculus-specific features (derivatives, integrals)"""
        if len(points) < 2:
            return [0.0] * 5
        
        # Approximate derivatives
        dx = np.diff(points[:, 0])
        dy = np.diff(points[:, 1])
        
        # First derivative (slope)
        slopes = dy / (dx + 1e-8)
        
        # Second derivative (acceleration)
        if len(slopes) > 1:
            accelerations = np.diff(slopes)
        else:
            accelerations = [0.0]
        
        return [
            np.mean(slopes),
            np.std(slopes),
            np.mean(accelerations),
            np.std(accelerations),
            np.trapz(points[:, 1], points[:, 0]) if len(points) > 1 else 0.0  # Integral
        ]
    
    def _extract_algebraic_features(self, points: np.ndarray) -> List[float]:
        """Extract algebraic pattern features"""
        # Detect linear, quadratic, exponential patterns
        return []
    
    def _extract_topological_features(self, points: np.ndarray) -> List[float]:
        """Extract topological features"""
        # Connectivity, holes, genus for 3D surfaces
        return []
    
    def _analyze_mathematical_properties(self, stroke: MathematicalStroke) -> Dict:
        """Analyze and preserve mathematical properties"""
        points = np.array(stroke.points)
        
        properties = {
            'continuity': self._check_continuity(points),
            'smoothness': self._measure_smoothness(points),
            'symmetry': self._detect_symmetry(points),
            'periodicity': self._detect_periodicity(points),
            'dimension': stroke.dimension
        }
        
        return properties
    
    def _check_continuity(self, points: np.ndarray) -> float:
        """Check continuity of the curve"""
        if len(points) < 2:
            return 1.0
        
        distances = np.linalg.norm(np.diff(points, axis=0), axis=1)
        return 1.0 / (1.0 + np.std(distances))
    
    def _measure_smoothness(self, points: np.ndarray) -> float:
        """Measure smoothness of the curve"""
        if len(points) < 3:
            return 1.0
        
        # Second derivative approximation
        second_diff = np.diff(points, n=2, axis=0)
        smoothness = 1.0 / (1.0 + np.mean(np.linalg.norm(second_diff, axis=1)))
        
        return smoothness
    
    def _detect_symmetry(self, points: np.ndarray) -> Dict:
        """Detect various types of symmetry"""
        if len(points) < 4:
            return {'reflection': 0.0, 'rotation': 0.0}
        
        centroid = np.mean(points, axis=0)
        centered = points - centroid
        
        # Reflection symmetry (simplified)
        flipped_x = centered.copy()
        flipped_x[:, 0] = -flipped_x[:, 0]
        
        reflection_score = 1.0 / (1.0 + np.mean(np.min(
            np.linalg.norm(centered[:, np.newaxis] - flipped_x[np.newaxis, :], axis=2),
            axis=1
        )))
        
        return {
            'reflection': reflection_score,
            'rotation': 0.0  # TODO: Implement rotational symmetry
        }
    
    def _detect_periodicity(self, points: np.ndarray) -> float:
        """Detect periodic patterns"""
        if len(points) < 10:
            return 0.0
        
        # Use autocorrelation
        y_values = points[:, 1]
        autocorr = np.correlate(y_values, y_values, mode='full')
        autocorr = autocorr[len(autocorr)//2:]
        
        # Find peaks in autocorrelation
        peaks = []
        for i in range(1, len(autocorr) - 1):
            if autocorr[i] > autocorr[i-1] and autocorr[i] > autocorr[i+1]:
                peaks.append(i)
        
        if len(peaks) > 1:
            periods = np.diff(peaks)
            periodicity = 1.0 / (1.0 + np.std(periods))
        else:
            periodicity = 0.0
        
        return periodicity
    
    def _classify_mathematical_type(self, stroke: MathematicalStroke) -> str:
        """Classify the type of mathematical object"""
        points = np.array(stroke.points)
        
        if len(points) < 2:
            return 'point'
        
        # Check if it's a function (single-valued)
        x_values = points[:, 0]
        if len(np.unique(x_values)) == len(x_values):
            return 'function'
        
        # Check if it's a closed shape
        if np.linalg.norm(points[0] - points[-1]) < 0.1:
            return 'shape'
        
        # Check for parametric curve
        return 'parametric'


class IntentionAnalyzer:
    """
    Analyzes accumulated latent representations to understand user intent
    Based on LOLA's approach to trajectory analysis
    """
    
    def __init__(self, history_size=100):
        self.history_size = history_size
        self.attempt_history: List[LatentRepresentation] = []
        self.convergence_threshold = 0.1
        
    def add_attempt(self, latent: LatentRepresentation):
        """Add new attempt to history"""
        self.attempt_history.append(latent)
        
        # Keep only recent history
        if len(self.attempt_history) > self.history_size:
            self.attempt_history.pop(0)
    
    def analyze_intent(self, min_attempts=5) -> Optional[Dict]:
        """
        Analyze user intent from accumulated attempts
        Returns predicted intention and confidence
        """
        if len(self.attempt_history) < min_attempts:
            return None
        
        # Extract latent vectors
        vectors = np.array([a.vector for a in self.attempt_history])
        
        # Analyze convergence
        convergence = self._analyze_convergence(vectors)
        
        # Cluster analysis
        clusters = self._cluster_attempts(vectors)
        
        # Trend analysis
        trend = self._analyze_trend(vectors)
        
        # Mathematical type consensus
        types = [a.mathematical_type for a in self.attempt_history]
        dominant_type = max(set(types), key=types.count)
        
        return {
            'convergence': convergence,
            'clusters': clusters,
            'trend': trend,
            'dominant_type': dominant_type,
            'confidence': self._calculate_confidence(convergence, clusters),
            'suggested_latent': self._predict_target_latent(vectors, trend)
        }
    
    def _analyze_convergence(self, vectors: np.ndarray) -> Dict:
        """Analyze if attempts are converging to a target"""
        if len(vectors) < 2:
            return {'converging': False, 'rate': 0.0}
        
        # Calculate successive distances
        distances = []
        for i in range(1, len(vectors)):
            dist = np.linalg.norm(vectors[i] - vectors[i-1])
            distances.append(dist)
        
        # Check if distances are decreasing
        decreasing = sum(1 for i in range(1, len(distances)) 
                        if distances[i] < distances[i-1]) / max(1, len(distances) - 1)
        
        return {
            'converging': decreasing > 0.6,
            'rate': decreasing,
            'final_distance': distances[-1] if distances else 0.0
        }
    
    def _cluster_attempts(self, vectors: np.ndarray) -> Dict:
        """Cluster attempts to find patterns"""
        if len(vectors) < 3:
            return {'n_clusters': 1, 'main_cluster': vectors.mean(axis=0)}
        
        # Simple k-means with k=2
        from sklearn.cluster import KMeans
        
        n_clusters = min(3, len(vectors) // 3)
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        labels = kmeans.fit_predict(vectors)
        
        # Find main cluster
        unique, counts = np.unique(labels, return_counts=True)
        main_cluster_idx = unique[np.argmax(counts)]
        main_cluster_center = kmeans.cluster_centers_[main_cluster_idx]
        
        return {
            'n_clusters': n_clusters,
            'main_cluster': main_cluster_center,
            'cluster_sizes': counts.tolist()
        }
    
    def _analyze_trend(self, vectors: np.ndarray) -> np.ndarray:
        """Analyze the trend direction in latent space"""
        if len(vectors) < 2:
            return np.zeros_like(vectors[0])
        
        # Weighted average with more weight on recent attempts
        weights = np.exp(np.linspace(-1, 0, len(vectors)))
        weights /= weights.sum()
        
        # Calculate weighted direction
        weighted_center = np.average(vectors, axis=0, weights=weights)
        
        # Extrapolate trend
        if len(vectors) > 5:
            recent = vectors[-5:]
            direction = recent[-1] - recent[0]
            trend = weighted_center + 0.2 * direction
        else:
            trend = weighted_center
        
        return trend
    
    def _calculate_confidence(self, convergence: Dict, clusters: Dict) -> float:
        """Calculate confidence in the analysis"""
        confidence = 0.0
        
        # Convergence contributes to confidence
        if convergence['converging']:
            confidence += 0.5 * convergence['rate']
        
        # Single cluster indicates consistency
        if clusters['n_clusters'] == 1:
            confidence += 0.3
        elif clusters['n_clusters'] == 2:
            # Check if one cluster dominates
            sizes = clusters['cluster_sizes']
            if max(sizes) > sum(sizes) * 0.7:
                confidence += 0.2
        
        # Recent consistency
        if len(self.attempt_history) > 5:
            recent_vectors = np.array([a.vector for a in self.attempt_history[-5:]])
            recent_std = np.mean(np.std(recent_vectors, axis=0))
            confidence += 0.2 * (1.0 / (1.0 + recent_std))
        
        return min(1.0, confidence)
    
    def _predict_target_latent(self, vectors: np.ndarray, trend: np.ndarray) -> np.ndarray:
        """Predict the target latent vector user is trying to achieve"""
        if len(vectors) < 3:
            return trend
        
        # Use exponential smoothing for prediction
        alpha = 0.3  # Smoothing factor
        
        predicted = vectors[0].copy()
        for i in range(1, len(vectors)):
            predicted = alpha * vectors[i] + (1 - alpha) * predicted
        
        # Blend with trend
        final_prediction = 0.7 * predicted + 0.3 * trend
        
        # Normalize
        final_prediction = final_prediction / (np.linalg.norm(final_prediction) + 1e-8)
        
        return final_prediction


class LOLAMathDecoder:
    """
    Decoder to generate optimized mathematical representations
    Based on LOLA's generative approach
    """
    
    def __init__(self):
        self.generators = {
            'function': self._generate_function,
            'shape': self._generate_shape,
            'parametric': self._generate_parametric,
            'surface': self._generate_surface
        }
    
    def decode(self, latent_vector: np.ndarray, 
               mathematical_type: str,
               properties: Dict,
               resolution: int = 100) -> Dict:
        """
        Decode latent representation to optimized mathematical object
        """
        if mathematical_type in self.generators:
            result = self.generators[mathematical_type](
                latent_vector, properties, resolution
            )
        else:
            result = self._generate_default(latent_vector, properties, resolution)
        
        return {
            'type': mathematical_type,
            'data': result,
            'properties': properties,
            'quality_score': self._assess_quality(result, properties)
        }
    
    def _generate_function(self, latent: np.ndarray, 
                          properties: Dict, 
                          resolution: int) -> Dict:
        """Generate optimized function from latent code"""
        # Decode latent to function parameters
        # Using first few dimensions for main characteristics
        
        amplitude = latent[0] * 2
        frequency = np.abs(latent[1]) * 5 + 0.1
        phase = latent[2] * np.pi
        damping = np.abs(latent[3]) * 0.1
        
        # Generate smooth function
        x = np.linspace(-5, 5, resolution)
        
        # Combine multiple basis functions based on latent
        y = amplitude * np.sin(frequency * x + phase) * np.exp(-damping * np.abs(x))
        
        if len(latent) > 4:
            # Add polynomial component
            poly_degree = int(np.abs(latent[4]) * 3) + 1
            for i in range(poly_degree):
                if i + 5 < len(latent):
                    y += latent[i + 5] * (x ** i)
        
        # Apply smoothness if specified
        if properties.get('smoothness', 0) > 0.5:
            from scipy.ndimage import gaussian_filter1d
            y = gaussian_filter1d(y, sigma=2)
        
        return {
            'x': x.tolist(),
            'y': y.tolist(),
            'equation': f"{amplitude:.2f}*sin({frequency:.2f}*x + {phase:.2f})*exp(-{damping:.2f}*|x|)"
        }
    
    def _generate_shape(self, latent: np.ndarray, 
                       properties: Dict, 
                       resolution: int) -> Dict:
        """Generate optimized geometric shape from latent code"""
        # Decode shape type from first dimensions
        shape_score = latent[:3]
        
        # Determine shape type
        shapes = ['circle', 'ellipse', 'polygon']
        shape_type = shapes[np.argmax(np.abs(shape_score))]
        
        if shape_type == 'circle':
            radius = np.abs(latent[3]) * 2 + 0.5
            t = np.linspace(0, 2*np.pi, resolution)
            x = radius * np.cos(t)
            y = radius * np.sin(t)
            
        elif shape_type == 'ellipse':
            a = np.abs(latent[3]) * 2 + 0.5
            b = np.abs(latent[4]) * 2 + 0.5
            t = np.linspace(0, 2*np.pi, resolution)
            x = a * np.cos(t)
            y = b * np.sin(t)
            
        else:  # polygon
            n_sides = int(np.abs(latent[5]) * 8) + 3
            radius = np.abs(latent[3]) * 2 + 0.5
            angles = np.linspace(0, 2*np.pi, n_sides + 1)
            x = radius * np.cos(angles)
            y = radius * np.sin(angles)
        
        # Apply symmetry if detected
        if properties.get('symmetry', {}).get('reflection', 0) > 0.5:
            # Ensure perfect symmetry
            mid = len(x) // 2
            x[mid:] = -x[:mid][::-1]
        
        return {
            'x': x.tolist(),
            'y': y.tolist(),
            'type': shape_type
        }
    
    def _generate_parametric(self, latent: np.ndarray, 
                            properties: Dict, 
                            resolution: int) -> Dict:
        """Generate parametric curve from latent code"""
        t = np.linspace(0, 2*np.pi, resolution)
        
        # Decode to Lissajous-like curve
        a = int(np.abs(latent[0]) * 5) + 1
        b = int(np.abs(latent[1]) * 5) + 1
        delta = latent[2] * np.pi
        
        x = np.sin(a * t + delta)
        y = np.sin(b * t)
        
        # Add complexity based on latent dimensions
        if len(latent) > 6:
            x += latent[6] * np.cos(3 * t)
            y += latent[7] * np.cos(5 * t)
        
        return {
            'x': x.tolist(),
            'y': y.tolist(),
            't': t.tolist(),
            'equation': f"x = sin({a}t + {delta:.2f}), y = sin({b}t)"
        }
    
    def _generate_surface(self, latent: np.ndarray, 
                         properties: Dict, 
                         resolution: int) -> Dict:
        """Generate 3D surface from latent code (for gradient visualization)"""
        res = int(np.sqrt(resolution))
        x = np.linspace(-2, 2, res)
        y = np.linspace(-2, 2, res)
        X, Y = np.meshgrid(x, y)
        
        # Decode to surface function
        a = latent[0]
        b = latent[1] 
        c = latent[2]
        
        # Generate surface (example: saddle point, paraboloid, etc.)
        Z = a * (X**2) + b * (Y**2) + c * X * Y
        
        # Add complexity
        if len(latent) > 5:
            Z += latent[5] * np.sin(latent[6] * X) * np.cos(latent[7] * Y)
        
        # Calculate gradient
        dZ_dx = np.gradient(Z, axis=1)
        dZ_dy = np.gradient(Z, axis=0)
        
        return {
            'X': X.tolist(),
            'Y': Y.tolist(),
            'Z': Z.tolist(),
            'gradient_x': dZ_dx.tolist(),
            'gradient_y': dZ_dy.tolist(),
            'type': '3d_surface'
        }
    
    def _generate_default(self, latent: np.ndarray, 
                         properties: Dict, 
                         resolution: int) -> Dict:
        """Default generator for unknown types"""
        # Generate a smooth curve based on latent
        t = np.linspace(0, 10, resolution)
        
        # Use latent as Fourier coefficients
        signal = np.zeros(resolution)
        for i, coeff in enumerate(latent[:10]):
            signal += coeff * np.sin((i + 1) * t * 0.5)
        
        return {
            'x': t.tolist(),
            'y': signal.tolist()
        }
    
    def _assess_quality(self, result: Dict, properties: Dict) -> float:
        """Assess quality of generated result"""
        score = 0.0
        
        # Check smoothness
        if 'y' in result:
            y = np.array(result['y'])
            smoothness = 1.0 / (1.0 + np.std(np.diff(y, n=2)))
            score += smoothness * 0.3
        
        # Check continuity
        if 'x' in result and 'y' in result:
            x = np.array(result['x'])
            y = np.array(result['y'])
            distances = np.sqrt(np.diff(x)**2 + np.diff(y)**2)
            continuity = 1.0 / (1.0 + np.std(distances))
            score += continuity * 0.3
        
        # Check if properties are preserved
        if properties.get('symmetry', {}).get('reflection', 0) > 0.5:
            score += 0.2
        
        if properties.get('periodicity', 0) > 0.5:
            score += 0.2
        
        return min(1.0, score)


class LOLAMathematicalIntentSystem:
    """
    Complete system for learning and optimizing mathematical drawings
    Based on LOLA (Lost in Latent Space) principles
    """
    
    def __init__(self, save_dir="lola_math_data"):
        self.encoder = LOLAMathEncoder(latent_dim=64, compression_rate=256)
        self.analyzer = IntentionAnalyzer(history_size=100)
        self.decoder = LOLAMathDecoder()
        
        self.save_dir = Path(save_dir)
        self.save_dir.mkdir(exist_ok=True)
        
        self.session_id = self._generate_session_id()
        self.attempt_count = 0
        self.last_suggestion = None
        
        # Load previous sessions
        self.load_history()
    
    def _generate_session_id(self) -> str:
        """Generate unique session ID"""
        timestamp = str(time.time())
        return hashlib.md5(timestamp.encode()).hexdigest()[:8]
    
    def add_drawing_attempt(self, stroke_data: Dict) -> Dict:
        """
        Process new drawing attempt
        Returns analysis results
        """
        self.attempt_count += 1
        
        # Create stroke object
        stroke = MathematicalStroke(
            points=stroke_data['points'],
            timestamp=time.time(),
            pressure=stroke_data.get('pressure', []),
            velocity=stroke_data.get('velocity', []),
            context=stroke_data.get('context', 'geometry'),
            dimension=stroke_data.get('dimension', 2)
        )
        
        # Encode to latent space
        latent = self.encoder.encode(stroke)
        
        # Add to analyzer
        self.analyzer.add_attempt(latent)
        
        # Save attempt
        self._save_attempt(stroke, latent)
        
        # Analyze intent after N attempts
        analysis = None
        if self.attempt_count >= 5:  # Analyze after every attempt once we have 5+
            analysis = self.analyzer.analyze_intent(min_attempts=5)
            
            if analysis and analysis['confidence'] > 0.6:
                # Generate suggestion
                self.last_suggestion = self._generate_suggestion(analysis)
                
                return {
                    'attempt': self.attempt_count,
                    'latent_vector': latent.vector.tolist(),
                    'compression_rate': latent.compression_rate,
                    'analysis': analysis,
                    'suggestion': self.last_suggestion,
                    'message': 'I think I understand what you\'re trying to draw. Here\'s my suggestion:'
                }
        
        return {
            'attempt': self.attempt_count,
            'latent_vector': latent.vector.tolist(),
            'compression_rate': latent.compression_rate,
            'analysis': analysis,
            'message': f'Attempt {self.attempt_count} recorded. Keep drawing, I\'m learning your intent...'
        }
    
    def _generate_suggestion(self, analysis: Dict) -> Dict:
        """Generate optimized suggestion based on analysis"""
        suggested_latent = analysis['suggested_latent']
        dominant_type = analysis['dominant_type']
        
        # Get average properties from recent attempts
        recent_properties = {}
        if len(self.analyzer.attempt_history) > 0:
            recent = self.analyzer.attempt_history[-5:]
            for prop in ['continuity', 'smoothness', 'symmetry', 'periodicity']:
                values = [a.physical_properties.get(prop, 0) for a in recent]
                recent_properties[prop] = np.mean(values) if values else 0
        
        # Decode to optimized result
        optimized = self.decoder.decode(
            suggested_latent,
            dominant_type,
            recent_properties,
            resolution=200
        )
        
        return optimized
    
    def get_optimized_result(self) -> Optional[Dict]:
        """Get the current best optimized result"""
        if self.last_suggestion:
            return self.last_suggestion
        
        # Try to generate from current state
        analysis = self.analyzer.analyze_intent(min_attempts=3)
        if analysis and analysis['confidence'] > 0.4:
            return self._generate_suggestion(analysis)
        
        return None
    
    def _save_attempt(self, stroke: MathematicalStroke, latent: LatentRepresentation):
        """Save attempt to disk for long-term learning"""
        attempt_data = {
            'session_id': self.session_id,
            'attempt': self.attempt_count,
            'timestamp': stroke.timestamp,
            'stroke': asdict(stroke),
            'latent_vector': latent.vector.tolist(),
            'compression_rate': latent.compression_rate,
            'properties': latent.physical_properties,
            'type': latent.mathematical_type
        }
        
        # Save to JSON
        filename = self.save_dir / f"session_{self.session_id}_attempt_{self.attempt_count:04d}.json"
        with open(filename, 'w') as f:
            json.dump(attempt_data, f, indent=2)
        
        # Also save consolidated history
        self._update_history()
    
    def _update_history(self):
        """Update consolidated history file"""
        history_file = self.save_dir / "consolidated_history.pkl"
        
        history = {
            'sessions': {},
            'total_attempts': 0,
            'mathematical_types': {},
            'latent_clusters': []
        }
        
        if history_file.exists():
            with open(history_file, 'rb') as f:
                history = pickle.load(f)
        
        # Update with current session
        if self.session_id not in history['sessions']:
            history['sessions'][self.session_id] = {
                'start_time': time.time(),
                'attempts': []
            }
        
        history['sessions'][self.session_id]['attempts'].append(self.attempt_count)
        history['total_attempts'] += 1
        
        # Save updated history
        with open(history_file, 'wb') as f:
            pickle.dump(history, f)
    
    def load_history(self):
        """Load previous learning history"""
        history_file = self.save_dir / "consolidated_history.pkl"
        
        if history_file.exists():
            with open(history_file, 'rb') as f:
                history = pickle.load(f)
                print(f"Loaded history: {history['total_attempts']} total attempts from {len(history['sessions'])} sessions")
                return history
        
        return None
    
    def reset_session(self):
        """Start a new session"""
        self.session_id = self._generate_session_id()
        self.attempt_count = 0
        self.analyzer = IntentionAnalyzer(history_size=100)
        self.last_suggestion = None
    
    def export_learning_data(self) -> Dict:
        """Export learning data for analysis"""
        return {
            'session_id': self.session_id,
            'total_attempts': self.attempt_count,
            'analyzer_history': len(self.analyzer.attempt_history),
            'last_suggestion': self.last_suggestion,
            'save_directory': str(self.save_dir)
        }


# HTTP Server for integration
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class LOLAMathServer(BaseHTTPRequestHandler):
    # Class variable to store the system
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
    
    def do_GET(self):
        if self.path == '/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            status = {
                'status': 'running',
                'session_id': self.system.session_id,
                'attempts': self.system.attempt_count,
                'learning_data': self.system.export_learning_data()
            }
            
            self.wfile.write(json.dumps(status).encode())
            
        elif self.path == '/suggestion':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            suggestion = self.system.get_optimized_result()
            
            self.wfile.write(json.dumps(suggestion or {}).encode())
    
    def do_POST(self):
        if self.path == '/attempt':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                stroke_data = json.loads(post_data)
                result = self.system.add_drawing_attempt(stroke_data)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                self.wfile.write(json.dumps(result).encode())
                
            except Exception as e:
                self.send_error(500, str(e))
                
        elif self.path == '/reset':
            self.system.reset_session()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps({'status': 'reset', 'new_session': self.system.session_id}).encode())
    
    def log_message(self, format, *args):
        # Suppress default logging
        pass


def main():
    """Start LOLA Mathematical Intent Learning Server"""
    print('=' * 60)
    print('  LOLA Mathematical Intent Learning System')
    print('  Based on "Lost in Latent Space" by PolymathicAI')
    print('=' * 60)
    
    # Initialize system
    system = LOLAMathematicalIntentSystem(save_dir="C:/palantir/math/lola_math_data")
    
    # Set system for server
    LOLAMathServer.set_system(system)
    
    # Start server
    PORT = 8092
    server = HTTPServer(('localhost', PORT), LOLAMathServer)
    
    print(f'[LOLA Math Intent] Server starting on http://localhost:{PORT}')
    print('[LOLA Math Intent] Endpoints:')
    print('  POST /attempt - Submit drawing attempt')
    print('  GET /suggestion - Get optimized suggestion')
    print('  GET /status - Get system status')
    print('  POST /reset - Reset session')
    print('')
    print('[INFO] System ready for mathematical intent learning!')
    print('[INFO] Compression rate: 256x')
    print('[INFO] Latent dimension: 64')
    print('[INFO] Suggestion after 5+ attempts')
    print('')
    print('Press Ctrl+C to stop')
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n[LOLA Math Intent] Shutting down...')
        server.shutdown()


if __name__ == '__main__':
    main()