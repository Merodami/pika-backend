'use client'

import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { authFrontend } from '@pika/api'
import { Button, Form, Input, Alert } from 'antd'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { login } from '@/app/actions/auth'

// Use the frontend login schema
const loginSchema = authFrontend.LoginFormSchema

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema) as any, // Type assertion needed due to branded types
  })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      // Use the transform function to convert to backend format
      const tokenRequest = authFrontend.transformLoginToTokenRequest(data)
      const result = await login(tokenRequest)

      if (result?.error) {
        setError(result.error)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}

      <Form
        layout="vertical"
        onFinish={handleSubmit(onSubmit)}
        autoComplete="off"
      >
        <Form.Item
          label="Email address"
          validateStatus={errors.email ? 'error' : ''}
          help={errors.email?.message}
        >
          <Input
            {...register('email')}
            prefix={<MailOutlined />}
            placeholder="Enter your email"
            size="large"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          label="Password"
          validateStatus={errors.password ? 'error' : ''}
          help={errors.password?.message}
        >
          <Input.Password
            {...register('password')}
            prefix={<LockOutlined />}
            placeholder="Enter your password"
            size="large"
            autoComplete="current-password"
          />
        </Form.Item>

        <div className="flex items-center justify-between mb-6">
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Forgot your password?
          </Link>
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            size="large"
            className="w-full"
          >
            Sign in
          </Button>
        </Form.Item>

        <div className="text-center">
          <span className="text-gray-600">Don&apos;t have an account? </span>
          <Link
            href="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign up
          </Link>
        </div>
      </Form>
    </div>
  )
}
