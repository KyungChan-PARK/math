<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# LOLA 프로젝트 GitHub 저장소

영상에서 소개된 "Lost in Latent Space: An Empirical Study of Latent Diffusion Models for Physics Emulation" 논문의 공식 GitHub 저장소를 찾았습니다.

## 🎯 **공식 저장소 정보**

**PolymathicAI/lola**

- **GitHub URL**: https://github.com/PolymathicAI/lola
- **논문**: "Lost in Latent Space: An Empirical Study of Latent Diffusion Models for Physics Emulation"
- **발행일**: 2024년 9월 8일[^1]
- **작성자**: François Rozet, Ruben Ohana, Michael McCabe, Gilles Louppe, François Lanusse, Shirley Ho[^2][^3]


## 📋 **프로젝트 주요 내용**

### **연구 목표**

- Diffusion 모델의 높은 추론 비용 문제 해결
- 물리 시뮬레이션 에뮬레이터로서의 잠재 공간 확산 모델(Latent Diffusion Model) 효과 검증
- **1000배까지의 압축률**에서도 물리적 특성 유지 가능성 입증[^4][^2]


### **핵심 발견사항**

1. **압축률 강건성**: 1000배 압축에서도 에뮬레이션 정확도 놀랍도록 유지[^3][^2]
2. **성능 우위**: 확산 기반 에뮬레이터가 비생성 모델보다 일관되게 우수한 정확도[^2]
3. **계산 효율성**: 원본 시뮬레이션 1시간 → 3초로 단축 가능[^2]

## 🛠️ **설치 및 사용법**

### **환경 설정**

```bash
# Python 가상환경 생성
python -m venv ~/.venvs/lola
source ~/.venvs/lola/bin/activate

# 패키지 설치 (CUDA 12.1 기준)
pip install --editable .[all] --extra-index-url https://download.pytorch.org/whl/cu121
```


### **사전 요구사항**

- **Slurm 클러스터** 접근 권한
- **Weights \& Biases** 계정
- **PyTorch** 기반 환경
- **충분한 컴퓨팅 자원** (GPU 메모리 12GB+ 권장)[^5][^1]


## 📊 **데이터셋**

프로젝트는 **The Well** 데이터셋을 활용합니다:

- **총 용량**: 15TB 물리 시뮬레이션 데이터
- **주요 데이터셋**: Euler Multi-Quadrants, Rayleigh-Bénard, Turbulence Gravity Cooling
- **다운로드**: `the-well-download` 명령어 사용[^6][^5]

```bash
# 데이터 다운로드 예시
the-well-download --base-path path/to/base --dataset active_matter --split train
```


## 💡 **실용적 권장사항**

Polymathic AI 팀이 제시한 실무진을 위한 가이드라인:[^7]

1. **잠재 공간 접근법 우선 시도** - 계산 요구량 감소 및 우수한 성능
2. **생성 모델을 결정론적 모델보다 선호** - 더 나은 정확도, 안정적 롤아웃, 불확실성 처리

영상에서 언급된 **1000배 압축에도 물리 특성 유지**라는 혁신적 결과가 이 GitHub 저장소에서 완전히 구현되어 있으며, 실제 물리 시뮬레이션 가속화에 직접 활용할 수 있습니다.[^8][^7][^2]
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^17][^18][^19][^20][^21][^22][^23][^24][^25][^26][^27][^28][^29][^30][^31][^32][^33][^34][^35][^36][^37][^9]</span>

<div style="text-align: center">⁂</div>

[^1]: https://github.com/PolymathicAI/lola

[^2]: https://arxiv.org/html/2507.02608v1

[^3]: https://arxiv.org/html/2507.02608v2

[^4]: https://arxiv.org/abs/2507.02608

[^5]: https://polymathic-ai.org/the_well/

[^6]: https://arxiv.org/html/2412.00568v1

[^7]: https://polymathic-ai.org/blog/lostinlatentspace/

[^8]: https://www.themoonlight.io/ko/review/lost-in-latent-space-an-empirical-study-of-latent-diffusion-models-for-physics-emulation

[^9]: https://www.youtube.com/watch?v=bqjjWFQUmTg

[^10]: https://arxiv.org/html/2410.01153v2

[^11]: https://arxiv.org/abs/2410.01153

[^12]: https://github.com/ChenFengYe/motion-latent-diffusion

[^13]: https://lilianweng.github.io/posts/2021-07-11-diffusion-models/

[^14]: https://github.com/alen-smajic/Stable-Diffusion-Latent-Space-Explorer

[^15]: https://huggingface.co/papers/2507.02608

[^16]: https://github.com/topics/latent-diffusion-models

[^17]: https://kimjy99.github.io/논문리뷰/physdiff/

[^18]: https://github.com/PolymathicAI

[^19]: https://github.com/jaygshah/LDM-RR

[^20]: https://github.com/Won-Seong/simple-latent-diffusion-model

[^21]: https://astroautomata.com/software/

[^22]: https://github.com/fpramunno/ldm_superresolution

[^23]: https://github.com/alobashev/hessian-geometry-of-diffusion-models

[^24]: https://x.com/ArashVahdat/status/1963816805413339382

[^25]: https://github.com/CompVis/latent-diffusion

[^26]: https://huggingface.co/blog/lora

[^27]: https://github.com/haofanwang/Lora-for-Diffusers

[^28]: https://github.com/cloneofsimo/lora

[^29]: https://github.com/ControlGenAI/T-LoRA

[^30]: https://nips.cc/virtual/2024/poster/97791

[^31]: https://www.emergentmind.com/topics/latent-space-emulation

[^32]: https://github.com/huggingface/diffusion-models-class

[^33]: https://proceedings.neurips.cc/paper_files/paper/2024/file/6a57493d35fefea59d06396c7cb69228-Paper-Datasets_and_Benchmarks_Track.pdf

[^34]: https://openreview.net/forum?id=7yUxTNWyQGf

[^35]: https://vita-group.github.io/Fall23/Lecture 24-26.pdf

[^36]: https://code.swecha.org/gourinath/workshops/-/blob/main/README.md

[^37]: https://www.cclab.ac/downloads/montero_etal_22_NeurIPS.pdf

