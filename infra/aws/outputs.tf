output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.this.id
}

output "cognito_user_pool_client_id" {
    value = aws_cognito_user_pool_client.this.id
}

output "user_pool_endpoint" {
  value = "https://${aws_cognito_user_pool_domain.main.domain}.auth.ap-northeast-1.amazoncognito.com/oauth2/idpresponse"
}