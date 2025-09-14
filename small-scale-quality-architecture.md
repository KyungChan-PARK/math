# Small Scale Math Platform - Terraform Configuration
# Optimized for 10 students, $100/month budget

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "math-platform-small"
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "monthly_budget" {
  description = "Monthly budget in USD"
  type        = number
  default     = 100
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ============================================
# BUDGET ALERT (비용 관리 최우선)
# ============================================

resource "google_billing_budget" "monthly_budget" {
  billing_account = "YOUR_BILLING_ACCOUNT_ID"
  display_name    = "Math Platform Monthly Budget"
  
  budget_filter {
    projects = ["projects/${var.project_id}"]
  }
  
  amount {
    specified_amount {
      currency_code = "USD"
      units         = var.monthly_budget
    }
  }
  
  threshold_rules {
    threshold_percent = 0.5  # 50% 알림
    spend_basis      = "CURRENT_SPEND"
  }
  
  threshold_rules {
    threshold_percent = 0.8  # 80% 경고
    spend_basis      = "CURRENT_SPEND"
  }
  
  threshold_rules {
    threshold_percent = 1.0  # 100% 중단
    spend_basis      = "CURRENT_SPEND"
  }
}

# ============================================
# MINIMAL FIRESTORE (무료 티어 활용)
# ============================================

resource "google_firestore_database" "main" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
  
  # 무료 할당량 최대 활용
  concurrency_mode = "OPTIMISTIC"
}

# Collections 구조 (작게 유지)
# - problems: 검토 완료된 문제만 (최대 1000개)
# - review_queue: 검토 대기 (최대 100개)
# - templates: 재사용 템플릿 (최대 200개)
# - analytics: 사용 통계 (30일 보관)

# ============================================
# CLOUD STORAGE (최소 용량)
# ============================================

resource "google_storage_bucket" "problems" {
  name          = "${var.project_id}-problems"
  location      = var.region
  force_destroy = true
  
  # 비용 절감 설정
  storage_class = "STANDARD"
  
  lifecycle_rule {
    condition {
      age = 30  # 30일 후 자동 삭제
    }
    action {
      type = "Delete"
    }
  }
  
  lifecycle_rule {
    condition {
      age = 7
    }
    action {
      type = "SetStorageClass"
      storage_class = "NEARLINE"  # 7일 후 저렴한 스토리지로
    }
  }
}

# ============================================
# CLOUD FUNCTIONS (무료 티어)
# ============================================

# Secret for Gemini API Key
resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = "gemini-api-key"
  
  replication {
    auto {}
  }
}

# Problem Generation Function
resource "google_cloudfunctions2_function" "generate_problem" {
  name     = "generate-problem"
  location = var.region
  
  build_config {
    runtime     = "nodejs20"
    entry_point = "generateProblem"
    source {
      storage_source {
        bucket = google_storage_bucket.functions.name
        object = "generate-problem.zip"
      }
    }
  }
  
  service_config {
    max_instance_count = 1  # 비용 절감: 최대 1개 인스턴스
    min_instance_count = 0  # 비용 절감: 사용 안할 때 0
    available_memory   = "256M"  # 최소 메모리
    timeout_seconds    = 30
    
    environment_variables = {
      PROJECT_ID    = var.project_id
      GEMINI_MODEL  = "gemini-1.5-flash"  # 저렴한 모델 사용
      MAX_COST_PER_DAY = "3"  # 일일 비용 제한
    }
    
    secret_environment_variables {
      key        = "GEMINI_API_KEY"
      project_id = var.project_id
      secret     = google_secret_manager_secret.gemini_api_key.secret_id
      version    = "latest"
    }
  }
}

# Review Workflow Function
resource "google_cloudfunctions2_function" "review_workflow" {
  name     = "review-workflow"
  location = var.region
  
  build_config {
    runtime     = "nodejs20"
    entry_point = "handleReview"
    source {
      storage_source {
        bucket = google_storage_bucket.functions.name
        object = "review-workflow.zip"
      }
    }
  }
  
  service_config {
    max_instance_count = 1
    min_instance_count = 0
    available_memory   = "128M"  # 최소 메모리
    timeout_seconds    = 10
  }
}

# ============================================
# CLOUD RUN (교사 앱 - 최소 구성)
# ============================================

resource "google_cloud_run_v2_service" "teacher_app" {
  name     = "teacher-app"
  location = var.region
  
  template {
    containers {
      image = "gcr.io/${var.project_id}/teacher-app:latest"
      
      resources {
        limits = {
          cpu    = "0.5"  # 최소 CPU
          memory = "256Mi"  # 최소 메모리
        }
      }
      
      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }
    }
    
    scaling {
      min_instance_count = 0  # 사용 안할 때 0
      max_instance_count = 1  # 최대 1개
    }
  }
  
  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

# ============================================
# CLOUD SCHEDULER (주간 배치 작업)
# ============================================

resource "google_cloud_scheduler_job" "weekly_generation" {
  name     = "weekly-problem-generation"
  schedule = "0 20 * * SUN"  # 매주 일요일 저녁 8시
  region   = var.region
  
  http_target {
    uri = google_cloudfunctions2_function.generate_problem.service_config[0].uri
    http_method = "POST"
    
    body = base64encode(jsonencode({
      action = "weekly_batch",
      count  = 20
    }))
    
    oidc_token {
      service_account_email = google_service_account.scheduler.email
    }
  }
}

# ============================================
# IAM (최소 권한)
# ============================================

resource "google_service_account" "functions" {
  account_id   = "functions-sa"
  display_name = "Cloud Functions Service Account"
}

resource "google_service_account" "scheduler" {
  account_id   = "scheduler-sa"
  display_name = "Cloud Scheduler Service Account"
}

resource "google_project_iam_member" "functions_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.functions.email}"
}

resource "google_project_iam_member" "functions_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.functions.email}"
}

# ============================================
# MONITORING (무료 티어)
# ============================================

resource "google_monitoring_alert_policy" "budget_alert" {
  display_name = "Budget Exceeded Alert"
  combiner     = "OR"
  
  conditions {
    display_name = "Monthly spend exceeds $80"
    
    condition_threshold {
      filter = "resource.type=\"billing_account\""
      
      aggregations {
        alignment_period   = "86400s"  # 1 day
        per_series_aligner = "ALIGN_SUM"
      }
      
      comparison      = "COMPARISON_GT"
      threshold_value = 80
      duration        = "60s"
    }
  }
  
  notification_channels = [google_monitoring_notification_channel.email.id]
  
  alert_strategy {
    auto_close = "86400s"  # 1 day
  }
}

resource "google_monitoring_notification_channel" "email" {
  display_name = "Teacher Email"
  type         = "email"
  
  labels = {
    email_address = "teacher@school.edu"
  }
}

# ============================================
# FUNCTIONS SOURCE BUCKET
# ============================================

resource "google_storage_bucket" "functions" {
  name          = "${var.project_id}-functions"
  location      = var.region
  force_destroy = true
  
  uniform_bucket_level_access = true
}

# ============================================
# OUTPUTS
# ============================================

output "teacher_app_url" {
  value = google_cloud_run_v2_service.teacher_app.uri
}

output "monthly_cost_estimate" {
  value = "Estimated: $60/month (60% of budget)"
}

output "free_tier_usage" {
  value = {
    firestore   = "50K reads, 20K writes per day"
    functions   = "2M invocations per month"
    storage     = "5GB storage"
    cloud_run   = "2M requests per month"
  }
}