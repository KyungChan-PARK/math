# Math Education Platform - GCP Infrastructure as Code
# Terraform configuration for complete cloud migration

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
  
  backend "gcs" {
    bucket = "math-platform-terraform-state"
    prefix = "terraform/state"
  }
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
  default     = "math-education-platform"
}

variable "region" {
  description = "Default region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment (dev/staging/prod)"
  type        = string
  default     = "prod"
}

# Provider Configuration
provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Enable Required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "cloudfunctions.googleapis.com",
    "firestore.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com",
    "aiplatform.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "cloudcdn.googleapis.com",
    "compute.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudscheduler.googleapis.com",
    "pubsub.googleapis.com"
  ])
  
  service            = each.value
  disable_on_destroy = false
}

# ============================================
# NETWORKING
# ============================================

# VPC Network
resource "google_compute_network" "main" {
  name                    = "${var.environment}-math-network"
  auto_create_subnetworks = false
  
  depends_on = [google_project_service.apis]
}

# Subnet for Cloud Run
resource "google_compute_subnetwork" "cloudrun" {
  name          = "${var.environment}-cloudrun-subnet"
  network       = google_compute_network.main.id
  region        = var.region
  ip_cidr_range = "10.0.1.0/24"
  
  private_ip_google_access = true
}

# VPC Connector for Cloud Run
resource "google_vpc_access_connector" "main" {
  name          = "${var.environment}-vpc-connector"
  region        = var.region
  ip_cidr_range = "10.0.2.0/28"
  network       = google_compute_network.main.name
  
  depends_on = [google_project_service.apis]
}

# ============================================
# STORAGE
# ============================================

# Static Content Bucket (HTML, CSS, JS)
resource "google_storage_bucket" "static_content" {
  name          = "${var.project_id}-${var.environment}-static"
  location      = var.region
  force_destroy = var.environment != "prod"
  
  website {
    main_page_suffix = "index.html"
    not_found_page   = "404.html"
  }
  
  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }
}

# User Generated Content Bucket
resource "google_storage_bucket" "user_content" {
  name          = "${var.project_id}-${var.environment}-user-content"
  location      = var.region
  force_destroy = var.environment != "prod"
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
  
  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "SetStorageClass"
      storage_class = "ARCHIVE"
    }
  }
}

# ML Models Bucket
resource "google_storage_bucket" "ml_models" {
  name          = "${var.project_id}-${var.environment}-ml-models"
  location      = var.region
  force_destroy = false
  
  versioning {
    enabled = true
  }
}

# ============================================
# DATABASE
# ============================================

# Firestore Database
resource "google_firestore_database" "main" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
  
  concurrency_mode            = "OPTIMISTIC"
  app_engine_integration_mode = "DISABLED"
  
  depends_on = [google_project_service.apis]
}

# Firestore Indexes
resource "google_firestore_index" "user_progress" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "progress"
  
  fields {
    field_path = "userId"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "lastUpdated"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "problems_by_grade" {
  project    = var.project_id
  database   = google_firestore_database.main.name
  collection = "problems"
  
  fields {
    field_path = "grade"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "unit"
    order      = "ASCENDING"
  }
  
  fields {
    field_path = "difficulty"
    order      = "ASCENDING"
  }
}

# ============================================
# SECRET MANAGEMENT
# ============================================

# API Keys Secret
resource "google_secret_manager_secret" "api_keys" {
  secret_id = "${var.environment}-api-keys"
  
  replication {
    auto {}
  }
  
  depends_on = [google_project_service.apis]
}

# Gemini API Key
resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = "${var.environment}-gemini-api-key"
  
  replication {
    auto {}
  }
}

# Database Connection String
resource "google_secret_manager_secret" "db_connection" {
  secret_id = "${var.environment}-db-connection"
  
  replication {
    auto {}
  }
}

# ============================================
# CLOUD RUN SERVICES
# ============================================

# Artifact Registry for Docker Images
resource "google_artifact_registry_repository" "docker" {
  location      = var.region
  repository_id = "${var.environment}-docker-repo"
  format        = "DOCKER"
  
  depends_on = [google_project_service.apis]
}

# Main WebSocket Server
resource "google_cloud_run_v2_service" "websocket_server" {
  name     = "${var.environment}-websocket-server"
  location = var.region
  
  template {
    vpc_access {
      connector = google_vpc_access_connector.main.id
      egress    = "ALL_TRAFFIC"
    }
    
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker.repository_id}/websocket-server:latest"
      
      ports {
        container_port = 8080
      }
      
      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }
      
      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }
      
      env {
        name = "GEMINI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.gemini_api_key.secret_id
            version = "latest"
          }
        }
      }
      
      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
      }
      
      startup_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 10
        period_seconds        = 10
        failure_threshold     = 3
      }
      
      liveness_probe {
        http_get {
          path = "/health"
        }
        period_seconds = 30
      }
    }
    
    scaling {
      min_instance_count = var.environment == "prod" ? 2 : 1
      max_instance_count = var.environment == "prod" ? 100 : 10
    }
    
    timeout = "300s"
  }
  
  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
  
  depends_on = [
    google_project_service.apis,
    google_vpc_access_connector.main
  ]
}

