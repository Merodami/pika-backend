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
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'

import { register as registerAction } from '@/app/actions/auth'
import {
  RegisterFormSchema,
  transformRegisterToAPI,
  type RegisterFormData,
} from '@/lib/validations/auth'
import { LocalizedLink } from '@/components/ui/LocalizedLink'
import { useLocalizedRouter } from '@/hooks/useLocalizedRouter'

// Extract input and output types for proper branded type handling
type RegisterFormInput = z.input<typeof RegisterFormSchema>
type RegisterFormOutput = z.output<typeof RegisterFormSchema>

export function RegisterForm() {
  const t = useTranslations('auth.register')
  const router = useLocalizedRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInput, unknown, RegisterFormOutput>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: true,
      marketingConsent: false,
    },
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
      } else if (result?.success) {
        // Redirect to login page with the correct locale
        router.push('/login')
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
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            label={t('firstName')}
            validateStatus={errors.firstName ? 'error' : ''}
            help={errors.firstName?.message}
          >
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  prefix={<UserOutlined />}
                  placeholder={t('firstName')}
                  size="large"
                  autoComplete="given-name"
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label={t('lastName')}
            validateStatus={errors.lastName ? 'error' : ''}
            help={errors.lastName?.message}
          >
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  prefix={<UserOutlined />}
                  placeholder={t('lastName')}
                  size="large"
                  autoComplete="family-name"
                />
              )}
            />
          </Form.Item>
        </div>

        <Form.Item
          label={t('email')}
          validateStatus={errors.email ? 'error' : ''}
          help={errors.email?.message}
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                prefix={<MailOutlined />}
                placeholder={t('email')}
                size="large"
                autoComplete="email"
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label={t('password')}
          validateStatus={errors.password ? 'error' : ''}
          help={errors.password?.message}
        >
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                prefix={<LockOutlined />}
                placeholder={t('password')}
                size="large"
                autoComplete="new-password"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label={t('confirmPassword')}
          validateStatus={errors.confirmPassword ? 'error' : ''}
          help={errors.confirmPassword?.message}
        >
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                prefix={<LockOutlined />}
                placeholder={t('confirmPassword')}
                size="large"
                autoComplete="new-password"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
              />
            )}
          />
        </Form.Item>

        <Form.Item
          validateStatus={errors.acceptTerms ? 'error' : ''}
          help={errors.acceptTerms?.message}
        >
          <Controller
            name="acceptTerms"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Checkbox
                checked={value}
                onChange={(e) => onChange(e.target.checked)}
              >
                {t('acceptTerms')}
              </Checkbox>
            )}
          />
        </Form.Item>

        <Form.Item>
          <Controller
            name="marketingConsent"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Checkbox
                checked={value}
                onChange={(e) => onChange(e.target.checked)}
              >
                {t('marketingConsent')}
              </Checkbox>
            )}
          />
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
          <LocalizedLink
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            {t('signIn')}
          </LocalizedLink>
        </div>
      </Form>
    </div>
  )
}
