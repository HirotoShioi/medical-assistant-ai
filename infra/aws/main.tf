terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "medical-assistant-terraform-state-123456789012"
    key    = "terraform.tfstate"
    region = "ap-northeast-1"
  }
}

locals {
  prefix = "medical-assistant"
}