# API Gateway Service
resource "google_cloud_run_v2_service" "api_gateway" {
  name     = "${var.environment}-api-gateway"
  location = var.region
  
  template {
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker.repository_id}/api-gateway:latest"
      
      ports {
        container_port = 8080
      }
      
      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }
      
      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }
    }
    
    scaling {
      min_instance_count = 1
      max_instance_count = 50
    }
  }
  
  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

# ============================================
# CLOUD FUNCTIONS
# ============================================

# Generate Problems Function
resource "google_cloudfunctions2_function" "generate_problems" {
  name     = "${var.environment}-generate-problems"
  location = var.region
  
  build_config {
    runtime     = "nodejs20"
    entry_point = "generateProblems"
    
    source {
      storage_source {
        bucket = google_storage_bucket.ml_models.name
        object = "functions/generate-problems.zip"
      }
    }
  }
  
  service_config {
    max_instance_count    = 100
    min_instance_count    = 0
    available_memory      = "512M"
    timeout_seconds       = 60
    ingress_settings      = "ALLOW_ALL"
    all_traffic_on_latest_revision = true
    
    environment_variables = {
      PROJECT_ID  = var.project_id
      ENVIRONMENT = var.environment
    }
    
    secret_environment_variables {
      key        = "GEMINI_API_KEY"
      project_id = var.project_id
      secret     = google_secret_manager_secret.gemini_api_key.secret_id
      version    = "latest"
    }
  }
  
  depends_on = [google_project_service.apis]
}

# Process Student Answer Function
resource "google_cloudfunctions2_function" "process_answer" {
  name     = "${var.environment}-process-answer"
  location = var.region
  
  build_config {
    runtime     = "nodejs20"
    entry_point = "processAnswer"
    
    source {
      storage_source {
        bucket = google_storage_bucket.ml_models.name
        object = "functions/process-answer.zip"
      }
    }
  }
  
  service_config {
    max_instance_count = 50
    min_instance_count = 0
    available_memory   = "256M"
    timeout_seconds    = 30
    
    environment_variables = {
      PROJECT_ID = var.project_id
    }
  }
}

# ============================================
# PUB/SUB
# ============================================

# Problem Generation Topic
resource "google_pubsub_topic" "problem_generation" {
  name = "${var.environment}-problem-generation"
  
  message_retention_duration = "86400s" # 1 day
}

# Progress Update Topic
resource "google_pubsub_topic" "progress_update" {
  name = "${var.environment}-progress-update"
}

# Problem Generation Subscription
resource "google_pubsub_subscription" "problem_generation" {
  name  = "${var.environment}-problem-generation-sub"
  topic = google_pubsub_topic.problem_generation.id
  
  ack_deadline_seconds = 60
  
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
  
  push_config {
    push_endpoint = google_cloudfunctions2_function.generate_problems.service_config[0].uri
    
    oidc_token {
      service_account_email = google_service_account.cloud_functions.email
    }
  }
}

# ============================================
# LOAD BALANCER & CDN
# ============================================

# Backend Bucket for Static Content
resource "google_compute_backend_bucket" "static" {
  name        = "${var.environment}-static-backend"
  bucket_name = google_storage_bucket.static_content.name
  enable_cdn  = true
  
  cdn_policy {
    cache_mode = "CACHE_ALL_STATIC"
    default_ttl = 3600
    max_ttl     = 86400
    
    cache_key_policy {
      include_host          = true
      include_protocol      = true
      include_query_string  = false
    }
  }
  
  depends_on = [google_project_service.apis]
}

# URL Map
resource "google_compute_url_map" "main" {
  name            = "${var.environment}-url-map"
  default_service = google_compute_backend_bucket.static.id
  
  host_rule {
    hosts        = ["*"]
    path_matcher = "main"
  }
  
  path_matcher {
    name            = "main"
    default_service = google_compute_backend_bucket.static.id
    
    path_rule {
      paths   = ["/api/*"]
      service = google_compute_backend_service.api.id
    }
    
    path_rule {
      paths   = ["/ws/*"]
      service = google_compute_backend_service.websocket.id
    }
  }
}

# Backend Service for API
resource "google_compute_backend_service" "api" {
  name = "${var.environment}-api-backend"
  
  backend {
    group = google_compute_region_network_endpoint_group.api_neg.id
  }
  
  depends_on = [google_project_service.apis]
}

# Backend Service for WebSocket
resource "google_compute_backend_service" "websocket" {
  name = "${var.environment}-websocket-backend"
  
  backend {
    group = google_compute_region_network_endpoint_group.websocket_neg.id
  }
  
  session_affinity = "CLIENT_IP"
}

