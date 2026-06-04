terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  # Uncomment and configure for remote state (recommended for team use):
  # backend "azurerm" {
  #   resource_group_name  = "rg-tfstate"
  #   storage_account_name = "nhsnobtfstate"
  #   container_name       = "tfstate"
  #   key                  = "nhsnlink-onboarding.tfstate"
  # }
}

provider "azurerm" {
  features {
    resource_group {
      # Prevent accidental deletion of non-empty RGs
      prevent_deletion_if_contains_resources = true
    }
  }
}
