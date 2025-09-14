<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# 어떤 프로그램을 사용하고 목적이 무엇인지를 앞에 써주어야한다.

[Cloud Storage – 이미지 저장]
목적: 손글씨 포함 문서 원본 보관 및 처리를 위한 스토리지

1. Cloud Storage에 손글씨 포함 이미지 업로드

[Document AI – Handwriting OCR 프로세서 생성]
목적: 손글씨 OCR 전용 프로세서 준비

2. gcloud 명령으로 “Handwriting OCR” 프로세서 생성
```bash
gcloud document-ai processors create \
  --display-name="Handwriting OCR" \
  --type=OCR_PROCESSOR \
  --location=us
```

[Python + Document AI Client – OCR 처리]
목적: 손글씨 및 인쇄 텍스트 인식

3. Python 코드로 OCR 요청
```python
from google.cloud import documentai_v1 as documentai
client = documentai.DocumentProcessorServiceClient()
name = client.processor_path(project_id, location, processor_id)
with open(input_uri, "rb") as f: raw = f.read()
request = {"name": name, "raw_document": {"content": raw, "mime_type": "image/png"}}
result = client.process_document(request=request)
blocks = result.document.pages
```

[Processing – 텍스트 블록 추출]
목적: 인식된 텍스트 구조화

4. OCR 결과 `blocks` 순회, `boundingBox`, `languageCode`, `confidence` 등 텍스트 블록 추출

[Document AI – Layout Parser 호출]
목적: 표·차트·시각 요소 감지

5. Layout Parser 프로세서 호출 (`processorType=LAYOUT_PROCESSOR`), `visualElements` 바운딩 박스 파싱

[Document AI – Form Parser 호출]
목적: 키-값 쌍·표 데이터 구조화

6. Form Parser 프로세서 호출 (`processorType=FORM_PARSER_PROCESSOR`), 키-값 및 표 항목 추출

[Processing – 수식 후보 필터링]
목적: 수식 텍스트 식별

7. 텍스트 블록에서 정규표현식(`[\d\w\+\-\=\^\{\}\$$+`)로 수식 후보 추출
    - 간단 수식: 문자열 그대로 사용
    - 복잡 수식: Custom Math Extractor 학습용 데이터로 분류

[Document AI – Custom Training Pipeline]
목적: 고도화된 수식 인식 모델 학습

8. 라벨링된 문서+수식 JSON 준비 후 `CustomTrainingPipeline` API로 모델 학습 및 `processorType=CUSTOM_DOCUMENT_EXTRACTOR` 배포

[Document AI – Layout Parser 재호출]
목적: 그래프·차트 영역 재확인

9. `visualElements`에서 `type=TABLE` 또는 `type=IMAGE` 필터링, 차트 영역 바운딩 박스 좌표 추출 및 Cloud Storage에 저장

[Processing – 차트 이미지 후처리]
목적: 데이터 포인트 추출

10. Python(OpenCV/TensorFlow)으로 차트 이미지 분석, `[{x:…, y:…}, …]` 형태 데이터 리스트 생성

[Processing – 최종 JSON 구조화]
목적: 전체 결과 통합

11. 텍스트·표·키-값·수식·차트 데이터 포함 JSON 생성
```json
{
  "text_blocks": [...],
  "tables": [...],
  "key_values": [...],
  "math_expressions": [...],
  "charts": [
    {
      "boundingBox": {...},
      "data": [{ "x":..., "y":... }, ...]
    }
  ]
}
```

[Visualization – Matplotlib 코드 생성]
목적: 고품질 시각화 자동화

12. 

- 수식: Matplotlib LaTeX 렌더링 코드 템플릿 삽입
- 차트: Matplotlib 플롯 코드 템플릿 삽입

[BigQuery/Firestore – 데이터 저장]
목적: 분석·조회용 데이터베이스 적재

13. 결과 JSON 및 시각화 코드 스니펫을 BigQuery 또는 Firestore에 저장

[Cloud Monitoring – 로깅·알림]
목적: 운영 모니터링 및 장애 대응

14. API 호출·성공 여부 로그 수집
15. 호출량·에러 알림을 위한 Cloud Monitoring Alert 설정