# Network Endpoint Groups for Cloud Run
resource "google_compute_region_network_endpoint_group" "api_neg" {
  name                  = "${var.environment}-api-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  
  cloud_run {
    service = google_cloud_run_v2_service.api_gateway.name
  }
}

resource "google_compute_region_network_endpoint_group" "websocket_neg" {
  name                  = "${var.environment}-websocket-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  
  cloud_run {
    service = google_cloud_run_v2_service.websocket_server.name
  }
}

# HTTPS Proxy
resource "google_compute_target_https_proxy" "main" {
  name    = "${var.environment}-https-proxy"
  url_map = google_compute_url_map.main.id
  
  ssl_certificates = [google_compute_managed_ssl_certificate.main.id]
}

# SSL Certificate
resource "google_compute_managed_ssl_certificate" "main" {
  name = "${var.environment}-ssl-cert"
  
  managed {
    domains = var.environment == "prod" ? 
      ["mathplatform.com", "www.mathplatform.com"] : 
      ["${var.environment}.mathplatform.com"]
  }
}

# Global Forwarding Rule
resource "google_compute_global_forwarding_rule" "main" {
  name       = "${var.environment}-forwarding-rule"
  target     = google_compute_target_https_proxy.main.id
  port_range = "443"
  ip_address = google_compute_global_address.main.address
}

# Global IP Address
resource "google_compute_global_address" "main" {
  name = "${var.environment}-global-ip"
}

# ============================================
# IAM & SERVICE ACCOUNTS
# ============================================

# Service Account for Cloud Run
resource "google_service_account" "cloud_run" {
  account_id   = "${var.environment}-cloud-run-sa"
  display_name = "Cloud Run Service Account"
}

# Service Account for Cloud Functions
resource "google_service_account" "cloud_functions" {
  account_id   = "${var.environment}-cf-sa"
  display_name = "Cloud Functions Service Account"
}

# IAM Bindings
resource "google_project_iam_member" "cloud_run_permissions" {
  for_each = toset([
    "roles/firestore.user",
    "roles/secretmanager.secretAccessor",
    "roles/storage.objectViewer",
    "roles/pubsub.publisher"
  ])
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_project_iam_member" "cloud_functions_permissions" {
  for_each = toset([
    "roles/firestore.user",
    "roles/secretmanager.secretAccessor",
    "roles/storage.objectAdmin",
    "roles/aiplatform.user"
  ])
  
  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.cloud_functions.email}"
}

# ============================================
# CLOUD SCHEDULER
# ============================================

# Daily Report Generation
resource "google_cloud_scheduler_job" "daily_report" {
  name     = "${var.environment}-daily-report"
  schedule = "0 2 * * *" # 2 AM daily
  region   = var.region
  
  pubsub_target {
    topic_name = google_pubsub_topic.progress_update.id
    data       = base64encode(jsonencode({
      action = "generate_daily_report"
    }))
  }
  
  depends_on = [google_project_service.apis]
}

# Hourly Cache Warm-up
resource "google_cloud_scheduler_job" "cache_warmup" {
  name     = "${var.environment}-cache-warmup"
  schedule = "0 * * * *" # Every hour
  region   = var.region
  
  http_target {
    uri         = "${google_cloud_run_v2_service.api_gateway.uri}/warmup"
    http_method = "GET"
  }
}

# ============================================
# MONITORING & ALERTING
# ============================================

# Uptime Check
resource "google_monitoring_uptime_check_config" "api" {
  display_name = "${var.environment}-api-uptime"
  timeout      = "10s"
  period       = "60s"
  
  http_check {
    path         = "/health"
    port         = "443"
    use_ssl      = true
    validate_ssl = true
  }
  
  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = var.environment == "prod" ? "mathplatform.com" : "${var.environment}.mathplatform.com"
    }
  }
}

# Alert Policy for High Error Rate
resource "google_monitoring_alert_policy" "error_rate" {
  display_name = "${var.environment}-high-error-rate"
  combiner     = "OR"
  
  conditions {
    display_name = "Cloud Run Error Rate > 1%"
    
    condition_threshold {
      filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.labels.response_code_class=\"5xx\""
      
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
      
      comparison      = "COMPARISON_GT"
      threshold_value = 0.01
      duration        = "300s"
    }
  }
  
  notification_channels = [google_monitoring_notification_channel.email.id]
}

# Notification Channel
resource "google_monitoring_notification_channel" "email" {
  display_name = "${var.environment}-email-notification"
  type         = "email"
  
  labels = {
    email_address = "alerts@mathplatform.com"
  }
}

# ============================================
# OUTPUTS
# ============================================

output "static_bucket_url" {
  value = google_storage_bucket.static_content.url
}

output "load_balancer_ip" {
  value = google_compute_global_address.main.address
}

output "cloud_run_urls" {
  value = {
    websocket = google_cloud_run_v2_service.websocket_server.uri
    api       = google_cloud_run_v2_service.api_gateway.uri
  }
}

output "project_id" {
  value = var.project_id
}

output "region" {
  value = var.region
}