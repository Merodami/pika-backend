'use client'

import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  LockOutlined,
  MailOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Checkbox, Form, Input } from 'antd'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { register as registerAction } from '@/app/actions/auth'
import {
  RegisterFormSchema,
  transformRegisterToAPI,
  type RegisterFormData,
} from '@/lib/validations/auth'

// Extract input and output types for proper branded type handling
type RegisterFormInput = z.input<typeof RegisterFormSchema>
type RegisterFormOutput = z.output<typeof RegisterFormSchema>

export function RegisterForm() {
  const t = useTranslations('auth.register')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInput, unknown, RegisterFormOutput>({
    resolver: zodResolver(RegisterFormSchema)
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true)
      setError(null)

      // Transform frontend form data to backend API format using existing function
      const apiData = transformRegisterToAPI(data)

      // Use server action with proper SDK integration
      const result = await registerAction(apiData)

      if (result?.error) {
        setError(result.error)
      }
      // On success, server action will redirect to login
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
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label={t('firstName')}
            validateStatus={errors.firstName ? 'error' : ''}
            help={errors.firstName?.message}
          >
            <Input
              {...register('firstName')}
              prefix={<UserOutlined />}
              placeholder={t('firstName')}
              size="large"
              autoComplete="given-name"
            />
          </Form.Item>

          <Form.Item
            label={t('lastName')}
            validateStatus={errors.lastName ? 'error' : ''}
            help={errors.lastName?.message}
          >
            <Input
              {...register('lastName')}
              prefix={<UserOutlined />}
              placeholder={t('lastName')}
              size="large"
              autoComplete="family-name"
            />
          </Form.Item>
        </div>

        <Form.Item
          label={t('email')}
          validateStatus={errors.email ? 'error' : ''}
          help={errors.email?.message}
        >
          <Input
            {...register('email')}
            prefix={<MailOutlined />}
            placeholder={t('email')}
            size="large"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          label={t('password')}
          validateStatus={errors.password ? 'error' : ''}
          help={errors.password?.message}
        >
          <Input.Password
            {...register('password')}
            prefix={<LockOutlined />}
            placeholder={t('password')}
            size="large"
            autoComplete="new-password"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <Form.Item
          label={t('confirmPassword')}
          validateStatus={errors.confirmPassword ? 'error' : ''}
          help={errors.confirmPassword?.message}
        >
          <Input.Password
            {...register('confirmPassword')}
            prefix={<LockOutlined />}
            placeholder={t('confirmPassword')}
            size="large"
            autoComplete="new-password"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <Form.Item
          validateStatus={errors.acceptTerms ? 'error' : ''}
          help={errors.acceptTerms?.message}
        >
          <Checkbox {...register('acceptTerms')}>{t('acceptTerms')}</Checkbox>
        </Form.Item>

        <Form.Item>
          <Checkbox {...register('marketingConsent')}>
            {t('marketingConsent')}
          </Checkbox>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            loading={isLoading}
            className="w-full"
          >
            {t('button')}
          </Button>
        </Form.Item>

        <div className="text-center">
          <span className="text-gray-600">{t('haveAccount')} </span>
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            {t('signIn')}
          </Link>
        </div>
      </Form>
    </div>
  )
}
