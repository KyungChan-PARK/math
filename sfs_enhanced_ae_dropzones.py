#!/usr/bin/env python3
"""
Enhanced AE Agentic Drop Zones with Claude Max Optimization
Single File Script (SFS) for After Effects Automation
Author: Claude Opus 4.1 Agent
Date: 2025-09-01
"""

import asyncio
import json
import os
import sqlite3
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# UV managed imports
import anthropic
import yaml
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Initialize Rich console for beautiful output
console = Console()

class ClaudeMaxRouter:
    """지능형 Claude 모델 라우팅 시스템"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.client = anthropic.Anthropic()
        self.cache = CacheManager()
        self.stats = {"opus": 0, "sonnet": 0, "cache": 0, "total_cost": 0.0}
    
    def analyze_complexity(self, prompt: str, zone_config: Dict) -> int:
        """파일 내용과 드롭존 설정으로 복잡도 분석 (1-10)"""
        complexity = 5  # 기본값
        
        # Force model 설정 확인
        routing = zone_config.get('routing_config', {})
        if routing.get('force_model') == 'opus':
            return 10
        elif routing.get('force_model') == 'sonnet':
            return 3
        
        # Trigger 키워드 분석
        prompt_lower = prompt.lower()
        opus_triggers = routing.get('opus_triggers', [])
        sonnet_triggers = routing.get('sonnet_triggers', [])
        
        for trigger in opus_triggers:
            if trigger.lower() in prompt_lower:
                complexity += 2
                
        for trigger in sonnet_triggers:
            if trigger.lower() in prompt_lower:
                complexity -= 1
        
        # 복잡도 범위 제한
        return max(1, min(10, complexity))
    
    async def route_request(self, prompt: str, zone_config: Dict) -> Tuple[str, str]:
        """요청을 적절한 모델로 라우팅"""
        # 1. 캐시 확인
        cache_key = self.cache.generate_key(prompt, zone_config['name'])
        cached_result = self.cache.get(cache_key)
        if cached_result:
            self.stats["cache"] += 1
            console.print("[green]✓ Cache hit![/green]")
            return cached_result, "cache"
        
        # 2. 복잡도 분석
        complexity = self.analyze_complexity(prompt, zone_config)
        
        # 3. 모델 선택
        threshold = zone_config.get('routing_config', {}).get('complexity_threshold', 7)
        if complexity >= threshold:
            model = "claude-3-opus-20240229"
            self.stats["opus"] += 1
            model_name = "Opus 4.1"
            color = "red"
        else:
            model = "claude-3-sonnet-20240229"
            self.stats["sonnet"] += 1
            model_name = "Sonnet 4"
            color = "blue"
        
        console.print(f"[{color}]→ Using {model_name} (complexity: {complexity}/10)[/{color}]")
        
        # 4. API 호출
        try:
            message = self.client.messages.create(
                model=model,
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )
            result = message.content[0].text
            
            # 5. 결과 캐싱
            self.cache.store(cache_key, result)
            
            # 6. 비용 계산
            cost = self.calculate_cost(model, len(prompt), len(result))
            self.stats["total_cost"] += cost
            
            return result, model_name
            
        except Exception as e:
            console.print(f"[red]✗ API Error: {e}[/red]")
            return None, "error"
    
    def calculate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        """API 사용 비용 계산"""
        # 대략적인 토큰 수 추정 (1토큰 ≈ 4자)
        input_tokens = input_tokens // 4
        output_tokens = output_tokens // 4
        
        if "opus" in model:
            cost = (input_tokens * 0.015 + output_tokens * 0.075) / 1000
        else:  # sonnet
            cost = (input_tokens * 0.003 + output_tokens * 0.015) / 1000
        
        return cost

class CacheManager:
    """SQLite 기반 응답 캐싱 시스템"""
    
    def __init__(self, db_path: str = "cache/claude_responses.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(exist_ok=True)
        self.init_db()
    
    def init_db(self):
        """데이터베이스 초기화"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS cache (
                key TEXT PRIMARY KEY,
                response TEXT,
                model TEXT,
                timestamp REAL,
                hit_count INTEGER DEFAULT 0
            )
        ''')
        conn.commit()
        conn.close()
    
    def generate_key(self, prompt: str, zone_name: str) -> str:
        """캐시 키 생성"""
        import hashlib
        content = f"{zone_name}:{prompt}"
        return hashlib.sha256(content.encode()).hexdigest()
    
    def get(self, key: str) -> Optional[str]:
        """캐시에서 응답 가져오기"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT response, hit_count FROM cache WHERE key = ?",
            (key,)
        )
        result = cursor.fetchone()
        
        if result:
            # 히트 카운트 증가
            cursor.execute(
                "UPDATE cache SET hit_count = hit_count + 1 WHERE key = ?",
                (key,)
            )
            conn.commit()
            conn.close()
            return result[0]
        
        conn.close()
        return None
    
    def store(self, key: str, response: str, model: str = "unknown"):
        """응답을 캐시에 저장"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(            "INSERT OR REPLACE INTO cache (key, response, model, timestamp) VALUES (?, ?, ?, ?)",
            (key, response, model, time.time())
        )
        conn.commit()
        conn.close()


class DropZoneHandler(FileSystemEventHandler):
    """드롭존 파일 이벤트 처리"""
    
    def __init__(self, zone_config: Dict, router: ClaudeMaxRouter):
        self.zone_config = zone_config
        self.router = router
        self.zone_name = zone_config['name']
        
    def on_created(self, event):
        """파일이 드롭존에 생성되었을 때"""
        if event.is_directory:
            return
            
        file_path = Path(event.src_path)
        
        # 파일 패턴 확인
        patterns = self.zone_config.get('file_patterns', ['*'])
        if not any(file_path.match(pattern) for pattern in patterns):
            return
        
        console.print(f"\n[cyan]📁 File dropped in {self.zone_name}:[/cyan] {file_path.name}")
        
        # 비동기 처리 시작
        asyncio.run(self.process_file(file_path))    
    async def process_file(self, file_path: Path):
        """파일 처리 및 워크플로우 실행"""
        try:
            # 1. 파일 내용 읽기
            content = file_path.read_text(encoding='utf-8')
            
            # 2. 프롬프트 생성
            prompt = self.create_prompt(content, file_path)
            
            # 3. Claude로 처리
            result, model = await self.router.route_request(prompt, self.zone_config)
            
            if result:
                # 4. 결과 저장
                output_path = self.save_output(result, file_path)
                
                # 5. 성공 메시지
                console.print(Panel(
                    f"✅ Successfully processed with {model}\n"
                    f"📄 Output: {output_path}",
                    title="Success",
                    border_style="green"
                ))
                
                # 6. After Effects 자동 실행 (설정된 경우)
                if self.zone_config.get('output', {}).get('auto_execute'):
                    self.execute_in_ae(output_path)
            else:
                console.print("[red]✗ Processing failed[/red]")                
        except Exception as e:
            console.print(f"[red]✗ Error processing file: {e}[/red]")
    
    def create_prompt(self, content: str, file_path: Path) -> str:
        """드롭존 타입에 맞는 프롬프트 생성"""
        zone_name = self.zone_config['name']
        
        if zone_name == "AE Vibe Coding Zone":
            return f"""
Generate production-ready ExtendScript code for After Effects based on this request:

Request: {content}

Requirements:
- Include proper error handling with try/catch blocks
- Add undo groups for all operations
- Include comments explaining each section
- Make the code work with selected layers or active composition
- Optimize for performance

Output only the ExtendScript code without explanations.
"""
        
        elif zone_name == "Video Motion Analysis":
            return f"""
Analyze this video file path and generate After Effects motion templates:
File: {file_path}

Generate:
1. Motion tracking data structure
2. Keyframe patterns detected
3. Suggested After Effects expressions
4. Lottie-compatible JSON format
"""        
        elif zone_name == "Batch AE Operations":
            return f"""
Process this batch operation file for After Effects:

Content: {content}

Parse the CSV/JSON data and generate ExtendScript that:
1. Iterates through each operation
2. Applies changes efficiently with batch processing
3. Includes progress reporting
4. Handles errors gracefully
"""
        
        else:
            return content  # 기본값
    
    def save_output(self, result: str, input_path: Path) -> Path:
        """결과를 파일로 저장"""
        output_config = self.zone_config.get('output', {})
        extension = output_config.get('file_extension', '.txt')
        
        # 출력 디렉토리 생성
        output_dir = input_path.parent / "output"
        output_dir.mkdir(exist_ok=True)
        
        # 타임스탬프 추가
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_name = f"{input_path.stem}_{timestamp}{extension}"
        output_path = output_dir / output_name        
        # 파일 저장
        output_path.write_text(result, encoding='utf-8')
        
        return output_path
    
    def execute_in_ae(self, script_path: Path):
        """After Effects에서 스크립트 실행"""
        # Windows의 경우
        import subprocess
        ae_path = r"C:\Program Files\Adobe\Adobe After Effects 2024\Support Files\AfterFX.exe"
        
        if Path(ae_path).exists():
            try:
                subprocess.run([ae_path, "-r", str(script_path)])
                console.print("[green]✓ Executed in After Effects[/green]")
            except Exception as e:
                console.print(f"[yellow]⚠ Could not auto-execute: {e}[/yellow]")


class EnhancedAEDropZones:
    """메인 드롭존 시스템"""
    
    def __init__(self, config_path: str = "enhanced_drops.yaml"):
        self.config = self.load_config(config_path)
        self.router = ClaudeMaxRouter(self.config)
        self.observers = []
        
    def load_config(self, config_path: str) -> Dict:
        """설정 파일 로드"""
        with open(config_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    
    def setup_drop_zones(self):
        """모든 드롭존 설정"""
        console.print("\n[bold cyan]🚀 Setting up Enhanced AE Drop Zones[/bold cyan]\n")
        
        for zone_name, zone_config in self.config['drop_zones'].items():
            # 드롭존 디렉토리 생성
            for zone_dir in zone_config.get('zone_dirs', []):
                Path(zone_dir).mkdir(parents=True, exist_ok=True)
                
            # 파일 감시자 설정
            handler = DropZoneHandler(zone_config, self.router)
            observer = Observer()
            
            for zone_dir in zone_config.get('zone_dirs', []):
                observer.schedule(handler, zone_dir, recursive=False)
                
            self.observers.append(observer)
            
            # 상태 출력
            console.print(f"✅ {zone_config['name']}: [green]Active[/green]")
            console.print(f"   📁 Watching: {', '.join(zone_config['zone_dirs'])}")
            console.print(f"   📄 Patterns: {', '.join(zone_config['file_patterns'])}\n")    
    def start(self):
        """드롭존 시스템 시작"""
        self.setup_drop_zones()
        
        # 모든 감시자 시작
        for observer in self.observers:
            observer.start()
        
        # 통계 테이블 표시
        self.show_stats()
        
        console.print("\n[bold green]🎯 System Ready![/bold green]")
        console.print("Drop files into the zones to process them automatically.\n")
        console.print("[dim]Press Ctrl+C to stop...[/dim]\n")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stop()
    
    def show_stats(self):
        """실시간 통계 표시"""
        table = Table(title="📊 Claude Max Routing Stats")
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="green")
        
        table.add_row("Opus 4.1 Calls", str(self.router.stats["opus"]))
        table.add_row("Sonnet 4 Calls", str(self.router.stats["sonnet"]))        table.add_row("Cache Hits", str(self.router.stats["cache"]))
        table.add_row("Total Cost", f"${self.router.stats['total_cost']:.4f}")
        
        if self.router.stats["opus"] + self.router.stats["sonnet"] > 0:
            savings = (self.router.stats["cache"] + self.router.stats["sonnet"]) / \
                     (self.router.stats["opus"] + self.router.stats["sonnet"] + self.router.stats["cache"]) * 100
            table.add_row("Cost Savings", f"{savings:.1f}%")
        
        console.print(table)
    
    def stop(self):
        """시스템 종료"""
        console.print("\n[yellow]Stopping all observers...[/yellow]")
        for observer in self.observers:
            observer.stop()
            observer.join()
        
        self.show_stats()
        console.print("\n[green]✓ System stopped gracefully[/green]")


if __name__ == "__main__":
    # 배너 표시
    console.print(Panel.fit(
        "[bold cyan]Enhanced AE Drop Zones[/bold cyan]\n"
        "[yellow]Claude Max Optimized System[/yellow]\n"
        "Version 1.0.0 | 2025-09-01",
        border_style="cyan"
    ))
    
    # 시스템 시작
    system = EnhancedAEDropZones()
    system.start()