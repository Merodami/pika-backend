'use client'

import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  LockOutlined,
  MailOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Divider, Form, Input, Select } from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useAuthStore } from '@/store/auth.store'
import { showError, showSuccess } from '@/store/notifications.store'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    accountType: z.enum(['BUSINESS', 'ADMIN'], {
      errorMap: () => ({ message: 'Please select an account type' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const {
    register: registerUser,
    isLoading,
    error,
    clearError,
  } = useAuthStore()
  const [form] = Form.useForm()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError()
      await registerUser(data.email, data.password, data.name)
      showSuccess(
        'Registration successful',
        'Welcome to Pika Dashboard! Please verify your email.'
      )

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      showError('Registration failed', err.message || 'Please try again')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign in here
          </Link>
        </p>
      </div>

      {error && (
        <Alert
          message="Registration Failed"
          description={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit(onSubmit)}
        autoComplete="off"
      >
        <Form.Item
          label="Full Name"
          validateStatus={errors.name ? 'error' : ''}
          help={errors.name?.message}
        >
          <Input
            {...register('name')}
            prefix={<UserOutlined />}
            placeholder="Enter your full name"
            size="large"
          />
        </Form.Item>

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
          />
        </Form.Item>

        <Form.Item
          label="Account Type"
          validateStatus={errors.accountType ? 'error' : ''}
          help={errors.accountType?.message}
        >
          <Select
            {...register('accountType')}
            placeholder="Select your account type"
            size="large"
            options={[
              {
                value: 'BUSINESS',
                label: 'Business Owner',
                description: 'Create and manage vouchers for your business',
              },
              {
                value: 'ADMIN',
                label: 'Administrator',
                description: 'Manage the platform and user accounts',
              },
            ]}
            optionRender={(option) => (
              <div>
                <div>{option.label}</div>
                <div className="text-sm text-gray-500">
                  {option.data.description}
                </div>
              </div>
            )}
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
            placeholder="Create a password"
            size="large"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <Form.Item
          label="Confirm Password"
          validateStatus={errors.confirmPassword ? 'error' : ''}
          help={errors.confirmPassword?.message}
        >
          <Input.Password
            {...register('confirmPassword')}
            prefix={<LockOutlined />}
            placeholder="Confirm your password"
            size="large"
            iconRender={(visible) =>
              visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
            }
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isLoading}
            size="large"
            className="w-full"
          >
            Create Account
          </Button>
        </Form.Item>
      </Form>

      <div className="text-xs text-gray-500 text-center">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="text-indigo-600 hover:text-indigo-500">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500">
          Privacy Policy
        </Link>
      </div>

      <Divider>
        <span className="text-gray-500">Already have an account?</span>
      </Divider>

      <div className="text-center">
        <Link href="/login">
          <Button size="large" className="w-full">
            Sign in to existing account
          </Button>
        </Link>
      </div>
    </div>
  )
}
