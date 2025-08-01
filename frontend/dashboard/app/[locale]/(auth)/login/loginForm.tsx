'use client'

import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { authFrontend } from '@merodami/pika-api'
import { Button, Form, Input, Alert, Checkbox } from 'antd'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'

import { login } from '@/app/actions/auth'
import { useAppStore } from '@/store/app.store'
import { LocalizedLink } from '@/components/ui/LocalizedLink'
import { useLocalizedRouter } from '@/hooks/useLocalizedRouter'

// Use the admin/business login schema with enhanced password requirements
const loginSchema = authFrontend.AdminBusinessLoginFormSchema

// Extract input and output types for proper branded type handling
type LoginFormInput = z.input<typeof loginSchema>
type LoginFormOutput = z.output<typeof loginSchema>
type LoginFormData = LoginFormOutput

export function LoginForm() {
  const t = useTranslations('auth.login')
  const router = useLocalizedRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { formDrafts, saveFormDraft, clearFormDraft } = useAppStore()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInput, unknown, LoginFormOutput>({
    resolver: zodResolver(loginSchema),
    defaultValues: formDrafts['login'] || {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      // Transform to backend format
      const tokenRequest = authFrontend.transformLoginToTokenRequest(data)
      const result = await login(tokenRequest)

      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        // Clear form draft on success
        clearFormDraft('login')

        // Industry standard approach: refresh router to update server component state
        // then navigate to home page
        router.refresh()
        router.push(`/${router.locale}`)
      }
    } catch {
      setError(t('error'))
    } finally {
      setIsLoading(false)
    }
  }

  // Save form draft on input change
  const handleInputChange = (
    field: keyof LoginFormData,
    value: string | boolean
  ) => {
    const currentData = formDrafts['login'] || {}
    saveFormDraft('login', { ...currentData, [field]: value })
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
                onChange={(e) => {
                  field.onChange(e)
                  handleInputChange('email', e.target.value)
                }}
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
                autoComplete="current-password"
                onChange={(e) => {
                  field.onChange(e)
                  handleInputChange('password', e.target.value)
                }}
              />
            )}
          />
        </Form.Item>

        <Form.Item>
          <div className="flex items-center justify-between">
            <Controller
              name="rememberMe"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Checkbox
                  checked={value}
                  onChange={(e) => {
                    onChange(e.target.checked)
                    handleInputChange('rememberMe', e.target.checked)
                  }}
                >
                  {t('rememberMe')}
                </Checkbox>
              )}
            />
            <LocalizedLink
              href="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {t('forgotPassword')}
            </LocalizedLink>
          </div>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            size="large"
            className="w-full"
          >
            {t('button')}
          </Button>
        </Form.Item>

        <div className="text-center">
          <span className="text-gray-600">{t('noAccount')} </span>
          <LocalizedLink
            href="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            {t('signUp')}
          </LocalizedLink>
        </div>
      </Form>
    </div>
  )
}
