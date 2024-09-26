resource "aws_cognito_user_pool" "this" {
  name                     = "${local.prefix}-user-pool"
  auto_verified_attributes = ["email"]
  mfa_configuration        = "OFF"
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }
  username_attributes = ["email"]
  admin_create_user_config {
    allow_admin_create_user_only = true
  }
  password_policy {
    temporary_password_validity_days = 7
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
  }
}

resource "aws_cognito_user_pool_client" "this" {
  name                                 = "${local.prefix}-user-pool-client"
  user_pool_id                         = aws_cognito_user_pool.this.id
  explicit_auth_flows                  = ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  supported_identity_providers         = ["COGNITO"]
}
