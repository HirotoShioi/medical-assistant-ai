resource "aws_cognito_user_pool" "this" {
  name                     = "${local.prefix}-user-pool"
  auto_verified_attributes = ["email"]
  mfa_configuration        = "OFF"
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }
  username_attributes = ["email"]

  password_policy {
    temporary_password_validity_days = 7
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
  }
  admin_create_user_config {
    allow_admin_create_user_only = true
    
    invite_message_template {
      email_subject = "【Medical Assistant】アカウント招待のお知らせ"
      email_message = "<html><body style='font-family: sans-serif; padding: 20px; color: #333;'><h2 style='color: #2c5282;'>Medical Assistant へようこそ</h2><p>Medical Assistantをご利用いただき、ありがとうございます。</p><p>仮パスワードが発行されましたので、以下の情報でログインをお願いいたします。</p><div style='background: #f7fafc; padding: 15px; border-radius: 5px; margin: 20px 0;'><p><strong>ログインURL:</strong><br><a href='https://medical-assistant.pages.dev/sign-in'>https://medical-assistant.pages.dev/sign-in</a></p><p><strong>メールアドレス:</strong><br>{username}</p><p><strong>パスワード:</strong><br>{####}</p></div><p style='color: #e53e3e;'>※初回ログイン時にパスワードの変更が必要です。</p></body></html>"
      sms_message = "Username: {username}\nYour verification code is {####}"
    }
  }
}

resource "aws_cognito_user_pool_client" "this" {
  name                                 = "${local.prefix}-user-pool-client"
  user_pool_id                         = aws_cognito_user_pool.this.id
  explicit_auth_flows                  = ["ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
  supported_identity_providers         = ["COGNITO"]
}
