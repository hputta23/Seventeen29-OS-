variable "region" {
  description = "AWS Region for the Sovereign Node (e.g., eu-central-1)"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev, staging, production)"
  type        = string
  default     = "dev"
}

variable "db_username" {
  type      = string
  default   = "kernel_admin"
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}
